// =============================================
// نظام المطاعم - Restaurant SaaS
// التطبيق الرئيسي (Supabase Live)
// =============================================

// ---------- تهيئة Supabase ----------
const SUPABASE_URL = 'https://xisosjmybqmuzveffhdb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc29zam15YnFtdXp2ZWZmaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzg2OTgsImV4cCI6MjA4MzYxNDY5OH0.w6ozzvUv0VG7PVizc0TFpwfYq8x50AqqOkwrlQ1eSLM';

const supabase = window.supabase || supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabase = supabase;

// ============================================
// التطبيق الرئيسي
// ============================================
const App = {
  user: null,
  session: null,
  restaurant: null,
  branch: null,
  currentPage: 'dashboard',
  language: 'ar',
  currency: 'EGP',
  taxRate: 14,
  cart: [],
  kitchenOrders: [],
  products: [],
  inventory: [],
  loyaltyPoints: 0,

  // ---------- تنسيق العملة ----------
  formatCurrency(amount) {
    const symbol = this.currency === 'EGP' ? 'ج.م' : this.currency;
    return `${Number(amount).toFixed(2)} ${symbol}`;
  },

  // ---------- الترجمة ----------
  t(key) {
    const dict = {
      ar: {
        dashboard: 'الرئيسية', pos: 'الكاشير', kitchen: 'المطبخ',
        inventory: 'المخزون', reports: 'التقارير', settings: 'الإعدادات',
        qrmenu: 'قائمة QR', login: 'تسجيل الدخول'
      },
      en: {
        dashboard: 'Dashboard', pos: 'POS', kitchen: 'Kitchen',
        inventory: 'Inventory', reports: 'Reports', settings: 'Settings',
        qrmenu: 'QR Menu', login: 'Login'
      }
    };
    return (dict[this.language] && dict[this.language][key]) || key;
  },

  // ---------- تبديل اللغة ----------
  toggleLanguage() {
    this.language = this.language === 'ar' ? 'en' : 'ar';
    document.documentElement.lang = this.language;
    document.documentElement.dir = this.language === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('langLabel').textContent = this.language === 'ar' ? 'English' : 'العربية';
    this.loadPage(this.currentPage);
  },

  // ---------- تبديل الشريط الجانبي ----------
  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('hidden');
  },

  // ---------- تحميل الصفحات ----------
  async loadPage(page) {
    const container = document.getElementById('pageContainer');
    if (!container) return;

    try {
      const response = await fetch(`pages/${page}.html`);
      if (!response.ok) throw new Error('صفحة غير موجودة');
      const html = await response.text();
      container.innerHTML = html;
      App.currentPage = page;

      // تحديث الشريط الجانبي
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
      });
      document.getElementById('headerTitle').textContent = App.t(page);

      // استدعاء دالة التهيئة الخاصة بالصفحة
      const initFn = window[`init${page.charAt(0).toUpperCase() + page.slice(1)}`];
      if (typeof initFn === 'function') {
        initFn();
      }
    } catch (err) {
      container.innerHTML = '<p class="text-red-500 p-6">فشل تحميل الصفحة</p>';
      console.error(err);
    }
  },

  // ---------- بناء الشريط الجانبي ----------
  buildNav() {
    const pages = ['dashboard', 'pos', 'kitchen', 'inventory', 'reports', 'settings', 'qrmenu'];
    const icons = {
      dashboard: 'th-large', pos: 'cash-register', kitchen: 'fire',
      inventory: 'boxes', reports: 'chart-bar', settings: 'cog', qrmenu: 'qrcode'
    };
    document.getElementById('mainNav').innerHTML = pages.map(p => `
      <div class="nav-link" data-page="${p}" onclick="App.loadPage('${p}')">
        <i class="fas fa-${icons[p]}"></i> <span>${App.t(p)}</span>
      </div>
    `).join('');
  },

  // ---------- المصادقة ----------
  async checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      this.user = data.session.user;
      this.session = data.session;
      await this.loadRestaurantData();
      this.showUI();
      this.buildNav();
      this.loadPage('dashboard');
    } else {
      this.hideUI();
      this.loadPage('login');
    }
  },

  async loadRestaurantData() {
    if (!this.user) return;
    const { data } = await supabase
      .from('user_restaurant_roles')
      .select('restaurant_id, restaurants(*), branches(*), roles(name)')
      .eq('user_id', this.user.id)
      .single();
    if (data) {
      this.restaurant = data.restaurants;
      this.branch = data.branches;
      this.user.role = data.roles?.name || 'staff';
    }
  },

  showUI() {
    document.getElementById('appHeader').style.display = 'flex';
    document.getElementById('sidebar').style.display = 'flex';
  },

  hideUI() {
    document.getElementById('appHeader').style.display = 'none';
    document.getElementById('sidebar').style.display = 'none';
  },

  async logout() {
    await supabase.auth.signOut();
    this.user = null;
    this.session = null;
    this.hideUI();
    this.loadPage('login');
  },

  // ---------- جلب المنتجات من Supabase ----------
  async fetchProducts() {
    const { data } = await supabase.from('products').select('*').eq('is_available', true);
    this.products = data || [];
    return this.products;
  },

  // ---------- جلب المخزون ----------
  async fetchInventory() {
    const { data } = await supabase.from('inventory_items').select('*');
    this.inventory = data || [];
    return this.inventory;
  },

  // ---------- إتمام الطلب ----------
  async placeOrder(method = 'cash') {
    if (this.cart.length === 0) return;
    const subtotal = this.cart.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = subtotal * (this.taxRate / 100);
    const total = subtotal + tax;

    const order = {
      restaurant_id: this.restaurant?.id,
      branch_id: this.branch?.id,
      type: 'dine_in',
      status: 'new',
      subtotal,
      tax_amount: tax,
      total,
      source: 'pos',
      created_by: this.user?.id
    };

    const { data: newOrder, error } = await supabase.from('orders').insert(order).select().single();
    if (error) return alert('فشل إنشاء الطلب');

    const items = this.cart.map(item => ({
      order_id: newOrder.id,
      product_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.qty
    }));
    await supabase.from('order_items').insert(items);

    // إضافة للمطبخ
    this.kitchenOrders.unshift({
      id: newOrder.id,
      items: this.cart.map(i => `${i.name} ×${i.qty}`),
      status: 'new',
      time: new Date().toLocaleTimeString('ar-EG')
    });

    // نقاط ولاء
    this.loyaltyPoints += Math.floor(total / 10);

    alert(`تم الطلب #${newOrder.order_number}\nالإجمالي: ${this.formatCurrency(total)}`);
    this.cart = [];
    if (this.currentPage === 'pos') window.updateCartDisplay?.();
  }
};

// ============================================
// بدء التطبيق عند تحميل الصفحة
// ============================================
window.onload = () => {
  App.checkSession();
};

// اختصارات الكيبورد
document.addEventListener('keydown', (e) => {
  if (App.currentPage === 'pos') {
    if (e.key === 'F1') { e.preventDefault(); App.placeOrder('cash'); }
    if (e.key === 'F2') { e.preventDefault(); App.placeOrder('visa'); }
    if (e.key === 'F3') { e.preventDefault(); App.placeOrder('wallet'); }
  }
});
