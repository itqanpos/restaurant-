// =============================================
// نظام المطاعم - Restaurant SaaS
// الملف الأساسي الموحد (App + Api)
// الإصدار: 2.0 النهائي
// =============================================

// ★ تهيئة Supabase (مرة واحدة) ★
const SUPABASE_URL = 'https://xisosjmybqmuzveffhdb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc29zam15YnFtdXp2ZWZmaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzg2OTgsImV4cCI6MjA4MzYxNDY5OH0.w6ozzvUv0VG7PVizc0TFpwfYq8x50AqqOkwrlQ1eSLM';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabase = supabase;

// ============================================
// الواجهة العامة للتطبيق (App)
// ============================================
const App = {
  // ---- الحالة الأساسية ----
  user: null,
  session: null,
  currentPage: 'home',
  language: localStorage.getItem('preferredLanguage') || 'ar',
  currency: 'EGP',
  taxRate: 14,
  restaurant: null,
  branch: null,

  // ---- البيانات المشتركة ----
  products: [],
  categories: [],
  inventory: [],
  discounts: [],
  kitchenOrders: [],
  loyalty: { points: 0, history: [] },

  // ---- الكاشير ----
  cart: [],
  appliedDiscount: null,
  orderType: 'dine_in',
  table: null,
  customer: {},

  // ---- الصلاحيات (معطلة للاختبار) ----
  accessRules: {
    admin: ['home','dashboard','pos','kitchen','products','inventory','reports','discounts','users','settings','qrmenu','loyalty'],
    manager: ['home','dashboard','pos','kitchen','products','inventory','reports','discounts','users','settings','qrmenu'],
    cashier: ['home','dashboard','pos','kitchen'],
    kitchen: ['home','dashboard','kitchen'],
    inventory: ['home','dashboard','inventory'],
    viewer: ['home','dashboard','reports']
  },

  canAccess(page) { return true; }, // ★ معطل مؤقتًا للاختبار ★

  // ========== دوال مساعدة ==========
  formatCurrency(amount) {
    const symbol = this.currency === 'EGP' ? 'ج.م' : this.currency;
    return Number(amount).toFixed(2) + ' ' + symbol;
  },

  t(key) {
    const dict = {
      ar: {
        dashboard:'الرئيسية', pos:'الكاشير', kitchen:'المطبخ',
        inventory:'المخزون', reports:'التقارير', discounts:'الخصومات',
        users:'المستخدمين', settings:'الإعدادات', qrmenu:'قائمة QR',
        loyalty:'الولاء', login:'تسجيل الدخول', home:'الرئيسية'
      },
      en: {
        dashboard:'Dashboard', pos:'POS', kitchen:'Kitchen',
        inventory:'Inventory', reports:'Reports', discounts:'Discounts',
        users:'Users', settings:'Settings', qrmenu:'QR Menu',
        loyalty:'Loyalty', login:'Login', home:'Home'
      }
    };
    return (dict[this.language] && dict[this.language][key]) || key;
  },

  toggleLanguage() {
    this.language = this.language === 'ar' ? 'en' : 'ar';
    localStorage.setItem('preferredLanguage', this.language);
    document.documentElement.lang = this.language;
    document.documentElement.dir = this.language === 'ar' ? 'rtl' : 'ltr';
    this.loadPage(this.currentPage);
  },

  goHome() { this.loadPage('home'); },

  // ========== نظام تحميل الصفحات الديناميكي ==========
  async loadPage(page) {
    if (!this.canAccess(page)) {
      document.getElementById('pageContainer').innerHTML =
        '<div class="p-6 text-center text-red-500"><i class="fas fa-lock text-4xl mb-4"></i><p>ليس لديك صلاحية الوصول لهذه الصفحة</p></div>';
      return;
    }

    const container = document.getElementById('pageContainer');
    try {
      const response = await fetch(`pages/${page}.html`);
      if (!response.ok) throw new Error('صفحة غير موجودة');
      const html = await response.text();
      container.innerHTML = html;

      // زر الرجوع للرئيسية
      const existingBtn = document.getElementById('floatingHomeBtn');
      if (existingBtn) existingBtn.remove();
      if (page !== 'home') {
        const backBtn = document.createElement('button');
        backBtn.className = 'fixed bottom-6 left-6 bg-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-200 z-30';
        backBtn.innerHTML = '<i class="fas fa-home text-xl"></i>';
        backBtn.onclick = () => this.goHome();
        backBtn.id = 'floatingHomeBtn';
        document.body.appendChild(backBtn);
      }

      document.getElementById('headerTitle').textContent = this.t(page);
      this.currentPage = page;
      sessionStorage.setItem('lastPage', page);

      // استدعاء دالة التهيئة الخاصة بالصفحة
      const initFn = 'init' + page[0].toUpperCase() + page.slice(1);
      if (typeof window[initFn] === 'function') await window[initFn]();
    } catch (err) {
      container.innerHTML = `<h2 class="text-2xl font-bold p-6">${this.t(page)}</h2><p class="px-6 text-gray-500">محتوى مؤقت...</p>`;
    }
  },

  // ========== الجلسة والمصادقة ==========
  async checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      this.user = data.session.user;
      this.session = data.session;
      await this.loadTenantData();
      this.showUI();
      await this.loadPage(sessionStorage.getItem('lastPage') || 'home');
    } else {
      this.hideUI();
      await this.loadPage('login');
    }
  },

  async finishLogin(user, session) {
    this.user = user;
    this.session = session;
    await this.loadTenantData();
    this.showUI();
    await this.loadPage('home');
  },

  async loadTenantData() {
    if (!this.user) return;
    try {
      const { data } = await supabase
        .from('user_restaurant_roles')
        .select('restaurant_id, restaurant:restaurants(*), branch:branches(*), role:roles(name)')
        .eq('user_id', this.user.id)
        .limit(1)
        .single();

      if (data) {
        this.restaurant = data.restaurant;
        this.branch = data.branch;
        this.user.role = data.role?.name || 'admin';
        // تحميل البيانات الأساسية
        const [products, inventory, discounts] = await Promise.all([
          Api.products.getAll(data.restaurant_id),
          Api.inventory.getAll(data.restaurant_id),
          Api.discounts.getAll(data.restaurant_id)
        ]);
        this.products = products;
        this.inventory = inventory;
        this.discounts = discounts;
      } else {
        // وضع آمن: صلاحية كاملة لكن بدون بيانات
        this.user.role = 'admin';
        this.restaurant = { id: null, name: 'مطعمي' };
        this.branch = { id: null, name: 'الفرع الرئيسي' };
        this.products = []; this.inventory = []; this.discounts = [];
      }
    } catch (err) {
      console.warn('تعذر تحميل بيانات المستأجر:', err);
      this.user.role = 'admin';
      this.restaurant = { id: null, name: 'مطعمي' };
      this.branch = { id: null, name: 'الفرع الرئيسي' };
      this.products = []; this.inventory = []; this.discounts = [];
    }
  },

  showUI() { document.getElementById('appHeader').style.display = 'flex'; },
  hideUI() { document.getElementById('appHeader').style.display = 'none'; },

  async logout() {
    await supabase.auth.signOut();
    this.user = null; this.session = null;
    this.cart = []; this.appliedDiscount = null;
    this.hideUI();
    await this.loadPage('login');
  },

  // ========== الكاشير ==========
  addToCart(id, name, price, addons = [], notes = '') {
    const existing = this.cart.find(item =>
      item.id === id &&
      JSON.stringify(item.addons || []) === JSON.stringify(addons) &&
      (item.notes || '') === notes
    );
    if (existing) existing.qty++;
    else this.cart.push({ id, name, price, qty: 1, addons, notes });
    if (typeof updateCartDisplay === 'function') updateCartDisplay();
  },

  changeQty(id, delta) {
    const item = this.cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) this.cart = this.cart.filter(i => i.id !== id);
    if (typeof updateCartDisplay === 'function') updateCartDisplay();
  },

  clearCart() {
    this.cart = [];
    this.appliedDiscount = null;
    if (typeof updateCartDisplay === 'function') updateCartDisplay();
  },

  getCartTotals() {
    const subtotal = this.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    let discount = 0;
    if (this.appliedDiscount) {
      discount = this.appliedDiscount.type === 'percentage'
        ? subtotal * (this.appliedDiscount.value / 100)
        : this.appliedDiscount.value;
    }
    return { subtotal, discount, total: Math.max(0, subtotal - discount) };
  },

  async placeOrder(paymentMethod = 'cash') {
    if (!this.cart.length) return;
    const { subtotal, discount, total } = this.getCartTotals();
    const order = {
      restaurant_id: this.restaurant?.id,
      branch_id: this.branch?.id,
      type: this.orderType,
      status: 'new',
      table_number: this.table,
      customer_name: this.customer.name,
      customer_phone: this.customer.phone,
      delivery_address: this.customer.address,
      notes: this.customer.notes,
      subtotal,
      discount_amount: discount,
      total,
      source: 'pos',
      created_by: this.user?.id
    };

    try {
      const newOrder = await Api.orders.create(order, this.cart.map(i => ({
        product_id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.qty,
        notes: [i.addons?.join(', '), i.notes].filter(Boolean).join(' | ')
      })));

      // ★ خصم المخزون (اختياري - حسب الوصفات) ★
      await this.deductInventoryFromCart();

      // ★ إرسال للمحطات والطابعات ★
      this.dispatchToStations(newOrder);

      alert(`✅ تم الطلب #${newOrder.order_number} - الدفع ${paymentMethod}`);
      this.clearCart();
    } catch (e) {
      alert('فشل الطلب: ' + e.message);
    }
  },

  async deductInventoryFromCart() {
    for (const item of this.cart) {
      try {
        const recipes = await Api.recipes.getForProduct(item.id);
        if (!recipes.length) continue;
        const currentInventory = await Api.inventory.getAll(this.restaurant?.id);
        for (const rec of recipes) {
          const invItem = currentInventory.find(i => i.id === rec.inventory_item_id);
          if (invItem) {
            const newQty = invItem.current_quantity - (rec.quantity_used * item.qty);
            await Api.inventory.update(rec.inventory_item_id, { current_quantity: Math.max(0, newQty) });
          }
        }
      } catch (e) {
        console.warn('تعذر خصم المخزون لـ:', item.name, e);
      }
    }
  },

  // ========== المحطات والطابعات ==========
  dispatchToStations(order) {
    let stations = [];
    try { stations = JSON.parse(localStorage.getItem('kitchenStations') || '[]'); } catch (e) {}
    if (!stations.length) return;

    const itemsWithCat = this.cart.map(ci => {
      const prod = this.products.find(p => p.id == ci.id);
      return { ...ci, categoryId: prod?.category_id || null };
    });

    stations.forEach(station => {
      const stationItems = itemsWithCat.filter(i => station.categories?.includes(i.categoryId));
      if (stationItems.length > 0) {
        this.printStationTicket(station.name, stationItems, order.order_number);
      }
    });
  },

  printStationTicket(stationName, items, orderNumber) {
    const win = window.open('', `station_${stationName}`, 'width=400,height=500');
    if (!win) return;
    win.document.write(`
      <html dir="rtl"><head><style>body{font-family:sans-serif;padding:10px}h3{text-align:center}.item{display:flex;justify-content:space-between}</style></head>
      <body><h3>${stationName} - #${orderNumber}</h3><hr>${items.map(i => `<div class="item"><span>${i.name} x${i.qty}</span>${i.notes||''}</div>`).join('')}<hr><p style="text-align:center">${new Date().toLocaleTimeString('ar-EG')}</p><script>setTimeout(()=>window.print(),600)</script></body></html>
    `);
    win.document.close();
  },

  // ========== نقاط التوسع المستقبلية ==========
  // يمكن إضافة دوال جديدة هنا أو تمديد الكائن من ملفات أخرى:
  // App.initLoyalty = function() { ... }
  // App.openSplitBillModal = function() { ... }
  // App.exportReport = function() { ... }
};

// ============================================
// طبقة الاتصال المركزية (Api)
// ============================================
window.Api = {
  products: {
    async getAll(restId) {
      const { data } = await supabase.from('products').select('*, categories(name)').eq('restaurant_id', restId).eq('is_available', true).order('name');
      return data || [];
    },
    async add(restId, product) {
      const { data } = await supabase.from('products').insert({ ...product, restaurant_id: restId }).select().single();
      return data;
    },
    async update(id, updates) {
      const { error } = await supabase.from('products').update(updates).eq('id', id);
      if (error) throw error;
    },
    async remove(id) { await this.update(id, { is_available: false }); }
  },

  categories: {
    async getAll(restId) {
      const { data } = await supabase.from('categories').select('*').eq('restaurant_id', restId).order('sort_order');
      return data || [];
    }
  },

  inventory: {
    async getAll(restId) {
      const { data } = await supabase.from('inventory_items').select('*').eq('restaurant_id', restId).order('name');
      return data || [];
    },
    async add(item) {
      const { data } = await supabase.from('inventory_items').insert(item).select().single();
      return data;
    },
    async update(id, updates) {
      const { error } = await supabase.from('inventory_items').update(updates).eq('id', id);
      if (error) throw error;
    }
  },

  recipes: {
    async getForProduct(productId) {
      const { data } = await supabase.from('recipes').select('id, inventory_item_id, quantity_used, inventory_items(name, unit)').eq('product_id', productId);
      return data || [];
    },
    async add(productId, inventoryItemId, quantityUsed) {
      const { error } = await supabase.from('recipes').upsert({ product_id: productId, inventory_item_id: inventoryItemId, quantity_used: quantityUsed });
      if (error) throw error;
    },
    async remove(recipeId) {
      const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
      if (error) throw error;
    }
  },

  orders: {
    async create(orderData, items) {
      const { data: order } = await supabase.from('orders').insert(orderData).select().single();
      const orderItems = items.map(item => ({ ...item, order_id: order.id }));
      await supabase.from('order_items').insert(orderItems);
      return order;
    },
    async updateStatus(orderId, status) {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;
    },
    async getActive(branchId) {
      const { data } = await supabase.from('orders').select('*, order_items(*)').eq('branch_id', branchId).in('status', ['new','preparing']).order('created_at');
      return data || [];
    },
    subscribeToNew(branchId, callback) {
      return supabase.channel('new-orders').on('postgres_changes', { event:'INSERT', schema:'public', table:'orders', filter:`branch_id=eq.${branchId}` }, payload => callback(payload.new)).subscribe();
    }
  },

  discounts: {
    async getAll(restId) {
      const { data } = await supabase.from('discounts').select('*').eq('restaurant_id', restId).eq('is_active', true);
      return data || [];
    },
    async validate(code, restId) {
      const { data } = await supabase.from('discounts').select('*').eq('code', code).eq('restaurant_id', restId).eq('is_active', true).single();
      if (!data) return null;
      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) return null;
      if (data.valid_until && new Date(data.valid_until) < now) return null;
      if (data.max_uses > 0 && data.current_uses >= data.max_uses) return null;
      return data;
    }
  },

  users: {
    async getRoles(restId) {
      const { data } = await supabase.from('user_restaurant_roles').select('id, user_id, branch_id, users(full_name,email), roles(name), branches(name)').eq('restaurant_id', restId);
      return data || [];
    },
    async assignRole(userId, restId, branchId, roleName) {
      const { data: role } = await supabase.from('roles').select('id').eq('name', roleName).single();
      if (!role) throw new Error('دور غير موجود');
      const { error } = await supabase.from('user_restaurant_roles').insert({ user_id: userId, restaurant_id: restId, branch_id: branchId || null, role_id: role.id });
      if (error) throw error;
    }
  },

  reports: {
    async getSalesSummary(branchId, period = 'today') {
      let start = new Date();
      if (period === 'week') start.setDate(start.getDate() - 7);
      else if (period === 'month') start.setMonth(start.getMonth() - 1);
      else start.setHours(0,0,0,0);
      const { data } = await supabase.from('orders').select('total, created_at').eq('branch_id', branchId).gte('created_at', start.toISOString());
      return data || [];
    },
    async getTopProducts(restId, limit = 10) {
      // يمكن تطويرها بـ RPC لاحقًا
      return [];
    }
  },

  settings: {
    async get(restId) {
      const { data } = await supabase.from('settings').select('*').eq('restaurant_id', restId);
      return data || [];
    },
    async update(restId, key, value) {
      const { error } = await supabase.from('settings').upsert({ restaurant_id: restId, key, value });
      if (error) throw error;
    }
  },

  // ★ نقاط توسعية مستقبلية ★
  loyalty: {
    async getPoints(restId, customerPhone) { /* ... */ },
    async addPoints(restId, customerPhone, points) { /* ... */ }
  },
  delivery: {
    async assignDriver(orderId, driverId) { /* ... */ },
    async trackOrder(orderId) { /* ... */ }
  }
};

// ============================================
// بدء التشغيل
// ============================================
window.App = App;
window.onload = () => App.checkSession();
