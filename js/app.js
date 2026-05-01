// =============================================
// نظام المطاعم - Restaurant SaaS
// التطبيق الرئيسي (متوافق مع index.html الجديد)
// =============================================

const SUPABASE_URL = 'https://xisosjmybqmuzveffhdb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc29zam15YnFtdXp2ZWZmaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzg2OTgsImV4cCI6MjA4MzYxNDY5OH0.w6ozzvUv0VG7PVizc0TFpwfYq8x50AqqOkwrlQ1eSLM';

// إنشاء العميل بشكل آمن
const supabase = window.supabase?.createClient 
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) 
  : supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabase = supabase;

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
  loyaltyPoints: 0,
  restaurant: null,
  branch: null,
  appliedDiscount: null,

  // دوال أساسية
  formatCurrency(amount) {
    return Number(amount).toFixed(2) + ' ج.م';
  },

  t(key) {
    const dict = {
      ar: {
        dashboard: 'الرئيسية', pos: 'الكاشير', kitchen: 'المطبخ',
        inventory: 'المخزون', reports: 'التقارير', discounts: 'الخصومات',
        users: 'المستخدمين', settings: 'الإعدادات', qrmenu: 'قائمة QR'
      },
      en: {
        dashboard: 'Dashboard', pos: 'POS', kitchen: 'Kitchen',
        inventory: 'Inventory', reports: 'Reports', discounts: 'Discounts',
        users: 'Users', settings: 'Settings', qrmenu: 'QR Menu'
      }
    };
    return (dict[this.language] && dict[this.language][key]) || key;
  },

  toggleLanguage() {
    this.language = this.language === 'ar' ? 'en' : 'ar';
    document.documentElement.lang = this.language;
    document.documentElement.dir = this.language === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('langLabel').textContent = this.language === 'ar' ? 'English' : 'العربية';
    // إعادة تحميل الصفحة الحالية باللغة الجديدة
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

  // تحميل الصفحات من ملفات HTML خارجية
  async loadPage(page) {
    const container = document.getElementById('pageContainer');
    if (!container) return;

    try {
      const response = await fetch(`pages/${page}.html`);
      if (!response.ok) throw new Error('صفحة غير موجودة');
      const html = await response.text();
      container.innerHTML = html;
      this.currentPage = page;

      // تحديث الشريط الجانبي (تمييز النشط)
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
      });
      document.getElementById('headerTitle').textContent = this.t(page);

      // استدعاء دالة التهيئة الخاصة بالصفحة إن وجدت
      const initFn = window[`init${page.charAt(0).toUpperCase() + page.slice(1)}`];
      if (typeof initFn === 'function') {
        initFn();
      }
    } catch (err) {
      container.innerHTML = `<p class="text-red-500 p-6">فشل تحميل الصفحة: ${err.message}</p>`;
      console.error(err);
    }
  },

  // تحقق من الجلسة
  async checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      this.user = data.session.user;
      await this.loadRestaurantData();
      this.showUI();
      // تحميل آخر صفحة أو الرئيسية
      const lastPage = sessionStorage.getItem('lastPage') || 'dashboard';
      this.loadPage(lastPage);
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
    document.getElementById('appSidebar').style.display = 'flex';
  },

  hideUI() {
    document.getElementById('appHeader').style.display = 'none';
    document.getElementById('appSidebar').style.display = 'none';
  },

  async logout() {
    await supabase.auth.signOut();
    this.user = null;
    this.hideUI();
    this.loadPage('login');
  },

  // دالة placeOrder بسيطة
  async placeOrder(method = 'cash') {
    alert('الطلب قيد التطوير');
  }
};

// بدء التطبيق
window.onload = () => {
  App.checkSession();
};
