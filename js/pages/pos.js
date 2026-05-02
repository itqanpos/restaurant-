// ----- حالة الكاشير -----
let currentOrderType = 'dine_in';
let selectedTable = null;
let selectedCustomer = { name: '', phone: '', address: '', notes: '' };

async function initPOS() {
  if (!App.products.length && App.restaurant) {
    App.products = await window.Api.getProducts(App.restaurant.id);
  }

  // إعداد أزرار نوع الطلب
  document.getElementById('btnDineIn').addEventListener('click', () => setOrderType('dine_in'));
  document.getElementById('btnTakeaway').addEventListener('click', () => setOrderType('takeaway'));
  document.getElementById('btnDelivery').addEventListener('click', () => setOrderType('delivery'));

  // التصنيفات والمنتجات
  renderCategories();
  renderProducts();
  updateCartDisplay();

  // أزرار التعليق والاسترجاع
  document.getElementById('holdOrderBtn').addEventListener('click', holdOrder);
  document.getElementById('recallOrderBtn').addEventListener('click', recallOrder);
  document.getElementById('placeOrderBtn').addEventListener('click', () => App.placeOrder(currentOrderType, selectedTable, selectedCustomer));
}

function setOrderType(type) {
  currentOrderType = type;
  // تحديث أنماط الأزرار
  document.querySelectorAll('.order-type-btn').forEach(b => {
    b.classList.remove('bg-indigo-600', 'text-white', 'border', 'border-gray-300');
    b.classList.add('border', 'border-gray-300', 'bg-white');
  });
  const activeBtn = document.getElementById('btn' + type.charAt(0).toUpperCase() + type.slice(1).replace('_', ''));
  activeBtn.classList.add('bg-indigo-600', 'text-white');
  activeBtn.classList.remove('bg-white', 'border', 'border-gray-300');

  // فتح المودال المناسب
  if (type === 'dine_in') openTableModal();
  else if (type === 'takeaway') openCustomerModal('takeaway');
  else if (type === 'delivery') openCustomerModal('delivery');
}

// ---- مودال الطاولات ----
function openTableModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3 class="font-bold mb-4">اختر الطاولة</h3>
      <div class="grid grid-cols-5 gap-2" id="tablesGrid">
        ${Array.from({length: 20}, (_,i) => i+1).map(n => `
          <div class="table-cell bg-gray-100 p-2 rounded text-center cursor-pointer hover:bg-indigo-100" data-table="${n}">T${n}</div>
        `).join('')}
      </div>
      <div class="flex justify-end mt-4 gap-2">
        <button class="bg-gray-200 px-4 py-2 rounded" onclick="this.closest('.modal').remove()">إلغاء</button>
        <button id="confirmTableBtn" class="bg-indigo-600 text-white px-4 py-2 rounded" disabled>تأكيد</button>
      </div>
    </div>
  `;
  document.getElementById('posModalsContainer').appendChild(modal);

  modal.querySelectorAll('.table-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      modal.querySelectorAll('.table-cell').forEach(c => c.classList.remove('bg-indigo-600', 'text-white'));
      cell.classList.add('bg-indigo-600', 'text-white');
      selectedTable = cell.dataset.table;
      document.getElementById('confirmTableBtn').disabled = false;
    });
  });
  document.getElementById('confirmTableBtn').addEventListener('click', () => {
    document.getElementById('orderInfoBar').innerText = `طاولة: ${selectedTable}`;
    modal.remove();
  });
}

// ---- مودال معلومات العميل (تيك أواي / دليفري) ----
function openCustomerModal(orderType) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3 class="font-bold mb-4">${orderType === 'delivery' ? 'بيانات التوصيل' : 'معلومات العميل'}</h3>
      <input type="text" id="custName" placeholder="اسم العميل" class="form-input mb-2">
      ${orderType === 'delivery' ? `
        <input type="text" id="custPhone" placeholder="رقم الهاتف" class="form-input mb-2">
        <input type="text" id="custAddress" placeholder="العنوان" class="form-input mb-2">
      ` : ''}
      <textarea id="custNotes" placeholder="ملاحظات" class="form-input mb-2"></textarea>
      <div class="flex justify-end gap-2">
        <button class="bg-gray-200 px-4 py-2 rounded" onclick="this.closest('.modal').remove()">إلغاء</button>
        <button id="confirmCustBtn" class="bg-indigo-600 text-white px-4 py-2 rounded">تأكيد</button>
      </div>
    </div>
  `;
  document.getElementById('posModalsContainer').appendChild(modal);

  document.getElementById('confirmCustBtn').addEventListener('click', () => {
    selectedCustomer.name = document.getElementById('custName').value;
    selectedCustomer.phone = document.getElementById('custPhone')?.value || '';
    selectedCustomer.address = document.getElementById('custAddress')?.value || '';
    selectedCustomer.notes = document.getElementById('custNotes').value;
    document.getElementById('orderInfoBar').innerText = `العميل: ${selectedCustomer.name || 'غير محدد'}`;
    modal.remove();
  });
}

// ---- عرض المنتجات مع الصور والتصنيفات ----
function renderCategories() {
  const cats = [...new Set(App.products.map(p => p.category_id))];
  const container = document.getElementById('categoryFilters');
  container.innerHTML = `<button class="cat-btn bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm" data-cat="all">الكل</button>` +
    cats.map(cat => {
      const name = App.products.find(p => p.category_id === cat)?.categories?.name || cat;
      return `<button class="cat-btn bg-gray-100 px-3 py-1 rounded-full text-sm" data-cat="${cat}">${name}</button>`;
    }).join('');
  container.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('bg-indigo-100','text-indigo-700'));
      btn.classList.add('bg-indigo-100','text-indigo-700');
      renderProducts(btn.dataset.cat);
    });
  });
}

function renderProducts(category = 'all') {
  let filtered = App.products;
  if (category !== 'all') filtered = filtered.filter(p => p.category_id == category);
  const grid = document.getElementById('productGrid');
  grid.innerHTML = filtered.map(p => `
    <div class="product-card bg-white rounded-xl shadow-sm p-3 cursor-pointer hover:shadow-md hover:border-indigo-300 border-2 border-transparent transition relative"
         onclick="openAddonModal('${p.id}', '${p.name}', ${p.price}, '${p.image_url || ''}')">
      ${p.image_url ? `<img src="${p.image_url}" class="w-full h-24 object-cover rounded-lg mb-2">` : ''}
      <div class="font-bold text-sm">${p.name}</div>
      <div class="text-green-600 font-bold">${App.formatCurrency(p.price)}</div>
    </div>
  `).join('');
}

// ---- مودال الإضافات والملاحظات للمنتج ----
function openAddonModal(productId, productName, productPrice, imageUrl) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3 class="font-bold mb-4">${productName}</h3>
      ${imageUrl ? `<img src="${imageUrl}" class="w-full h-32 object-cover rounded-lg mb-3">` : ''}
      <div class="space-y-2">
        <label class="flex items-center gap-2"><input type="checkbox" class="addon-item" value="صوص"> إضافة صوص</label>
        <label class="flex items-center gap-2"><input type="checkbox" class="addon-item" value="جبنة"> إضافة جبنة</label>
        <label class="flex items-center gap-2"><input type="checkbox" class="addon-item" value="بدون جبنة"> بدون جبنة</label>
        <!-- يمكنك إضافة إضافات أخرى هنا -->
      </div>
      <textarea id="itemNotes" class="form-input mt-3" placeholder="ملاحظات إضافية"></textarea>
      <div class="flex justify-end gap-2 mt-4">
        <button class="bg-gray-200 px-4 py-2 rounded" onclick="this.closest('.modal').remove()">إلغاء</button>
        <button id="confirmAddonBtn" class="bg-indigo-600 text-white px-4 py-2 rounded">إضافة للسلة</button>
      </div>
    </div>
  `;
  document.getElementById('posModalsContainer').appendChild(modal);

  document.getElementById('confirmAddonBtn').addEventListener('click', () => {
    const selectedAddons = Array.from(modal.querySelectorAll('.addon-item:checked')).map(inp => inp.value);
    const notes = document.getElementById('itemNotes').value;
    App.addToCart(productId, productName, productPrice, selectedAddons, notes);
    modal.remove();
  });
}

// ---- تعليق الفاتورة (حفظ في localStorage) ----
function holdOrder() {
  if (App.cart.length === 0) return alert('السلة فارغة');
  const heldOrders = JSON.parse(localStorage.getItem('heldOrders') || '[]');
  const newHeld = {
    id: Date.now(),
    type: currentOrderType,
    table: selectedTable,
    customer: {...selectedCustomer},
    cart: App.cart,
    appliedDiscount: App.appliedDiscount,
    time: new Date().toLocaleString('ar-EG')
  };
  heldOrders.push(newHeld);
  localStorage.setItem('heldOrders', JSON.stringify(heldOrders));
  App.clearCart();
  document.getElementById('orderInfoBar').innerText = '';
  selectedTable = null;
  selectedCustomer = {};
  alert('تم تعليق الفاتورة');
}

function recallOrder() {
  const heldOrders = JSON.parse(localStorage.getItem('heldOrders') || '[]');
  if (!heldOrders.length) return alert('لا توجد فواتير معلقة');
  
  // عرض قائمة للاسترجاع
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3 class="font-bold mb-4">استرجاع فاتورة معلقة</h3>
      <div class="space-y-2 max-h-60 overflow-y-auto">
        ${heldOrders.map((order, idx) => `
          <div class="p-2 bg-gray-50 rounded cursor-pointer hover:bg-indigo-50" data-idx="${idx}">
            <strong>فاتورة #${order.id}</strong>
            <p class="text-sm text-gray-500">${order.type} - ${order.cart.length} عناصر</p>
            <p class="text-xs">${order.time}</p>
          </div>
        `).join('')}
      </div>
      <button class="mt-4 bg-gray-200 px-4 py-2 rounded" onclick="this.closest('.modal').remove()">إلغاء</button>
    </div>
  `;
  document.getElementById('posModalsContainer').appendChild(modal);

  modal.querySelectorAll('[data-idx]').forEach(div => {
    div.addEventListener('click', () => {
      const idx = parseInt(div.dataset.idx);
      const restored = heldOrders[idx];
      // استعادة الحالة
      currentOrderType = restored.type;
      selectedTable = restored.table;
      selectedCustomer = restored.customer;
      App.cart = restored.cart;
      App.appliedDiscount = restored.appliedDiscount;
      // حذف من المعلقة
      heldOrders.splice(idx, 1);
      localStorage.setItem('heldOrders', JSON.stringify(heldOrders));
      // تحديث الواجهة
      updateCartDisplay();
      document.getElementById('orderInfoBar').innerText = restored.type === 'dine_in' ? `طاولة: ${restored.table}` : `العميل: ${restored.customer?.name || ''}`;
      modal.remove();
    });
  });
}

// تحديث عرض السلة (معدل)
window.updateCartDisplay = function() {
  // ... (نفس الكود السابق مع إظهار الإضافات)
  const container = document.getElementById('cartItems');
  if (!container) return;
  if (!App.cart.length) {
    container.innerHTML = '<p class="text-gray-400 text-center mt-6">السلة فارغة</p>';
    document.getElementById('posSubtotal').textContent = '0.00 ج.م';
    document.getElementById('posTax').textContent = '0.00 ج.م';
    document.getElementById('posTotal').textContent = '0.00 ج.م';
    return;
  }
  container.innerHTML = App.cart.map(item => `
    <div class="flex justify-between items-start bg-gray-50 p-2 rounded-lg">
      <div class="flex-1">
        <span class="font-medium">${item.name}</span>
        ${item.addons?.length ? `<p class="text-xs text-indigo-600">+ ${item.addons.join(', ')}</p>` : ''}
        ${item.notes ? `<p class="text-xs text-gray-400">${item.notes}</p>` : ''}
        <div class="text-sm text-gray-500">${App.formatCurrency(item.price)} × ${item.qty}</div>
      </div>
      <div class="flex items-center gap-2">
        <button class="qty-btn" onclick="App.changeQty('${item.id}', -1)">-</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="App.changeQty('${item.id}', 1)">+</button>
      </div>
    </div>
  `).join('');
  const { subtotal, discount, total } = App.getCartTotals();
  const tax = total * 0.14;
  document.getElementById('posSubtotal').textContent = App.formatCurrency(subtotal);
  document.getElementById('posTax').textContent = App.formatCurrency(tax);
  document.getElementById('posTotal').textContent = App.formatCurrency(total + tax);
};
