// =============================================
// نظام المطاعم - Restaurant SaaS (نهائي)
// =============================================

// ★ 1. تأسيس Supabase
const SUPABASE_URL = 'https://xisosjmybqmuzveffhdb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc29zam15YnFtdXp2ZWZmaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzg2OTgsImV4cCI6MjA4MzYxNDY5OH0.w6ozzvUv0VG7PVizc0TFpwfYq8x50AqqOkwrlQ1eSLM';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});
window.supabase = supabase;

// ★ 2. طبقة Api
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
      if (order && items.length) {
        await supabase.from('order_items').insert(items.map(i => ({ ...i, order_id: order.id })));
      }
      return order;
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
  }
};

// ★ 3. كائن App
window.App = {
  user: null, session: null, currentPage: 'home',
  language: localStorage.getItem('preferredLanguage') || 'ar',
  currency: 'EGP', taxRate: 14,
  cart: [], products: [], inventory: [], restaurant: null, branch: null,
  appliedDiscount: null,
  orderType: 'dine_in',
  table: null,
  customer: {},

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
    const langLabel = document.getElementById('langLabel');
    if (langLabel) langLabel.textContent = this.language === 'ar' ? 'English' : 'العربية';
    this.loadPage(this.currentPage);
  },

  canAccess() { return true; },
  goHome() { this.loadPage('home'); },

  showUI() {
    const header = document.getElementById('appHeader');
    if (header) header.style.display = 'flex';
  },
  hideUI() {
    const header = document.getElementById('appHeader');
    if (header) header.style.display = 'none';
  },

  async loadPage(page) {
    const titleEl = document.getElementById('headerTitle');
    if (titleEl) titleEl.textContent = this.t(page);
    this.currentPage = page;
    const container = document.getElementById('pageContainer');
    if (!container) return;
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

  async checkSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session) {
        this.user = data.session.user; this.session = data.session;
        await this.loadTenantData();
        this.showUI();
        await this.loadPage('home');
      } else {
        this.hideUI();
        await this.loadPage('login');
      }
    } catch (e) {
      console.error('خطأ في الجلسة:', e);
      this.hideUI();
      await this.loadPage('login');
    }
  },

  async finishLogin(user, session) {
    this.user = user; this.session = session;
    try { await this.loadTenantData(); } catch(e) {}
    this.showUI();
    await this.loadPage('home');
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

  // دوال السلة
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
    const total = Math.max(0, subtotal - discount);
    return { subtotal, discount, total };
  },

  async placeOrder(paymentMethod = 'cash') {
    if (!this.cart.length) return;
    const { subtotal, discount, total } = this.getCartTotals();
    const tax = total * (this.taxRate / 100);

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
      tax_amount: tax,
      total: total + tax,
      source: 'pos',
      created_by: this.user?.id
    };

    try {
      const newOrder = await window.Api.orders.create(order, this.cart.map(i => ({
        product_id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.qty,
        notes: [i.addons?.join(', '), i.notes].filter(Boolean).join(' | ')
      })));
      alert(`✅ تم الطلب #${newOrder.order_number} - الدفع ${paymentMethod}`);
      this.clearCart();
    } catch (e) {
      alert('فشل الطلب: ' + e.message);
    }
  }
};

// ★ 4. بدء التطبيق بعد تحميل الصفحة
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  window.App.checkSession();
} else {
  window.addEventListener('load', () => window.App.checkSession());
}
