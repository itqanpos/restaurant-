// =============================================
// نظام المطاعم - النواة الأساسية (ثابت وآمن)
// =============================================

// تأسيس Supabase مع التحقق من جاهزية المكتبة
function initSupabase() {
  return new Promise((resolve, reject) => {
    if (window.supabase) {
      const supabase = window.supabase.createClient(
        'https://xisosjmybqmuzveffhdb.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc29zam15YnFtdXp2ZWZmaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzg2OTgsImV4cCI6MjA4MzYxNDY5OH0.w6ozzvUv0VG7PVizc0TFpwfYq8x50AqqOkwrlQ1eSLM',
        { auth: { persistSession: true, autoRefreshToken: true } }
      );
      window.supabase = supabase;
      resolve(supabase);
    } else {
      // إعادة المحاولة كل 100ms حتى 20 مرة
      let tries = 0;
      const interval = setInterval(() => {
        tries++;
        if (window.supabase) {
          clearInterval(interval);
          const supabase = window.supabase.createClient(
            'https://xisosjmybqmuzveffhdb.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc29zam15YnFtdXp2ZWZmaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzg2OTgsImV4cCI6MjA4MzYxNDY5OH0.w6ozzvUv0VG7PVizc0TFpwfYq8x50AqqOkwrlQ1eSLM',
            { auth: { persistSession: true, autoRefreshToken: true } }
          );
          window.supabase = supabase;
          resolve(supabase);
        } else if (tries >= 20) {
          clearInterval(interval);
          reject(new Error('Supabase لم يتم تحميله'));
        }
      }, 100);
    }
  });
}

// بدء التشغيل
(async function() {
  let supabase;
  try {
    supabase = await initSupabase();
  } catch (e) {
    console.error(e);
    document.getElementById('pageContainer').innerHTML = '<p class="p-6 text-red-500">تعذر الاتصال بقاعدة البيانات. تأكد من الاتصال بالإنترنت.</p>';
    return;
  }

  // طبقة Api (ثابتة)
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

  // كائن App الأساسي (ثابت)
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
      const langLabel = document.getElementById('langLabel');
      if (langLabel) langLabel.textContent = this.language === 'ar' ? 'English' : 'العربية';
      this.loadPage(this.currentPage);
    },

    canAccess() { return true; },
    goHome() { this.loadPage('home'); },

    showUI() { const h = document.getElementById('appHeader'); if (h) h.style.display = 'flex'; },
    hideUI() { const h = document.getElementById('appHeader'); if (h) h.style.display = 'none'; },

    async loadPage(page) {
      const title = document.getElementById('headerTitle'); if (title) title.textContent = this.t(page);
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
      } catch (e) {
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
    }
  };

  // بدء التطبيق بعد أن يصبح جاهزاً
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.App.checkSession();
  } else {
    document.addEventListener('DOMContentLoaded', () => window.App.checkSession());
  }
})();
