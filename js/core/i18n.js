// =============================================
// نظام المطاعم - Restaurant SaaS
// الترجمة والتدويل (i18n)
// =============================================

import { appState } from './state.js';
import { CONFIG } from './config.js';

// ========== قاموس الترجمة ==========
const translations = {
  ar: {
    // عام
    appName: 'نظام المطاعم',
    loading: 'جاري التحميل...',
    save: 'حفظ',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    search: 'بحث',
    export: 'تصدير',
    print: 'طباعة',
    close: 'إغلاق',
    back: 'رجوع',
    yes: 'نعم',
    no: 'لا',

    // الصفحات
    dashboard: 'الرئيسية',
    pos: 'نقطة البيع',
    kitchen: 'المطبخ',
    inventory: 'المخزون',
    reports: 'التقارير',
    settings: 'الإعدادات',
    qrmenu: 'قائمة QR',

    // المصادقة
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    signIn: 'دخول',
    signUp: 'تسجيل',
    forgotPassword: 'نسيت كلمة المرور؟',
    noAccount: 'ليس لديك حساب؟',

    // الكاشير
    currentOrder: 'الطلب الحالي',
    emptyCart: 'السلة فارغة',
    total: 'الإجمالي',
    subtotal: 'المجموع الفرعي',
    tax: 'الضريبة',
    discount: 'الخصم',
    cash: 'نقداً',
    visa: 'فيزا',
    wallet: 'محفظة',
    placeOrder: 'إتمام الطلب',
    confirmPayment: 'تأكيد الدفع',
    dineIn: 'داخل المطعم',
    takeaway: 'تيك أواي',
    delivery: 'دليفري',
    tableNo: 'رقم الطاولة',
    customerName: 'اسم العميل',
    splitBill: 'تقسيم الفاتورة',
    splitEqually: 'بالتساوي',
    splitByItems: 'حسب الأصناف',
    splitPeople: 'عدد الأشخاص',

    // المطبخ
    newOrder: 'طلب جديد',
    preparing: 'قيد التحضير',
    ready: 'جاهز',
    completed: 'مكتمل',

    // المخزون
    productName: 'اسم المنتج',
    price: 'السعر',
    quantity: 'الكمية',
    unit: 'الوحدة',
    minQuantity: 'الحد الأدنى',
    lowStock: 'منخفض',
    inStock: 'متوفر',
    outOfStock: 'نفذ',

    // التقارير
    salesToday: 'مبيعات اليوم',
    ordersCount: 'عدد الطلبات',
    avgOrder: 'متوسط الطلب',
    inventoryAlerts: 'تنبيهات المخزون',
    latestOrders: 'أحدث الطلبات',
    topProducts: 'المنتجات الأكثر مبيعاً',
    compare: 'مقارنة',
    weekly: 'أسبوعي',
    monthly: 'شهري',

    // الإعدادات
    restaurantName: 'اسم المطعم',
    currency: 'العملة',
    taxRate: 'نسبة الضريبة',
    language: 'اللغة',
    subscription: 'الباقة',
    branches: 'الفروع',

    // الولاء
    points: 'نقاط الولاء',
    earnPoints: 'ستكسب نقاط',
    loyalty: 'الولاء',
  },

  en: {
    // General
    appName: 'Restaurant System',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    export: 'Export',
    print: 'Print',
    close: 'Close',
    back: 'Back',
    yes: 'Yes',
    no: 'No',

    // Pages
    dashboard: 'Dashboard',
    pos: 'Point of Sale',
    kitchen: 'Kitchen',
    inventory: 'Inventory',
    reports: 'Reports',
    settings: 'Settings',
    qrmenu: 'QR Menu',

    // Auth
    login: 'Login',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",

    // POS
    currentOrder: 'Current Order',
    emptyCart: 'Cart is empty',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Tax',
    discount: 'Discount',
    cash: 'Cash',
    visa: 'Visa',
    wallet: 'Wallet',
    placeOrder: 'Place Order',
    confirmPayment: 'Confirm Payment',
    dineIn: 'Dine-in',
    takeaway: 'Takeaway',
    delivery: 'Delivery',
    tableNo: 'Table No.',
    customerName: 'Customer Name',
    splitBill: 'Split Bill',
    splitEqually: 'Equally',
    splitByItems: 'By Items',
    splitPeople: 'By People',

    // Kitchen
    newOrder: 'New Order',
    preparing: 'Preparing',
    ready: 'Ready',
    completed: 'Completed',

    // Inventory
    productName: 'Product Name',
    price: 'Price',
    quantity: 'Quantity',
    unit: 'Unit',
    minQuantity: 'Min. Quantity',
    lowStock: 'Low Stock',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',

    // Reports
    salesToday: "Today's Sales",
    ordersCount: 'Orders Count',
    avgOrder: 'Average Order',
    inventoryAlerts: 'Inventory Alerts',
    latestOrders: 'Latest Orders',
    topProducts: 'Top Products',
    compare: 'Compare',
    weekly: 'Weekly',
    monthly: 'Monthly',

    // Settings
    restaurantName: 'Restaurant Name',
    currency: 'Currency',
    taxRate: 'Tax Rate',
    language: 'Language',
    subscription: 'Plan',
    branches: 'Branches',

    // Loyalty
    points: 'Loyalty Points',
    earnPoints: 'You will earn points',
    loyalty: 'Loyalty',
  }
};

// ========== دوال الترجمة ==========

/**
 * ترجمة مفتاح نصي إلى اللغة الحالية
 * @param {string} key - مفتاح الترجمة
 * @param {Object} params - متغيرات للتضمين (مثل {{name}})
 * @returns {string}
 */
export function t(key, params = {}) {
  const lang = appState.get('language') || CONFIG.DEFAULT_LANGUAGE;
  let text = translations[lang]?.[key] || translations.ar[key] || key;

  // استبدال المتغيرات
  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(`{{${k}}}`, v);
  });

  return text;
}

/**
 * تغيير اللغة
 * @param {string} lang - 'ar' أو 'en'
 */
export function changeLanguage(lang) {
  if (!translations[lang]) return;

  appState.set('language', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  // حفظ التفضيل
  localStorage.setItem('preferredLanguage', lang);
}

/**
 * تهيئة اللغة من التفضيل المحفوظ
 */
export function initLanguage() {
  const saved = localStorage.getItem('preferredLanguage') || CONFIG.DEFAULT_LANGUAGE;
  changeLanguage(saved);
}
