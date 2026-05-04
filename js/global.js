// =============================================
// global.js - دوال الأزرار المشتركة
// =============================================
// هذا الملف يجب أن يُحمّل قبل أي صفحة

window.setOrderType = function(type) {
  if (typeof setOrderTypeLocal === 'function') setOrderTypeLocal(type);
};

window.addToCart = function(id, name, price, addons, notes) {
  if (window.App && typeof App.addToCart === 'function') {
    App.addToCart(id, name, price, addons, notes);
  }
};

window.placeOrder = function(method) {
  if (window.App && typeof App.placeOrder === 'function') {
    App.placeOrder(method);
  }
};

window.changeQty = function(id, delta) {
  if (window.App && typeof App.changeQty === 'function') {
    App.changeQty(id, delta);
  }
};

window.clearCart = function() {
  if (window.App && typeof App.clearCart === 'function') {
    App.clearCart();
  }
};

window.holdOrder = function() {
  if (typeof holdOrderLocal === 'function') holdOrderLocal();
};

window.recallOrder = function() {
  if (typeof recallOrderLocal === 'function') recallOrderLocal();
};

window.openSplitBillModal = function() {
  if (typeof openSplitBillModalLocal === 'function') openSplitBillModalLocal();
};

window.applyDiscount = function() {
  if (typeof applyDiscountLocal === 'function') applyDiscountLocal();
};

window.openAddonModal = function(id, name, price, img) {
  if (typeof openAddonModalLocal === 'function') openAddonModalLocal(id, name, price, img);
};

window.updateCartDisplay = function() {
  if (typeof window._updateCartDisplay === 'function') window._updateCartDisplay();
};

window.App.toggleLanguage = window.App?.toggleLanguage || function(){};
window.App.logout = window.App?.logout || function(){};
window.App.goHome = window.App?.goHome || function(){};
