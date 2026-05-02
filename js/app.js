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
    this.loadPage(this.currentPage);
  },

  goHome() { this.loadPage('home'); },

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
      const initFunc = 'init' + page.charAt(0).toUpperCase() + page.slice(1);
      if (typeof window[initFunc] === 'function') window[initFunc]();
    } catch (err) {
      container.innerHTML = `<h2 class="text-2xl font-bold p-6">${this.t(page)}</h2><p>محتوى مؤقت...</p>`;
    }
  },

  accessRules: {
    admin: ['home','dashboard','pos','kitchen','products','inventory','reports','discounts','users','settings','qrmenu'],
    manager: ['home','dashboard','pos','kitchen','products','inventory','reports','discounts','users','settings','qrmenu'],
    cashier: ['home','dashboard','pos','kitchen'],
    kitchen: ['home','dashboard','kitchen'],
    inventory: ['home','dashboard','inventory'],
    viewer: ['home','dashboard','reports']
  },

  canAccess(page) {
    // صلاحية مؤقتة: اسمح بكل الصفحات أثناء التطوير
    return true;
    // للانتاج: const role = this.user?.role || 'viewer'; return (this.accessRules[role]||[]).includes(page);
  },

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
    try {
      const { data } = await window.supabase
        .from('user_restaurant_roles')
        .select('restaurant_id, restaurants(*), branches(*), roles(name)')
        .eq('user_id', this.user.id)
        .limit(1)
        .single();
      if (data) {
        this.restaurant = data.restaurants;
        this.branch = data.branches;
        this.user.role = data.roles?.name || 'admin';
        try { this.products = await window.Api.getProducts(data.restaurant_id); } catch(e) {}
        try { this.inventory = await window.Api.getInventory(data.restaurant_id); } catch(e) {}
      } else {
        // إنشاء بيانات افتراضية حتى يعمل التطبيق
        this.user.role = 'admin';
        this.restaurant = { id: 'default', name: 'مطعم تجريبي' };
        this.branch = { id: 'default', name: 'الفرع الرئيسي' };
      }
    } catch (err) {
      this.user.role = 'admin';
      this.restaurant = { id: 'default', name: 'مطعم تجريبي' };
      this.branch = { id: 'default', name: 'الفرع الرئيسي' };
    }
  },

  showUI() { document.getElementById('appHeader').style.display = 'flex'; },
  hideUI() { document.getElementById('appHeader').style.display = 'none'; },

  async logout() {
    await window.supabase.auth.signOut();
    this.user = null; this.cart = []; this.loadPage('login');
  },

  addToCart(id, name, price, addons=[], notes='') {
    const existing = this.cart.find(item => item.id === id && JSON.stringify(item.addons||[])===JSON.stringify(addons) && (item.notes||'')===notes);
    existing ? existing.qty++ : this.cart.push({id,name,price,qty:1,addons,notes});
    if (typeof updateCartDisplay === 'function') updateCartDisplay();
  },
  changeQty(id, delta) {
    const item = this.cart.find(i=>i.id===id);
    if(!item) return;
    item.qty += delta;
    if(item.qty<=0) this.cart = this.cart.filter(i=>i.id!==id);
    if(typeof updateCartDisplay==='function') updateCartDisplay();
  },
  clearCart() { this.cart=[]; if(typeof updateCartDisplay==='function') updateCartDisplay(); },
  getCartTotals() {
    const subtotal = this.cart.reduce((s,i)=>s+i.price*i.qty,0);
    let discount = 0;
    if(this.appliedDiscount) discount = this.appliedDiscount.type==='percentage' ? subtotal*(this.appliedDiscount.value/100) : this.appliedDiscount.value;
    return { subtotal, discount, total: Math.max(0,subtotal-discount) };
  },

  async placeOrder(type, table, customer, method) {
    if(!this.cart.length) return;
    const { subtotal, discount, total } = this.getCartTotals();
    alert(`طلب تجريبي (${method}) - الإجمالي: ${this.formatCurrency(total)}`);
    this.clearCart();
  }
};

window.App = App;
window.onload = () => App.checkSession();
