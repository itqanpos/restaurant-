async function initPOS() {
  // تحميل المنتجات من Supabase إذا لم تكن محملة
  if (!App.products.length && App.restaurant) {
    App.products = await window.Api.getProducts(App.restaurant.id);
  }

  const grid = document.getElementById('productGrid');
  grid.innerHTML = App.products.map(p => `
    <div class="product-card bg-white p-3 rounded-xl shadow text-center cursor-pointer hover:bg-indigo-50"
         onclick="App.addToCart('${p.id}', '${p.name}', ${p.price})">
      <div class="font-bold">${p.name}</div>
      <div class="text-green-600">${App.formatCurrency(p.price)}</div>
    </div>
  `).join('');

  document.getElementById('placeOrderBtn').addEventListener('click', () => App.placeOrder());
  updateCartDisplay();
}

function updateCartDisplay() {
  const container = document.getElementById('cartContainer');
  if (!container) return;

  if (!App.cart.length) {
    container.innerHTML = '<p class="text-gray-400 text-center mt-6">السلة فارغة</p>';
    document.getElementById('posSubtotal').textContent = '0.00';
    document.getElementById('posTax').textContent = '0.00';
    document.getElementById('posTotal').textContent = '0.00';
    return;
  }

  container.innerHTML = App.cart.map(item => `
    <div class="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
      <div>
        <span class="font-medium">${item.name}</span>
        <span class="text-sm text-gray-500"> x${item.qty}</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="qty-btn" onclick="App.changeQty('${item.id}', -1)">-</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="App.changeQty('${item.id}', 1)">+</button>
      </div>
    </div>
  `).join('');

  const { subtotal, discount, total } = App.getCartTotals();
  document.getElementById('posSubtotal').textContent = App.formatCurrency(subtotal);
  document.getElementById('posTax').textContent = App.formatCurrency(total * 0.14); // مثال ضريبي
  document.getElementById('posTotal').textContent = App.formatCurrency(total * 1.14);
}
