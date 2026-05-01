// =============================================
// نظام المطاعم - Restaurant SaaS
// التطبيق الرئيسي (النسخة النهائية الكاملة)
// =============================================

const SUPABASE_URL = 'https://xisosjmybqmuzveffhdb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc29zam15YnFtdXp2ZWZmaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzg2OTgsImV4cCI6MjA4MzYxNDY5OH0.w6ozzvUv0VG7PVizc0TFpwfYq8x50AqqOkwrlQ1eSLM';

// إنشاء عميل Supabase بشكل آمن
const supabase = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabase = supabase;

console.log('✅ app.js تم تحميله بنجاح');

// ============================================
// كائن التطبيق الرئيسي
// ============================================
const App = {
  user: null,
  session: null,
  currentPage: 'dashboard',
  language: 'ar',
  currency: 'EGP',
  taxRate: 0,
  cart: [],
  products: [],
  inventory: [],
  kitchenOrders: [],
  loyaltyPoints: 0,
  restaurant: null,
  branch: null,
  appliedDiscount: null,

  // ---------- تنسيق العملة ----------
  formatCurrency(amount) {
    return Number(amount).toFixed(2) + ' ج.م';
  },

  // ---------- الترجمة ----------
  t(key) {
    const dict = {
      ar: {
        dashboard: 'الرئيسية', pos: 'الكاشير', kitchen: 'المطبخ',
        inventory: 'المخزون', reports: 'التقارير', discounts: 'الخصومات',
        users: 'المستخدمين', settings: 'الإعدادات', qrmenu: 'قائمة QR',
        login: 'تسجيل الدخول'
      },
      en: {
        dashboard: 'Dashboard', pos: 'POS', kitchen: 'Kitchen',
        inventory: 'Inventory', reports: 'Reports', discounts: 'Discounts',
        users: 'Users', settings: 'Settings', qrmenu: 'QR Menu',
        login: 'Login'
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
    // تحديث النصوص في الشريط الجانبي
    document.querySelectorAll('.nav-link span').forEach(span => {
      const page = span.parentElement.dataset.page;
      if (page) span.textContent = this.t(page);
    });
    // إعادة تحميل الصفحة الحالية باللغة الجديدة
    const initFn = window[`init${this.currentPage.charAt(0).toUpperCase() + this.currentPage.slice(1)}`];
    if (typeof initFn === 'function') initFn();
    document.getElementById('headerTitle').textContent = this.t(this.currentPage);
  },

  // ---------- تبديل الشريط الجانبي ----------
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

  // ---------- تحميل الصفحات (مع محتوى احتياطي) ----------
  async loadPage(pages) {
    const container = document.getElementById('pageContainer');
    if (!container) return;

    try {
      const response = await fetch(`pages/${page}.html`);
      if (!response.ok) throw new Error('ملف غير موجود');
      const html = await response.text();
      container.innerHTML = html;
    } catch (err) {
      // محتوى احتياطي يظهر اسم الصفحة بدلاً من الفراغ
      container.innerHTML = `
        <h2 class="text-2xl font-bold p-6">${this.t(page)}</h2>
        <p class="px-6 text-gray-500">محتوى الصفحة قيد التحميل...</p>
        <p class="px-6 text-xs text-gray-400">تأكد من وجود ملف pages/${page}.html</p>
      `;
      console.warn(`تعذر تحميل ${page}.html:`, err.message);
    }

    // تحديث التمييز في الشريط الجانبي
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });
    document.getElementById('headerTitle').textContent = this.t(page);
    this.currentPage = page;
    sessionStorage.setItem('lastPage', page);

    // استدعاء دالة التهيئة الخاصة بالصفحة إن وجدت
    const initFn = window[`init${page.charAt(0).toUpperCase() + page.slice(1)}`];
    if (typeof initFn === 'function') {
      initFn();
    }
  },

  // ---------- المصادقة والجلسات ----------
  async checkSession() {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        this.user = data.session.user;
        this.session = data.session;
        await this.loadRestaurantData();
        this.showUI();
        const lastPage = sessionStorage.getItem('lastPage') || 'dashboard';
        this.loadPage(lastPage);
      } else {
        this.hideUI();
        this.loadPage('login');
      }
    } catch (e) {
      console.error('فشل فحص الجلسة:', e);
      this.hideUI();
      this.loadPage('login');
    }
  },

  async loadRestaurantData() {
    if (!this.user) return;
    try {
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
    } catch (e) {
      console.warn('بيانات المطعم غير متوفرة:', e.message);
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
    this.session = null;
    this.hideUI();
    this.loadPage('login');
  },

  // ---------- الكاشير (وظائف مساعدة) ----------
  async placeOrder(method = 'cash') {
    if (this.cart.length === 0) return;
    const subtotal = this.cart.reduce((s, i) => s + i.price * i.qty, 0);
    let discount = 0;
    if (this.appliedDiscount) {
      discount = this.appliedDiscount.type === 'percentage'
        ? subtotal * (this.appliedDiscount.value / 100)
        : this.appliedDiscount.value;
    }
    const total = Math.max(0, subtotal - discount);
    const tax = total * (this.taxRate / 100);
    const finalTotal = total + tax;

    try {
      const order = {
        restaurant_id: this.restaurant?.id,
        branch_id: this.branch?.id,
        type: 'dine_in',
        status: 'new',
        subtotal,
        tax_amount: tax,
        discount_amount: discount,
        total: finalTotal,
        source: 'pos',
        created_by: this.user?.id
      };
      const { data: newOrder, error } = await supabase.from('orders').insert(order).select().single();
      if (error) throw error;
      const items = this.cart.map(item => ({
        order_id: newOrder.id,
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.qty
      }));
      await supabase.from('order_items').insert(items);
      this.kitchenOrders.unshift({
        id: newOrder.id,
        items: this.cart.map(i => `${i.name} ×${i.qty}`),
        status: 'new',
        time: new Date().toLocaleTimeString('ar-EG')
      });
      this.loyaltyPoints += Math.floor(finalTotal / 10);
      alert(`تم الطلب #${newOrder.order_number}\nالإجمالي: ${this.formatCurrency(finalTotal)}`);
    } catch (err) {
      alert('فشل إنشاء الطلب: ' + err.message);
    }
    this.cart = [];
    this.appliedDiscount = null;
    if (typeof updateCartDisplay === 'function') updateCartDisplay();
  }
};

// ============================================
// بدء التطبيق
// ============================================
window.onload = () => {
  App.checkSession();
};
