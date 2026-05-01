// =============================================
// نظام المطاعم - Restaurant SaaS
// صفحة نقطة البيع (POS)
// =============================================

import { appState } from '../core/state.js';
import { t } from '../core/i18n.js';
import { updateHeaderTitle, toggleAppUI } from '../shared/layout.js';
import { requireAuth } from '../modules/auth/auth.guard.js';
import { formatCurrency, calculateTax, round, showToast, generateId } from '../shared/utils.js';
import { productsAPI } from '../modules/products/products.api.js';
import { ordersAPI } from '../modules/orders/orders.api.js';
import { Modal, confirmModal } from '../shared/components/Modal.js';

// حالة الكاشير المحلية
const posState = {
  cart: [],
  orderType: 'dine_in',
  tableNumber: '',
  customerName: '',
  customerPhone: '',
  discount: 0,
  products: [],
  categories: [],
  loading: false,
};

/**
 * عرض صفحة الكاشير
 */
export async function renderPOSPage() {
  if (!requireAuth()) return;

  toggleAppUI(true);
  updateHeaderTitle(t('pos'));

  const container = document.getElementById('pageContainer');
  if (!container) return;

  posState.loading = true;
  renderPOSLayout(container);

  // جلب المنتجات والأصناف
  try {
    const [products, categories] = await Promise.all([
      productsAPI.getProducts({ isAvailable: true }),
      productsAPI.getCategories(),
    ]);
    posState.products = products;
    posState.categories = categories;
    renderProductGrid();
  } catch (error) {
    console.error('فشل جلب المنتجات:', error);
    showToast('فشل تحميل المنتجات', 'error');
  } finally {
    posState.loading = false;
  }

  renderCart();
}

/**
 * عرض هيكل صفحة الكاشير
 */
function renderPOSLayout(container) {
  container.innerHTML = `
    <div class="flex h-full fade-in">
      <!-- منطقة المنتجات -->
      <div class="flex-1 flex flex-col">
        <!-- شريط نوع الطلب -->
        <div class="bg-white shadow-sm p-3 flex flex-wrap gap-2 border-b">
          <!-- نوع الطلب -->
          <select id="orderTypeSelect" class="border rounded-lg p-2 text-sm">
            <option value="dine_in">${t('dineIn')}</option>
            <option value="takeaway">${t('takeaway')}</option>
            <option value="delivery">${t('delivery')}</option>
          </select>
          
          <!-- رقم الطاولة (يظهر فقط في dine_in) -->
          <input type="text" id="tableNumberInput" placeholder="${t('tableNo')}" 
            class="border rounded-lg p-2 w-24 text-sm">
          
          <!-- اسم العميل -->
          <input type="text" id="customerNameInput" placeholder="${t('customerName')}" 
            class="border rounded-lg p-2 flex-1 min-w-[150px] text-sm">
          
          <!-- بحث -->
          <input type="text" id="productSearch" placeholder="${t('search')}..." 
            class="border rounded-lg p-2 w-40 text-sm">
        </div>

        <!-- الأصناف -->
        <div id="categoryTabs" class="bg-white px-3 py-2 flex gap-2 overflow-x-auto border-b">
          <button class="category-tab px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700" data-category="all">
            ${t('all') || 'الكل'}
          </button>
          <!-- الأصناف تُضاف ديناميكياً -->
        </div>

        <!-- شبكة المنتجات -->
        <div id="productGrid" class="flex-1 overflow-y-auto p-4">
          <div class="flex items-center justify-center h-full text-gray-400">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
          </div>
        </div>
      </div>

      <!-- سلة المشتريات -->
      <div class="w-80 lg:w-96 bg-white border-r flex flex-col flex-shrink-0 shadow-lg">
        <!-- الهيدر -->
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="font-bold text-lg">${t('currentOrder')}</h2>
          <div class="flex gap-2">
            <button id="splitBillBtn" class="text-indigo-600 hover:text-indigo-800 text-sm" title="${t('splitBill')}">
              <i class="fas fa-divide"></i>
            </button>
            <button id="clearCartBtn" class="text-red-500 hover:text-red-700" title="مسح">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <!-- محتويات السلة -->
        <div id="cartContainer" class="flex-1 overflow-y-auto p-4 space-y-3">
          <p class="text-gray-400 text-center mt-8">${t('emptyCart')}</p>
        </div>

        <!-- ملخص السلة والدفع -->
        <div class="border-t p-4 bg-gray-50 space-y-3">
          <!-- الخصم -->
          <div class="flex items-center gap-2">
            <input type="number" id="discountInput" placeholder="${t('discount')}" 
              class="border rounded-lg p-2 w-24 text-sm" value="0" min="0">
            <button id="applyDiscountBtn" class="text-xs bg-gray-200 px-2 py-2 rounded-lg">
              ${t('apply') || 'تطبيق'}
            </button>
          </div>
          
          <!-- الإجماليات -->
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span>${t('subtotal')}</span>
              <span id="subtotalDisplay">0.00</span>
            </div>
            <div class="flex justify-between">
              <span>${t('tax')}</span>
              <span id="taxDisplay">0.00</span>
            </div>
            <div class="flex justify-between" id="discountRow" style="display:none">
              <span>${t('discount')}</span>
              <span id="discountDisplay" class="text-red-500">0.00</span>
            </div>
            <div class="flex justify-between font-bold text-lg border-t pt-2">
              <span>${t('total')}</span>
              <span id="totalDisplay">0.00</span>
            </div>
          </div>

          <!-- أزرار الدفع السريع -->
          <div class="grid grid-cols-3 gap-2">
            <button onclick="window.posQuickPay('cash')" 
              class="bg-green-600 text-white p-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
              <i class="fas fa-money-bill"></i> ${t('cash')}
            </button>
            <button onclick="window.posQuickPay('visa')" 
              class="bg-blue-600 text-white p-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              <i class="fab fa-cc-visa"></i> ${t('visa')}
            </button>
            <button onclick="window.posQuickPay('wallet')" 
              class="bg-purple-600 text-white p-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition">
              <i class="fas fa-wallet"></i> ${t('wallet')}
            </button>
          </div>

          <button id="placeOrderBtn" 
            class="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed" disabled>
            ${t('placeOrder')}
          </button>
        </div>
      </div>
    </div>
  `;

  bindEvents();
}

/**
 * ربط الأحداث
 */
function bindEvents() {
  // نوع الطلب
  document.getElementById('orderTypeSelect').addEventListener('change', (e) => {
    posState.orderType = e.target.value;
    document.getElementById('tableNumberInput').style.display = 
      e.target.value === 'dine_in' ? 'block' : 'none';
  });

  // البحث
  document.getElementById('productSearch').addEventListener('input', (e) => {
    renderProductGrid(e.target.value);
  });

  // الخصم
  document.getElementById('applyDiscountBtn').addEventListener('click', () => {
    const val = parseFloat(document.getElementById('discountInput').value) || 0;
    posState.discount = val;
    renderCart();
  });

  // مسح السلة
  document.getElementById('clearCartBtn').addEventListener('click', () => {
    posState.cart = [];
    renderCart();
  });

  // تقسيم الفاتورة
  document.getElementById('splitBillBtn').addEventListener('click', () => openSplitBill());

  // إتمام الطلب
  document.getElementById('placeOrderBtn').addEventListener('click', () => placeOrder());

  // الدفع السريع (دوال عامة)
  window.posQuickPay = (method) => quickPay(method);
}

/**
 * عرض شبكة المنتجات
 */
function renderProductGrid(search = '') {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  let filtered = posState.products;
  if (search) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="text-gray-400 text-center mt-8">لا توجد منتجات</p>';
    return;
  }

  grid.innerHTML = filtered.map(product => `
    <div class="product-card bg-white rounded-xl shadow-sm p-4 text-center cursor-pointer hover:shadow-md hover:border-indigo-400 border-2 border-transparent transition transform active:scale-95"
      onclick="window.addToCart('${product.id}', '${product.name.replace(/'/g, "\\'")}', ${product.price})">
      <div class="text-xs text-gray-400 mb-1">${product.categories?.name || ''}</div>
      <div class="font-bold text-gray-800">${product.name}</div>
      <div class="text-green-600 font-bold mt-2">${formatCurrency(product.price)}</div>
    </div>
  `).join('');

  // دوال عامة للعربة
  window.addToCart = (id, name, price) => {
    const existing = posState.cart.find(item => item.id === id);
    if (existing) {
      existing.quantity++;
    } else {
      posState.cart.push({ id, name, price, quantity: 1 });
    }
    renderCart();
  };

  window.changeQty = (id, delta) => {
    const item = posState.cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      posState.cart = posState.cart.filter(i => i.id !== id);
    }
    renderCart();
  };
}

/**
 * تحديث عرض السلة
 */
function renderCart() {
  const container = document.getElementById('cartContainer');
  const placeBtn = document.getElementById('placeOrderBtn');
  if (!container) return;

  if (posState.cart.length === 0) {
    container.innerHTML = `<p class="text-gray-400 text-center mt-8">${t('emptyCart')}</p>`;
    placeBtn.disabled = true;
    updateTotals();
    return;
  }

  container.innerHTML = posState.cart.map(item => `
    <div class="cart-item flex justify-between items-center bg-gray-50 rounded-xl p-3">
      <div class="flex-1">
        <div class="font-medium text-sm">${item.name}</div>
        <div class="text-xs text-gray-500">${formatCurrency(item.price)} × ${item.quantity}</div>
      </div>
      <div class="flex items-center gap-2">
        <button class="qty-btn w-7 h-7 rounded-full bg-white border flex items-center justify-center hover:bg-gray-200"
          onclick="window.changeQty('${item.id}', -1)">-</button>
        <span class="font-bold w-6 text-center">${item.quantity}</span>
        <button class="qty-btn w-7 h-7 rounded-full bg-white border flex items-center justify-center hover:bg-gray-200"
          onclick="window.changeQty('${item.id}', 1)">+</button>
      </div>
    </div>
  `).join('');

  placeBtn.disabled = false;
  updateTotals();
}

/**
 * تحديث عرض الإجماليات
 */
function updateTotals() {
  const subtotal = posState.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = appState.get('taxRate') || 14;
  const discount = posState.discount || 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = calculateTax(afterDiscount, taxRate);
  const total = afterDiscount + tax;

  document.getElementById('subtotalDisplay').textContent = formatCurrency(subtotal);
  document.getElementById('taxDisplay').textContent = formatCurrency(tax);
  document.getElementById('totalDisplay').textContent = formatCurrency(total);

  const discountRow = document.getElementById('discountRow');
  if (discount > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('discountDisplay').textContent = `-${formatCurrency(discount)}`;
  } else {
    discountRow.style.display = 'none';
  }
}

/**
 * إتمام الطلب
 */
async function placeOrder() {
  if (posState.cart.length === 0) {
    showToast('السلة فارغة', 'warning');
    return;
  }

  const subtotal = posState.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = appState.get('taxRate') || 14;
  const discount = posState.discount || 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = calculateTax(afterDiscount, taxRate);
  const total = afterDiscount + tax;

  const orderData = {
    type: posState.orderType,
    tableNumber: document.getElementById('tableNumberInput')?.value || '',
    customerName: document.getElementById('customerNameInput')?.value || '',
    subtotal,
    tax,
    discount,
    total,
  };

  const items = posState.cart.map(item => ({
    productId: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));

  try {
    const order = await ordersAPI.createOrder(orderData, items);
    showToast(`تم إنشاء الطلب #${order.order_number} بنجاح`, 'success');
    posState.cart = [];
    posState.discount = 0;
    document.getElementById('discountInput').value = 0;
    renderCart();
  } catch (error) {
    showToast('فشل إنشاء الطلب: ' + error.message, 'error');
  }
}

/**
 * دفع سريع
 */
async function quickPay(method) {
  if (posState.cart.length === 0) return;
  await placeOrder();
}

/**
 * فتح نافذة تقسيم الفاتورة
 */
function openSplitBill() {
  if (posState.cart.length === 0) return;
  const subtotal = posState.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  new Modal({
    title: t('splitBill'),
    content: `
      <div class="space-y-4">
        <p>${t('total')}: <strong>${formatCurrency(subtotal)}</strong></p>
        <div>
          <label class="block text-sm mb-1">${t('splitPeople')}</label>
          <input type="number" id="splitNumber" class="form-input" value="2" min="2" max="10">
        </div>
        <p id="splitResult" class="text-lg font-bold text-center text-indigo-600"></p>
      </div>
    `,
    buttons: [
      { text: t('cancel'), class: 'bg-gray-200 hover:bg-gray-300' },
      { 
        text: t('confirm'), 
        class: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        onClick: (e, modal) => {
          const num = parseInt(document.getElementById('splitNumber').value) || 2;
          const perPerson = round(subtotal / num);
          showToast(`كل شخص يدفع ${formatCurrency(perPerson)}`, 'info');
          modal.close();
        }
      }
    ]
  }).open();
}
