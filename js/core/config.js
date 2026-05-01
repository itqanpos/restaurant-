// =============================================
// نظام المطاعم - Restaurant SaaS
// الإعدادات والثوابت العامة
// =============================================

export const CONFIG = {
  // إصدار التطبيق
  APP_VERSION: '1.0.0',
  APP_NAME: 'Restaurant SaaS',

  // الإعدادات الافتراضية
  DEFAULT_LANGUAGE: 'ar',
  DEFAULT_CURRENCY: 'EGP',
  DEFAULT_TAX_RATE: 14, // نسبة الضريبة المصرية %

  // العملات المدعومة
  CURRENCIES: {
    EGP: { symbol: 'ج.م', name: 'جنيه مصري', nameEn: 'Egyptian Pound' },
    SAR: { symbol: '﷼', name: 'ريال سعودي', nameEn: 'Saudi Riyal' },
    USD: { symbol: '$', name: 'دولار أمريكي', nameEn: 'US Dollar' },
    EUR: { symbol: '€', name: 'يورو', nameEn: 'Euro' },
  },

  // الصفحات المتاحة في التطبيق
  PAGES: [
    { id: 'dashboard', icon: 'th-large', requiresAuth: true },
    { id: 'pos', icon: 'cash-register', requiresAuth: true },
    { id: 'kitchen', icon: 'fire', requiresAuth: true, roles: ['kitchen', 'admin', 'manager'] },
    { id: 'inventory', icon: 'boxes', requiresAuth: true },
    { id: 'reports', icon: 'chart-bar', requiresAuth: true, roles: ['admin', 'manager'] },
    { id: 'settings', icon: 'cog', requiresAuth: true, roles: ['admin'] },
    { id: 'qrmenu', icon: 'qrcode', requiresAuth: false },
  ],

  // أنواع الطلبات
  ORDER_TYPES: {
    dine_in: 'داخل المطعم',
    takeaway: 'تيك أواي',
    delivery: 'دليفري',
  },

  // حالات الطلب في المطبخ
  KITCHEN_STATUSES: {
    new: 'جديد',
    preparing: 'قيد التحضير',
    ready: 'جاهز',
    completed: 'مكتمل',
  },

  // طرق الدفع
  PAYMENT_METHODS: {
    cash: 'نقداً',
    visa: 'فيزا',
    wallet: 'محفظة إلكترونية',
  },

  // باقات الاشتراك
  SUBSCRIPTION_PLANS: {
    starter: { name: 'بادئة', maxBranches: 1, maxUsers: 5 },
    pro: { name: 'برو', maxBranches: 5, maxUsers: 20 },
    enterprise: { name: 'مؤسسية', maxBranches: -1, maxUsers: -1 },
  },
};
