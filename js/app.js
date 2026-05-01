const App = {
  user: null,
  session: null,
  currentPage: 'home',
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

  formatCurrency(amount) { return Number(amount).toFixed(2) + ' ج.م'; },

  t(key) {
    const dict = {
      ar: { dashboard:'الرئيسية', pos:'الكاشير', kitchen:'المطبخ', inventory:'المخزون', reports:'التقارير', discounts:'الخصومات', users:'المستخدمين', settings:'الإعدادات', qrmenu:'قائمة QR', login:'تسجيل الدخول', home:'الرئيسية' },
      en: { dashboard:'Dashboard', pos:'POS', kitchen:'Kitchen', inventory:'Inventory', reports:'Reports', discounts:'Discounts', users:'Users', settings:'Settings', qrmenu:'QR Menu', login:'Login', home:'Home' }
    };
    return (dict[this.language] && dict[this.language][key]) || key;
  },

  toggleLanguage() {
    this.language = this.language === 'ar' ? 'en' : 'ar';
    document.documentElement.lang = this.language;
    document.documentElement.dir = this.language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('preferredLanguage', this.language);
    // إعادة تحميل الصفحة الحالية
    this.loadPage(this.currentPage);
  },

  // ------ بدلاً من toggleSidebar ------
  goHome() {
    this.loadPage('home');
  },

  // ------ تحميل الصفحات (مع فحص الصلاحية وزر الرجوع) ------
  async loadPage(page) {
    if (!this.canAccess(page)) {
      document.getElementById('pageContainer').innerHTML = '<p class="text-red-500 p-6">غير مصرح</p>';
      return;
    }

    const container = document.getElementById('pageContainer');
    try {
      const response = await fetch(`pages/${page}.html`);
      if (!response.ok) throw new Error('ملف غير موجود');
      const html = await response.text();
      container.innerHTML = html;

      // إضافة زر الرجوع إذا لم تكن الصفحة الرئيسية
      if (page !== 'home') {
        const backBtn = document.createElement('button');
        backBtn.className = 'fixed bottom-6 left-6 bg-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-200 z-30';
        backBtn.innerHTML = '<i class="fas fa-home text-xl"></i>';
        backBtn.onclick = () => this.goHome();
        backBtn.id = 'floatingHomeBtn';
        document.body.appendChild(backBtn);
      } else {
        const existing = document.getElementById('floatingHomeBtn');
        if (existing) existing.remove();
      }

      document.getElementById('headerTitle').textContent = this.t(page);
      this.currentPage = page;
      sessionStorage.setItem('lastPage', page);

      const initFuncName = 'init' + page.charAt(0).toUpperCase() + page.slice(1);
      if (typeof window[initFuncName] === 'function') {
        window[initFuncName]();
      }
    } catch (err) {
      container.innerHTML = `<h2 class="text-2xl font-bold p-6">${this.t(page)}</h2><p class="px-6 text-gray-500">محتوى مؤقت...</p>`;
    }
  },

  // ------ الصلاحيات ------
  accessRules: {
    admin: ['home','dashboard','pos','kitchen','products','inventory','reports','discounts','users','settings','qrmenu'],
    manager: ['home','dashboard','pos','kitchen','products','inventory','reports','discounts','users','settings','qrmenu'],
    cashier: ['home','dashboard','pos','kitchen'],
    kitchen: ['home','dashboard','kitchen'],
    inventory: ['home','dashboard','inventory'],
    viewer: ['home','dashboard','reports']
  },
  canAccess(page) {
    const role = this.user?.role || 'viewer';
    const allowed = this.accessRules[role] || [];
    return allowed.includes(page);
  },

  // ------ جلسة ------
  async finishLogin(user, session) {
    this.user = user;
    this.session = session;
    await this.loadRestaurantData();
    this.showUI();
    this.loadPage('home');
  },

  async checkSession() {
    const { data } = await window.supabase.auth.getSession();
    if (data.session) {
      this.user = data.session.user;
      this.session = data.session;
      await this.loadRestaurantData();
      this.showUI();
      this.loadPage('home');
    } else {
      this.hideUI();
      this.loadPage('login');
    }
  },

  async loadRestaurantData() {
    if (!this.user) return;
    const { data } = await window.supabase.from('user_restaurant_roles')
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
  },
  hideUI() {
    document.getElementById('appHeader').style.display = 'none';
  },
  async logout() {
    await window.supabase.auth.signOut();
    this.user = null;
    this.cart = [];
    this.loadPage('login');
  },

  // ... addToCart, changeQty, clearCart, getCartTotals, placeOrder (كما هي) ...
  addToCart(id, name, price) {
    const existing = this.cart.find(item => item.id === id);
    if (existing) { existing.qty++; }
    else { this.cart.push({ id, name, price, qty: 1 }); }
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
    const subtotal = this.cart.reduce((s,i) => s + i.price * i.qty, 0);
    let discount = 0;
    if (this.appliedDiscount) {
      discount = this.appliedDiscount.type === 'percentage' ? subtotal * (this.appliedDiscount.value/100) : this.appliedDiscount.value;
    }
    return { subtotal, discount, total: Math.max(0, subtotal - discount) };
  },
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
        product_id: i.id, name: i.name, price: i.price, quantity: i.qty
      })));
      this.dispatchToStations(newOrder);
      alert('تم الطلب #' + newOrder.order_number);
      this.clearCart();
    } catch (e) { alert(e.message); }
  },
  dispatchToStations(order) { /* ... كما سبق ... */ },
  printStationTicket(stationName, items, orderNumber) { /* ... كما سبق ... */ }
};

window.App = App;
window.onload = () => App.checkSession();
