// =============================================
// نظام المطاعم - Restaurant SaaS
// نظام التوجيه (Router) - Hash-based SPA
// =============================================

import { appState } from './state.js';

/**
 * موجه بسيط يستخدم تجزئة الرابط (hash)
 * لإدارة التنقل بين الصفحات دون إعادة تحميل
 */
class Router {
  constructor() {
    this.routes = [];
    this.currentRoute = null;

    // الاستماع لتغيير التجزئة
    window.addEventListener('hashchange', () => this.resolve());
  }

  /**
   * إضافة مسار جديد
   * @param {string} pattern - نمط المسار (مثل 'dashboard')
   * @param {Function} handler - دالة تعالج المسار
   * @param {Object} options - خيارات إضافية (مثل requireAuth)
   */
  addRoute(pattern, handler, options = {}) {
    this.routes.push({ pattern, handler, options });
  }

  /**
   * الانتقال إلى مسار معين
   * @param {string} path 
   */
  navigate(path) {
    window.location.hash = path;
  }

  /**
   * تحليل المسار الحالي وتشغيل المعالج المناسب
   */
  async resolve() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    
    // البحث عن المسار
    const route = this.routes.find(r => r.pattern === hash);
    
    if (!route) {
      // صفحة غير موجودة
      this.render404();
      return;
    }

    // التحقق من المصادقة
    if (route.options.requireAuth && !appState.get('user')) {
      this.navigate('login');
      return;
    }

    // التحقق من الصلاحيات
    if (route.options.role) {
      const userRole = appState.get('user')?.role;
      if (userRole !== route.options.role && userRole !== 'admin') {
        this.renderUnauthorized();
        return;
      }
    }

    this.currentRoute = route.pattern;

    try {
      // استدعاء معالج المسار
      await route.handler();
    } catch (error) {
      console.error('فشل تحميل الصفحة:', error);
      document.getElementById('pageContainer').innerHTML = `
        <div class="flex items-center justify-center h-full">
          <p class="text-red-500">حدث خطأ أثناء تحميل الصفحة</p>
        </div>`;
    }
  }

  /**
   * عرض صفحة 404
   */
  render404() {
    document.getElementById('pageContainer').innerHTML = `
      <div class="flex flex-col items-center justify-center h-full space-y-4">
        <i class="fas fa-exclamation-triangle text-6xl text-yellow-500"></i>
        <h2 class="text-2xl font-bold">404</h2>
        <p class="text-gray-500">الصفحة غير موجودة</p>
        <a href="#dashboard" class="text-indigo-600 hover:underline">العودة للرئيسية</a>
      </div>`;
  }

  /**
   * عرض صفحة صلاحيات غير كافية
   */
  renderUnauthorized() {
    document.getElementById('pageContainer').innerHTML = `
      <div class="flex flex-col items-center justify-center h-full space-y-4">
        <i class="fas fa-lock text-6xl text-red-500"></i>
        <h2 class="text-2xl font-bold">غير مصرح</h2>
        <p class="text-gray-500">ليس لديك صلاحية الوصول لهذه الصفحة</p>
        <a href="#dashboard" class="text-indigo-600 hover:underline">العودة للرئيسية</a>
      </div>`;
  }
}

// تصدير نسخة واحدة من الموجه
export const router = new Router();
