import { AppState } from '../state/store.js';

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
    AppState.currentPage = page;
    const container = document.getElementById('pageContainer');
    if (!container) return;

    try {
      const response = await fetch(`/src/pages/${page}/${page}.html`);
      const html = await response.text();
      container.innerHTML = html;

      // استيراد جافا سكريبت الصفحة
      const module = await import(`../pages/${page}/${page}.js`);
      if (module.init) module.init();
    } catch (err) {
      container.innerHTML = `<h2 class="text-2xl font-bold p-6">صفحة غير موجودة</h2>`;
    }

    document.getElementById('headerTitle').textContent = AppState.t(page);
  }
}

export const router = new Router();
