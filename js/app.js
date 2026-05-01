// =============================================
// نظام المطاعم - Restaurant SaaS
// التطبيق الرئيسي (نسخة مستقرة)
// =============================================

const SUPABASE_URL = 'https://xisosjmybqmuzveffhdb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc29zam15YnFtdXp2ZWZmaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzg2OTgsImV4cCI6MjA4MzYxNDY5OH0.w6ozzvUv0VG7PVizc0TFpwfYq8x50AqqOkwrlQ1eSLM';

const supabase = window.supabase || supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabase = supabase;

const App = {
  user: null,
  currentPage: 'dashboard',
  language: 'ar',
  currency: 'EGP',
  taxRate: 14,
  cart: [],
  appliedDiscount: null,
  products: [],
  inventory: [],
  kitchenOrders: [],
  loyaltyPoints: 0,
  restaurant: null,
  branch: null,

  formatCurrency(amount) {
    return Number(amount).toFixed(2) + ' ج.م';
  },

  t(key) {
    const dict = {
      ar: { dashboard:'الرئيسية', pos:'الكاشير', kitchen:'المطبخ', inventory:'المخزون', reports:'التقارير', settings:'الإعدادات', discounts:'الخصومات', users:'المستخدمين', qrmenu:'قائمة QR', login:'تسجيل الدخول' },
      en: { dashboard:'Dashboard', pos:'POS', kitchen:'Kitchen', inventory:'Inventory', reports:'Reports', settings:'Settings', discounts:'Discounts', users:'Users', qrmenu:'QR Menu', login:'Login' }
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
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
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
      if (!response.ok) throw new Error('صفحة غير موجودة');
      const html = await response.text();
      container.innerHTML = html;
      this.currentPage = page;

      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
      });
      document.getElementById('headerTitle').textContent = this.t(page);

      const initFn = window[`init${page.charAt(0).toUpperCase() + page.slice(1)}`];
      if (typeof initFn === 'function') initFn();
    } catch (err) {
      container.innerHTML = '<p class="text-red-500 p-6">فشل تحميل الصفحة</p>';
    }
  },

  buildNav() {
    const pages = ['dashboard', 'pos', 'kitchen', 'inventory', 'reports', 'discounts', 'users', 'settings', 'qrmenu'];
    const icons = { dashboard:'th-large', pos:'cash-register', kitchen:'fire', inventory:'boxes', reports:'chart-bar', discounts:'tags', users:'users', settings:'cog', qrmenu:'qrcode' };
    document.getElementById('mainNav').innerHTML = pages.map(p => `
      <div class="nav-link" data-page="${p}" onclick="App.loadPage('${p}')">
        <i class="fas fa-${icons[p]}"></i> <span>${this.t(p)}</span>
      </div>
    `).join('');
  },

  async checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      this.user = data.session.user;
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
    this.hideUI();
    this.loadPage('login');
  },

  async placeOrder(method = 'cash') {
    if (this.cart.length === 0) return;
    const subtotal = this.cart.reduce((s, i) => s + i.price * i.qty, 0);
    let discount = 0;
    if (this.appliedDiscount) {
      discount = this.appliedDiscount.type === 'percentage' ? subtotal * (this.appliedDiscount.value / 100) : this.appliedDiscount.value;
    }
    const total = Math.max(0, subtotal - discount);
    const tax = total * (this.taxRate / 100);
    const finalTotal = total + tax;

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
    if (error) return alert('فشل إنشاء الطلب');

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
    this.cart = [];
    this.appliedDiscount = null;
    if (typeof updateCartDisplay === 'function') updateCartDisplay();
  }
};

window.onload = () => {
  App.checkSession();
};
