// حالة الكاشير
let currentOrderType = 'dine_in';
let selectedTable = null;
let selectedCustomer = { name: '', phone: '', address: '', notes: '' };
let heldOrders = JSON.parse(localStorage.getItem('heldOrders') || '[]');

async function initPOS() {
  // جلب المنتجات إذا لم تكن محملة
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

  // تطبيق الخصم
  document.getElementById('applyDiscountBtn').addEventListener('click', applyDiscount);

  // عرض التصنيفات والمنتجات
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

// ======== نوع الطلب ========
function setOrderType(type) {
  currentOrderType = type;
  // تحديث أنماط الأزرار
  document.querySelectorAll('.order-type-btn').forEach(b => {
    b.classList.remove('bg-indigo-600', 'text-white', 'border', 'border-gray-300');
    b.classList.add('bg-white', 'border', 'border-gray-300');
  });
  const activeBtn = document.getElementById('btn' + type.charAt(0).toUpperCase() + type.slice(1).replace('_', ''));
  activeBtn.classList.add('bg-indigo-600', 'text-white');
  activeBtn.classList.remove('bg-white', 'border', 'border-gray-300');

  // فتح المودال المناسب
  if (type === 'dine_in') openTableModal();
  else if (type === 'takeaway') openCustomerModal('takeaway');
  else if (type === 'delivery') openCustomerModal('delivery');
}

// ======== مودال الطاولات ========
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

// ======== مودال معلومات العميل ========
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

// ======== تصنيفات المنتجات ========
function renderCategories() {
  const categories = [...new Set(App.products.map(p => p.category_id))];
  const container = document.getElementById('categoryFilters');
  container.innerHTML = `<button class="cat-btn bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm" data-cat="all">الكل</button>` +
    categories.map(cat => {
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
    <div class="bg-white rounded-xl shadow-sm p-3 text-center cursor-pointer hover:shadow-md hover:border-indigo-300 border-2 border-transparent transition"
         onclick="addToCart('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price})">
      <div class="font-bold text-sm">${p.name}</div>
      <div class="text-green-600 font-bold mt-1">${App.formatCurrency(p.price)}</div>
    </div>
  `).join('');
}

// ======== السلة ========
function addToCart(id, name, price, addons = [], notes = '') {
  App.addToCart(id, name, price, addons, notes);
}

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
  const { subtotal, discount, total } = App.getCartTotals ? App.getCartTotals() : 
    { subtotal: App.cart.reduce((s,i) => s + i.price * i.qty, 0), discount: 0, total: App.cart.reduce((s,i) => s + i.price * i.qty, 0) };
  const tax = total * 0.14;
  document.getElementById('posSubtotal').textContent = App.formatCurrency(subtotal);
  document.getElementById('posTax').textContent = App.formatCurrency(tax);
  document.getElementById('posTotal').textContent = App.formatCurrency(total + tax);
}

// ======== الخصم ========
async function applyDiscount() {
  const code = document.getElementById('discountCode').value.trim();
  if (!code) return;
  try {
    const discount = await window.Api.discounts.validate(code, App.restaurant?.id);
    if (discount) {
      App.appliedDiscount = discount;
      alert(`تم تطبيق الخصم: ${discount.value}${discount.type === 'percentage' ? '%' : ' ج.م'}`);
    } else {
      alert('كود الخصم غير صالح');
    }
    updateCartDisplay();
  } catch (e) {
    alert('فشل تطبيق الخصم');
  }
}

// ======== إتمام الطلب ========
async function placeOrder(paymentMethod = 'cash') {
  if (!App.cart.length) return alert('السلة فارغة');
  
  App.orderType = currentOrderType;
  App.table = selectedTable;
  App.customer = selectedCustomer;
  
  await App.placeOrder(paymentMethod);
  selectedTable = null;
  selectedCustomer = { name: '', phone: '', address: '', notes: '' };
  document.getElementById('orderInfoBar').innerText = '';
}

// ======== تعليق واسترجاع ========
function holdOrder() {
  if (!App.cart.length) return alert('السلة فارغة');
  heldOrders.push({
    id: Date.now(),
    type: currentOrderType,
    table: selectedTable,
    customer: {...selectedCustomer},
    cart: JSON.parse(JSON.stringify(App.cart)),
    appliedDiscount: App.appliedDiscount,
    time: new Date().toLocaleString('ar-EG')
  });
  localStorage.setItem('heldOrders', JSON.stringify(heldOrders));
  App.clearCart();
  document.getElementById('orderInfoBar').innerText = '';
  selectedTable = null;
  selectedCustomer = {};
  alert('تم تعليق الفاتورة');
}

function recallOrder() {
  if (!heldOrders.length) return alert('لا توجد فواتير معلقة');
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3 class="font-bold mb-4">استرجاع فاتورة</h3>
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
      currentOrderType = restored.type;
      selectedTable = restored.table;
      selectedCustomer = restored.customer;
      App.cart = restored.cart;
      App.appliedDiscount = restored.appliedDiscount;
      heldOrders.splice(idx, 1);
      localStorage.setItem('heldOrders', JSON.stringify(heldOrders));
      updateCartDisplay();
      document.getElementById('orderInfoBar').innerText = restored.type === 'dine_in' ? `طاولة: ${restored.table}` : `العميل: ${restored.customer?.name || ''}`;
      modal.remove();
    });
  });
}

// ======== تقسيم الفاتورة ========
function openSplitBillModal() {
  if (!App.cart.length) return;
  const total = App.cart.reduce((s, i) => s + i.price * i.qty, 0);
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3 class="font-bold mb-4">تقسيم الفاتورة</h3>
      <p>الإجمالي: ${App.formatCurrency(total)}</p>
      <input type="number" id="splitCount" value="2" min="2" max="20" class="border p-2 rounded w-full mt-2">
      <p class="mt-2 text-green-600 font-bold">كل شخص: <span id="perPerson">${App.formatCurrency(total / 2)}</span></p>
      <div class="flex gap-2 mt-4">
        <button class="flex-1 bg-gray-200 py-2 rounded" onclick="this.closest('.modal').remove()">إلغاء</button>
      </div>
    </div>
  `;
  document.getElementById('posModalsContainer').appendChild(modal);
  
  modal.querySelector('#splitCount').addEventListener('input', (e) => {
    const count = parseInt(e.target.value) || 1;
    document.getElementById('perPerson').textContent = App.formatCurrency(total / count);
  });
}
