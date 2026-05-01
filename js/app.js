// =============================================
// نظام المطاعم - Restaurant SaaS
// التطبيق الرئيسي (النسخة الشاملة مع المحطات والطابعات)
// =============================================

const App = {
  user: null,
  session: null,
  currentPage: 'dashboard',
  language: 'ar',
  currency: 'EGP',
  taxRate: 14,
  cart: [],
  products: [],
  inventory: [],
  kitchenOrders: [],
  restaurant: null,
  branch: null,
  appliedDiscount: null,

  // ---------- دوال مساعدة ----------
  formatCurrency(amount) {
    return Number(amount).toFixed(2) + ' ج.م';
  },

  t(key) {
    const dict = {
      ar: { dashboard:'الرئيسية', pos:'الكاشير', kitchen:'المطبخ', inventory:'المخزون', reports:'التقارير', discounts:'الخصومات', users:'المستخدمين', settings:'الإعدادات', qrmenu:'قائمة QR', login:'تسجيل الدخول' },
      en: { dashboard:'Dashboard', pos:'POS', kitchen:'Kitchen', inventory:'Inventory', reports:'Reports', discounts:'Discounts', users:'Users', settings:'Settings', qrmenu:'QR Menu', login:'Login' }
    };
    return (dict[this.language] && dict[this.language][key]) || key;
  },

  toggleLanguage() {
    this.language = this.language === 'ar' ? 'en' : 'ar';
    document.documentElement.lang = this.language;
    document.documentElement.dir = this.language === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('langLabel').textContent = this.language === 'ar' ? 'English' : 'العربية';
    this.loadPage(this.currentPage);
  },

  toggleSidebar() {
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !overlay) return;
    if (window.innerWidth < 768) {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    } else {
      sidebar.classList.toggle('hidden');
    }
  },

  // ---------- تحميل الصفحات ----------
  async loadPage(page) {
    const container = document.getElementById('pageContainer');
    if (!container) return;
    try {
      const response = await fetch(`pages/${page}.html`);
      if (!response.ok) throw new Error('ملف غير موجود');
      const html = await response.text();
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<h2 class="text-2xl font-bold p-6">${this.t(page)}</h2><p class="px-6 text-gray-500">محتوى الصفحة قيد التحميل...</p>`;
    }
    document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.page === page));
    document.getElementById('headerTitle').textContent = this.t(page);
    this.currentPage = page;
    sessionStorage.setItem('lastPage', page);

    const initFuncName = 'init' + page.charAt(0).toUpperCase() + page.slice(1);
    if (typeof window[initFuncName] === 'function') {
      window[initFuncName]();
    }
  },

  // ---------- إنهاء تسجيل الدخول بدون إعادة تحميل ----------
  async finishLogin(user, session) {
    this.user = user;
    this.session = session;
    await this.loadRestaurantData();
    this.showUI();
    this.loadPage('dashboard');
  },

  // ---------- الجلسة والمصادقة ----------
  async checkSession() {
    const { data } = await window.supabase.auth.getSession();
    if (data.session) {
      this.user = data.session.user;
      this.session = data.session;
      await this.loadRestaurantData();
      this.showUI();
      this.loadPage(sessionStorage.getItem('lastPage') || 'dashboard');
    } else {
      this.hideUI();
      this.loadPage('login');
    }
  },

  async loadRestaurantData() {
    if (!this.user) return;
    const { data } = await window.supabase
      .from('user_restaurant_roles')
      .select('restaurant_id, restaurants(*), branches(*), roles(name)')
      .eq('user_id', this.user.id).single();
    if (data) {
      this.restaurant = data.restaurants;
      this.branch = data.branches;
      this.user.role = data.roles?.name || 'staff';
      try { this.products = await window.Api.getProducts(data.restaurant_id); } catch(e) {}
      try { this.inventory = await window.Api.getInventory(data.restaurant_id); } catch(e) {}
    }
  },

  showUI() {
    document.getElementById('appHeader').style.display = 'flex';
    document.getElementById('appSidebar').style.display = 'flex';
  },

  hideUI() {
    document.getElementById('appHeader').style.display = 'none';
    document.getElementById('appSidebar').style.display = 'none';
  },

  async logout() {
    await window.supabase.auth.signOut();
    this.user = null;
    this.session = null;
    this.cart = [];
    this.appliedDiscount = null;
    this.loadPage('login');
  },

  // ---------- الكاشير (POS) ----------
  addToCart(id, name, price) {
    const existing = this.cart.find(item => item.id === id);
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({ id, name, price, qty: 1 });
    }
    if (typeof updateCartDisplay === 'function') updateCartDisplay();
  },

  changeQty(id, delta) {
    const item = this.cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      this.cart = this.cart.filter(i => i.id !== id);
    }
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
    const total = Math.max(0, subtotal - discount);
    return { subtotal, discount, total };
  },

  // ---------- إنشاء الطلب مع دعم المحطات والطابعات ----------
  async placeOrder() {
    if (!this.cart.length) return;
    const { subtotal, discount, total } = this.getCartTotals();
    const order = {
      restaurant_id: this.restaurant?.id,
      branch_id: this.branch?.id,
      type: document.getElementById('posOrderType')?.value || 'dine_in',
      status: 'new',
      subtotal,
      discount_amount: discount,
      total,
      source: 'pos',
      created_by: this.user?.id
    };
    try {
      const newOrder = await window.Api.createOrder(order, this.cart.map(i => ({
        product_id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.qty,
        notes: i.notes || ''
      })));

      // ★ تقسيم الطلب حسب المحطات (طابعات / شاشات) ★
      this.dispatchToStations(newOrder);

      alert('تم الطلب #' + newOrder.order_number);
      this.clearCart();
    } catch (e) {
      alert('فشل إنشاء الطلب: ' + e.message);
    }
  },

  // ----- نظام المحطات (طابعات / أقسام) -----
  dispatchToStations(order) {
    // قراءة المحطات من localStorage (حُفظت من صفحة الإعدادات)
    let stations = [];
    try {
      stations = JSON.parse(localStorage.getItem('kitchenStations') || '[]');
    } catch (e) { return; }
    if (!stations.length) return;

    // ربط عناصر السلة بتصنيفاتها
    const itemsWithCat = this.cart.map(cartItem => {
      const product = this.products.find(p => p.id == cartItem.id);
      return { ...cartItem, categoryId: product?.category_id || null };
    });

    // لكل محطة، افتح نافذة منبثقة إذا كان لديها عناصر
    stations.forEach(station => {
      const stationItems = itemsWithCat.filter(item =>
        station.categories?.includes(item.categoryId)
      );
      if (stationItems.length > 0) {
        this.printStationTicket(station.name, stationItems, order.order_number);
      }
    });
  },

  printStationTicket(stationName, items, orderNumber) {
    const width = 400;
    const height = 500;
    const left = screen.width - width - 20;
    const top = 100;
    const win = window.open('', `station_${stationName}`, `width=${width},height=${height},left=${left},top=${top}`);
    if (!win) return;
    win.document.write(`
      <html dir="rtl">
      <head>
        <style>
          body { font-family: 'Tajawal', sans-serif; padding: 10px; font-size: 14px; }
          h3 { text-align: center; margin-bottom: 5px; }
          .item { display: flex; justify-content: space-between; margin: 4px 0; }
          @media print { body { width: 80mm; } }
        </style>
      </head>
      <body>
        <h3>${stationName} - طلب #${orderNumber}</h3>
        <hr>
        ${items.map(i => `<div class="item"><span>${i.name} x${i.qty}</span>${i.notes ? ' ('+i.notes+')' : ''}</div>`).join('')}
        <hr>
        <p style="text-align:center; margin-top:8px">${new Date().toLocaleTimeString('ar-EG')}</p>
        <script>setTimeout(() => { window.print(); }, 600); </script>
      </body>
      </html>
    `);
    win.document.close();
  }
};

window.App = App;
window.onload = () => App.checkSession();
