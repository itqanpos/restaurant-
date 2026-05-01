// =============================================
// كاشير احترافي – POS
// =============================================
async function initPOS() {
  // جلب المنتجات إذا لم تكن موجودة
  if (!App.products.length && App.restaurant) {
    App.products = await window.Api.getProducts(App.restaurant.id);
  }

  // تصنيفات
  const categories = [...new Set(App.products.map(p => p.category_id))];
  const catDiv = document.getElementById('categoryFilters');
  catDiv.innerHTML = `<button class="cat-btn bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm" data-cat="all">الكل</button>` +
    categories.map(cat => {
      const name = App.products.find(p => p.category_id === cat)?.categories?.name || cat;
      return `<button class="cat-btn bg-gray-100 px-3 py-1 rounded-full text-sm" data-cat="${cat}">${name}</button>`;
    }).join('');

  // أحداث التصنيفات والبحث
  catDiv.querySelectorAll('.cat-btn').forEach(btn => btn.addEventListener('click', () => {
    catDiv.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('bg-indigo-100','text-indigo-700'));
    btn.classList.add('bg-indigo-100','text-indigo-700');
    renderProducts(btn.dataset.cat);
  }));
  document.getElementById('posSearch').addEventListener('input', (e) => renderProducts('all', e.target.value));

  // أزرار الدفع
  document.querySelectorAll('.pay-btn').forEach(btn => btn.addEventListener('click', () => {
    App.placeOrder(btn.dataset.method);
  }));

  // تقسيم الفاتورة
  document.getElementById('splitBillBtn').addEventListener('click', () => {
    if (App.cart.length) openSplitBillModal();
  });

  // عرض المنتجات
  renderProducts('all');
  updateCartDisplay();
}

function renderProducts(category = 'all', search = '') {
  let filtered = App.products;
  if (category !== 'all') filtered = filtered.filter(p => p.category_id == category);
  if (search) filtered = filtered.filter(p => p.name.includes(search));

  const grid = document.getElementById('productGrid');
  grid.innerHTML = filtered.map(p => `
    <div class="product-card bg-white p-3 rounded-xl shadow text-center cursor-pointer hover:bg-indigo-50 transition border border-transparent hover:border-indigo-300"
         onclick="App.addToCart('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price})">
      <div class="font-bold text-sm">${p.name}</div>
      <div class="text-green-600 font-bold mt-1">${App.formatCurrency(p.price)}</div>
    </div>
  `).join('');
}

// تحديث عرض السلة (استدعاء من app.js بعد التغيير)
function updateCartDisplay() {
  const container = document.getElementById('cartItems');
  if (!container) return;

  if (!App.cart.length) {
    container.innerHTML = '<p class="text-gray-400 text-center mt-6">السلة فارغة</p>';
    updateTotals();
    return;
  }

  container.innerHTML = App.cart.map(item => `
    <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
      <div class="flex-1">
        <span class="font-medium">${item.name}</span>
        <div class="text-xs text-gray-500">${App.formatCurrency(item.price)} × ${item.qty}</div>
      </div>
      <div class="flex items-center gap-2">
        <button class="qty-btn w-6 h-6 rounded-full border bg-white" onclick="App.changeQty('${item.id}', -1)">-</button>
        <span class="w-6 text-center">${item.qty}</span>
        <button class="qty-btn w-6 h-6 rounded-full border bg-white" onclick="App.changeQty('${item.id}', 1)">+</button>
      </div>
    </div>
  `).join('');

  updateTotals();
}

function updateTotals() {
  const { subtotal, discount, total } = App.getCartTotals();
  const tax = total * 0.14;
  document.getElementById('posSubtotal').textContent = App.formatCurrency(subtotal);
  document.getElementById('posTax').textContent = App.formatCurrency(tax);
  document.getElementById('posTotal').textContent = App.formatCurrency(total + tax);

  if (discount > 0) {
    document.getElementById('discountRow').style.display = 'flex';
    document.getElementById('posDiscount').textContent = '-' + App.formatCurrency(discount);
  } else {
    document.getElementById('discountRow').style.display = 'none';
  }
}

// مودال تقسيم الفاتورة
function openSplitBillModal() {
  const total = App.getCartTotals().total;
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3 class="font-bold mb-4">تقسيم الفاتورة</h3>
      <p>الإجمالي: ${App.formatCurrency(total)}</p>
      <input type="number" id="splitCount" value="2" min="2" class="border p-2 rounded w-full mt-2">
      <p class="mt-2 text-green-600 font-bold">كل شخص: <span id="perPerson">${App.formatCurrency(total / 2)}</span></p>
      <div class="flex gap-2 mt-4">
        <button id="closeSplit" class="flex-1 bg-gray-200 py-2 rounded">إلغاء</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#splitCount').addEventListener('input', (e) => {
    const count = parseInt(e.target.value) || 1;
    document.getElementById('perPerson').textContent = App.formatCurrency(total / count);
  });
  modal.querySelector('#closeSplit').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// ربط دالة updateCartDisplay العامة مع App
window.updateCartDisplay = updateCartDisplay;
