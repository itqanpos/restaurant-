// =============================================
// كاشير كامل (pos.js)
// =============================================
let currentOrderType = 'dine_in';
let selectedTable = null;
let selectedCustomer = { name: '', phone: '', address: '', notes: '' };
let heldOrders = JSON.parse(localStorage.getItem('heldOrders') || '[]');

// ★ تعريف دالة تحديث السلة عالمياً (سيتم استدعاؤها من extensions.js)
window.updateCartDisplay = function() {
  const container = document.getElementById('cartItems');
  if (!container) return;

  if (!App.cart.length) {
    container.innerHTML = '<p class="text-gray-400 text-center mt-8">السلة فارغة</p>';
    updateTotals();
    return;
  }

  container.innerHTML = App.cart.map(item => `
    <div class="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
      <div class="flex-1">
        <span class="font-medium">${item.name}</span>
        ${item.addons?.length ? `<p class="text-xs text-indigo-600">+ ${item.addons.join(', ')}</p>` : ''}
        ${item.notes ? `<p class="text-xs text-gray-400">${item.notes}</p>` : ''}
        <div class="text-sm text-gray-500">${App.formatCurrency(item.price)} × ${item.qty}</div>
      </div>
      <div class="flex items-center gap-2">
        <button class="qty-btn" onclick="App.changeQty('${item.id}', -1)">-</button>
        <span class="font-bold">${item.qty}</span>
        <button class="qty-btn" onclick="App.changeQty('${item.id}', 1)">+</button>
      </div>
    </div>
  `).join('');

  updateTotals();
};

function updateTotals() {
  const { subtotal, discount, total } = App.getCartTotals();
  const tax = total * 0.14;
  document.getElementById('posSubtotal').textContent = App.formatCurrency(subtotal);
  document.getElementById('posTax').textContent = App.formatCurrency(tax);
  document.getElementById('posTotal').textContent = App.formatCurrency(total + tax);
}
async function initPOS() {
  // انتظر حتى تصبح دوال السلة جاهزة (أو ضع مهلة قصوى)
  let attempts = 0;
  while (typeof App.addToCart !== 'function' && attempts < 50) {
    await new Promise(r => setTimeout(r, 50));
    attempts++;
  }

  if (typeof App.addToCart !== 'function') {
    console.error('دوال الكاشير غير متوفرة');
    return;
  }

  // ... باقي كود initPOS (ربط الأزرار، تحميل المنتجات)
}
async function initPOS() {
  if (!App.products.length && App.restaurant && App.restaurant.id) {
    App.products = await window.Api.products.getAll(App.restaurant.id);
  }

  // أزرار نوع الطلب
  document.getElementById('btnDineIn').addEventListener('click', () => setOrderType('dine_in'));
  document.getElementById('btnTakeaway').addEventListener('click', () => setOrderType('takeaway'));
  document.getElementById('btnDelivery').addEventListener('click', () => setOrderType('delivery'));

  // أزرار الدفع
  document.getElementById('payCashBtn').addEventListener('click', () => placeOrder('cash'));
  document.getElementById('payVisaBtn').addEventListener('click', () => placeOrder('visa'));
  document.getElementById('payWalletBtn').addEventListener('click', () => placeOrder('wallet'));

  // تعليق واسترجاع
  document.getElementById('holdOrderBtn').addEventListener('click', holdOrder);
  document.getElementById('recallOrderBtn').addEventListener('click', recallOrder);

  // تقسيم الفاتورة
  document.getElementById('splitBillBtn').addEventListener('click', openSplitBillModal);

  // الخصم
  document.getElementById('applyDiscountBtn').addEventListener('click', applyDiscount);

  renderCategories();
  renderProducts('all');
  updateCartDisplay();

  // اختصارات لوحة المفاتيح
  document.addEventListener('keydown', (e) => {
    if (App.currentPage !== 'pos') return;
    if (e.key === 'F1') { e.preventDefault(); placeOrder('cash'); }
    else if (e.key === 'F2') { e.preventDefault(); placeOrder('visa'); }
    else if (e.key === 'F3') { e.preventDefault(); placeOrder('wallet'); }
  });
}

// ... (باقي دوال setOrderType, openTableModal, openCustomerModal, renderCategories, renderProducts, openAddonModal, applyDiscount, holdOrder, recallOrder, openSplitBillModal كما هي في الكاشير الكامل السابق)
// يجب نسخها من ملف pos.js الكامل السابق دون تغيير.
