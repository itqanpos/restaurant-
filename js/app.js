// =============================================
// نظام المطاعم - Restaurant SaaS
// التطبيق الرئيسي (متوافق مع api.js)
// =============================================

const App = {
  user: null,
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

  formatCurrency(amount) { return Number(amount).toFixed(2) + ' ج.م'; },

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
    const initFn = window[`init${page.charAt(0).toUpperCase() + page.slice(1)}`];
    if (typeof initFn === 'function') initFn();
  },

  async checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      this.user = data.session.user;
      await this.loadRestaurantData();
      document.getElementById('appHeader').style.display = 'flex';
      document.getElementById('appSidebar').style.display = 'flex';
      this.loadPage(sessionStorage.getItem('lastPage') || 'dashboard');
    } else {
      document.getElementById('appHeader').style.display = 'none';
      document.getElementById('appSidebar').style.display = 'none';
      this.loadPage('login');
    }
  },

  async loadRestaurantData() {
    if (!this.user) return;
    const { data } = await supabase
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

  async logout() {
    await supabase.auth.signOut();
    this.user = null;
    this.loadPage('login');
  },

  async placeOrder() {
    if (!this.cart.length) return;
    const subtotal = this.cart.reduce((s, i) => s + i.price * i.qty, 0);
    const total = Math.max(0, subtotal - (this.appliedDiscount?.value || 0));
    const order = { restaurant_id: this.restaurant.id, branch_id: this.branch.id, type: 'dine_in', status: 'new', subtotal, total, source: 'pos' };
    await window.Api.createOrder(order, this.cart.map(i => ({ product_id: i.id, name: i.name, price: i.price, quantity: i.qty })));
    this.cart = [];
    alert('تم الطلب بنجاح');
  }
};

window.App = App;
window.onload = () => App.checkSession();
