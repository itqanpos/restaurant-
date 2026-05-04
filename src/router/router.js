class Router {
  constructor() {
    window.addEventListener('hashchange', () => this.resolve());
  }

  navigate(page) {
    window.location.hash = page;
  }

  reload() {
    this.resolve();
  }

  async resolve() {
    const page = window.location.hash.slice(1) || 'home';
    const container = document.getElementById('pageContainer');
    if (!container) return;

    try {
      const response = await fetch(`src/pages/${page}/${page}.html`);
      if (!response.ok) throw new Error('Page not found');
      const html = await response.text();
      container.innerHTML = html;

      // استدعاء init للصفحة
      const module = await import(`../pages/${page}/${page}.js`);
      if (module && typeof module.init === 'function') {
        module.init();
      }
    } catch (err) {
      container.innerHTML = `<h2 class="text-2xl font-bold p-6">404 - الصفحة غير موجودة</h2>`;
    }

    // تحديث عنوان الهيدر (يمكن تحسينه لاحقاً)
    const titles = { home: 'الرئيسية', pos: 'الكاشير', kitchen: 'المطبخ', dashboard: 'الرئيسية', login: 'تسجيل الدخول' };
    document.getElementById('headerTitle').textContent = titles[page] || page;
  }
}

export const router = new Router();
