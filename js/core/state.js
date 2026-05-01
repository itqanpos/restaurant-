// =============================================
// نظام المطاعم - Restaurant SaaS
// إدارة الحالة المركزية (State Management)
// =============================================

/**
 * كائن الحالة العامة للتطبيق.
 * يعمل بنمط Observer بسيط لإعلام المكونات بأي تغيير.
 */
class AppState {
  constructor() {
    this.data = {
      // المستخدم الحالي
      user: null,
      session: null,

      // بيانات المستأجر (المطعم)
      restaurant: null,
      branches: [],
      currentBranch: null,

      // التفضيلات
      language: 'ar',
      currency: 'EGP',

      // حالة التحميل
      loading: true,
    };

    this.listeners = new Map();
  }

  /**
   * الحصول على قيمة من الحالة
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    return this.data[key];
  }

  /**
   * تعيين قيمة في الحالة وإشعار المستمعين
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    if (this.data[key] === value) return;
    this.data[key] = value;
    this.notify(key, value);
  }

  /**
   * الاشتراك في تغييرات مفتاح محدد
   * @param {string} key
   * @param {Function} callback
   * @returns {Function} دالة إلغاء الاشتراك
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);

    // إرجاع دالة لإلغاء الاشتراك
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  /**
   * إشعار جميع المستمعين لمفتاح معين
   * @param {string} key
   * @param {*} value
   */
  notify(key, value) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => callback(value));
    }
  }
}

export const appState = new AppState();
