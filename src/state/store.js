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
  discounts: [],
  kitchenOrders: [],
  appliedDiscount: null,
  orderType: 'dine_in',
  table: null,
  customer: {},

  // دوال مساعدة (تضاف ديناميكياً)
};

// دوال السلة (ستُضاف من api أو pos)
// سيتم إضافتها عبر init
