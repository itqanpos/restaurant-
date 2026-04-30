// =============================================
// Internationalization (i18n) - نسخة موسعة
// =============================================

const i18n = {
  currentLang: 'ar',
  translations: {
    ar: {
      dashboard: 'الرئيسية', pos: 'نقطة البيع', kitchen: 'المطبخ',
      inventory: 'المخزون', reports: 'التقارير', settings: 'الإعدادات',
      qrmenu: 'قائمة QR',
      currentOrder: 'الطلب الحالي', emptyCart: 'السلة فارغة',
      total: 'الإجمالي', cash: 'نقداً', visa: 'فيزا', wallet: 'محفظة',
      placeOrder: 'إتمام الطلب', confirmPayment: 'تأكيد الدفع',
      cancel: 'إلغاء', save: 'حفظ', logout: 'تسجيل الخروج',
      addToCart: 'أضف للسلة', dineIn: 'داخل المطعم',
      takeaway: 'تيك أواي', delivery: 'دليفري',
      tableNo: 'رقم الطاولة', customerName: 'اسم العميل',
      salesToday: 'مبيعات اليوم', ordersCount: 'عدد الطلبات',
      avgOrder: 'متوسط الطلب', inventoryAlerts: 'تنبيهات المخزون',
      latestOrders: 'أحدث الطلبات',
      preparing: 'قيد التحضير', ready: 'جاهز', completed: 'مكتمل',
      lowStock: 'منخفض', inStock: 'متوفر',
      search: 'بحث', export: 'تصدير',
      productName: 'اسم المنتج', price: 'السعر',
      quantity: 'الكمية', actions: 'إجراءات',
      splitBill: 'تقسيم الفاتورة',
      splitEqually: 'بالتساوي',
      splitByItems: 'حسب الأصناف',
      splitPeople: 'عدد الأشخاص',
      points: 'نقاط الولاء',
      earnPoints: 'ستكسب نقاط',
      loyalty: 'الولاء',
      compare: 'مقارنة',
      weekly: 'أسبوعي',
      monthly: 'شهري',
      subscription: 'الباقة',
      restaurantSelection: 'اختيار المطعم',
    },
    en: {
      dashboard: 'Dashboard', pos: 'POS', kitchen: 'Kitchen',
      inventory: 'Inventory', reports: 'Reports', settings: 'Settings',
      qrmenu: 'QR Menu',
      currentOrder: 'Current Order', emptyCart: 'Cart is empty',
      total: 'Total', cash: 'Cash', visa: 'Visa', wallet: 'Wallet',
      placeOrder: 'Place Order', confirmPayment: 'Confirm Payment',
      cancel: 'Cancel', save: 'Save', logout: 'Logout',
      addToCart: 'Add to Cart', dineIn: 'Dine-in',
      takeaway: 'Takeaway', delivery: 'Delivery',
      tableNo: 'Table No', customerName: 'Customer Name',
      salesToday: "Today's Sales", ordersCount: 'Orders Count',
      avgOrder: 'Average Order', inventoryAlerts: 'Inventory Alerts',
      latestOrders: 'Latest Orders',
      preparing: 'Preparing', ready: 'Ready', completed: 'Completed',
      lowStock: 'Low Stock', inStock: 'In Stock',
      search: 'Search', export: 'Export',
      productName: 'Product Name', price: 'Price',
      quantity: 'Quantity', actions: 'Actions',
      splitBill: 'Split Bill',
      splitEqually: 'Equally',
      splitByItems: 'By Items',
      splitPeople: 'Number of People',
      points: 'Loyalty Points',
      earnPoints: 'You will earn points',
      loyalty: 'Loyalty',
      compare: 'Compare',
      weekly: 'Weekly',
      monthly: 'Monthly',
      subscription: 'Plan',
      restaurantSelection: 'Select Restaurant',
    }
  },
  t(key) { return this.translations[this.currentLang]?.[key] || key; },
  setLanguage(lang) {
    this.currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('langToggle').innerHTML = lang === 'ar' 
      ? '<i class="fas fa-globe"></i> <span>English</span>'
      : '<i class="fas fa-globe"></i> <span>العربية</span>';
    App.navigateTo(App.currentPage);
  }
};
