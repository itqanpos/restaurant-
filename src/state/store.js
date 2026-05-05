export const AppState = {
  user: null,
  session: null,
  restaurant: null,
  branch: null,
  language: 'ar',
  currency: 'EGP',
  taxRate: 14,
  cart: [],
  products: [],
  inventory: [],
  currentPage: 'home',

  formatCurrency(amount) {
    return Number(amount).toFixed(2) + ' ج.م';
  },

  t(key) {
    const dict = {
      ar: {
        home: 'الرئيسية',
        login: 'تسجيل الدخول',
        pos: 'الكاشير',
        kitchen: 'المطبخ',
        products: 'المنتجات',
        inventory: 'المخزون',
        reports: 'التقارير',
        discounts: 'الخصومات',
        users: 'المستخدمين',
        settings: 'الإعدادات',
        qrmenu: 'قائمة QR'
      },
      en: {
        home: 'Home',
        login: 'Login',
        pos: 'POS',
        kitchen: 'Kitchen',
        products: 'Products',
        inventory: 'Inventory',
        reports: 'Reports',
        discounts: 'Discounts',
        users: 'Users',
        settings: 'Settings',
        qrmenu: 'QR Menu'
      }
    };
    return (dict[this.language] && dict[this.language][key]) || key;
  }
};
