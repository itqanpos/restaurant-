// =============================================
// نظام المطاعم - Restaurant SaaS (v2.0 المراجع)
// =============================================

// ★ 1. الاتصال بـ Supabase (بمجرد تحميل المكتبة)
const SUPABASE_URL = 'https://xisosjmybqmuzveffhdb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc29zam15YnFtdXp2ZWZmaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzg2OTgsImV4cCI6MjA4MzYxNDY5OH0.w6ozzvUv0VG7PVizc0TFpwfYq8x50AqqOkwrlQ1eSLM';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});
window.supabase = supabase;

// ★ 2. طبقة Api (فورية)
window.Api = {
  products: {
    async getAll(restId) {
      const { data } = await supabase.from('products').select('*, categories(name)').eq('restaurant_id', restId).eq('is_available', true).order('name');
      return data || [];
    }
  },
  inventory: {
    async getAll(restId) {
      const { data } = await supabase.from('inventory_items').select('*').eq('restaurant_id', restId).order('name');
      return data || [];
    }
  },
  orders: {
    async create(orderData, items) {
      const { data: order } = await supabase.from('orders').insert(orderData).select().single();
      if (order && items.length) await supabase.from('order_items').insert(items.map(i => ({ ...i, order_id: order.id })));
      return order;
    }
  },
  discounts: {
    async getAll(restId) {
      const { data } = await supabase.from('discounts').select('*').eq('restaurant_id', restId).eq('is_active', true);
      return data || [];
    }
  }
};

// ★ 3. كائن App (فوري)
window.App = {
  user: null, session: null, currentPage: 'home',
  language: localStorage.getItem('preferredLanguage') || 'ar',
  currency: 'EGP', taxRate: 14,
  cart: [], products: [], inventory: [], restaurant: null, branch: null,

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
    localStorage.setItem('preferredLanguage', this.language);
    document.documentElement.lang = this.language;
    document.documentElement.dir = this.language === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('langLabel').textContent = this.language === 'ar' ? 'English' : 'العربية';
    this.loadPage(this.currentPage);
  },

  canAccess() { return true; },
  goHome() { this.loadPage('home'); },

  showUI() { document.getElementById('appHeader').style.display = 'flex'; },
  hideUI() { document.getElementById('appHeader').style.display = 'none'; },

  async loadPage(page) {
    document.getElementById('headerTitle').textContent = this.t(page);
    this.currentPage = page;
    const container = document.getElementById('pageContainer');
    try {
      const resp = await fetch(`pages/${page}.html`);
      if (!resp.ok) throw new Error('ملف غير موجود');
      const html = await resp.text();
      container.innerHTML = html;

      const initFn = 'init' + page[0].toUpperCase() + page.slice(1);
      if (typeof window[initFn] === 'function') {
        try { await window[initFn](); } catch(e) { console.error(e); }
      }
    } catch (err) {
      container.innerHTML = `<h2 class="text-2xl font-bold p-6">${this.t(page)}</h2><p class="px-6 text-gray-500">محتوى مؤقت...</p>`;
    }
  },

  async finishLogin(user, session) {
    this.user = user; this.session = session;
    await this.loadTenantData();
    this.showUI();
    await this.loadPage('home');
  },

  async checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      this.user = data.session.user; this.session = data.session;
      await this.loadTenantData();
      this.showUI();
      await this.loadPage('home');
    } else {
      this.hideUI();
      await this.loadPage('login');
    }
  },

  async loadTenantData() {
    if (!this.user) return;
    try {
      const { data } = await supabase.from('user_restaurant_roles')
        .select('restaurant_id, restaurants(*), branches(*), roles(name)')
        .eq('user_id', this.user.id).limit(1).single();
      if (data) {
        this.restaurant = data.restaurants; this.branch = data.branches;
        this.user.role = data.roles?.name || 'admin';
        this.products = await window.Api.products.getAll(data.restaurant_id);
        this.inventory = await window.Api.inventory.getAll(data.restaurant_id);
      } else {
        this.user.role = 'admin'; this.products = []; this.inventory = [];
      }
    } catch (e) {
      this.user.role = 'admin'; this.products = []; this.inventory = [];
    }
  },

  async logout() {
    await supabase.auth.signOut();
    this.user = null; this.cart = [];
    this.hideUI();
    await this.loadPage('login');
  },

  addToCart(id, name, price) {
    const existing = this.cart.find(i => i.id === id);
    existing ? existing.qty++ : this.cart.push({id, name, price, qty:1});
    if (typeof updateCartDisplay === 'function') updateCartDisplay();
  },

  changeQty(id, delta) {
    const item = this.cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) this.cart = this.cart.filter(i => i.id !== id);
    if (typeof updateCartDisplay === 'function') updateCartDisplay();
  },

  clearCart() { this.cart = []; if (typeof updateCartDisplay === 'function') updateCartDisplay(); }
};

// ★ 4. بدء التطبيق (ينتظر DOM ليصبح جاهزاً)
window.addEventListener('load', () => {
  App.checkSession();
});
