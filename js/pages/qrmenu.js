// =============================================
// نظام المطاعم - Restaurant SaaS
// صفحة قائمة QR (طلب العميل)
// =============================================

import { appState } from '../core/state.js';
import { t } from '../core/i18n.js';
import { updateHeaderTitle, toggleAppUI } from '../shared/layout.js';
import { formatCurrency, showToast } from '../shared/utils.js';
import { productsAPI } from '../modules/products/products.api.js';

let qrState = {
  cart: [],
  products: [],
  categories: [],
  activeCategory: 'all',
  loading: false,
};

export async function renderQRMenuPage() {
  // هذه الصفحة عامة (يمكن للزائر رؤيتها)
  // لا نطلب تسجيل الدخول
  
  toggleAppUI(false); // إخفاء الهيدر والشريط الجانبي
  updateHeaderTitle(t('qrmenu'));

  const container = document.getElementById('pageContainer');
  if (!container) return;

  renderLayout(container);
  bindEvents();
  await loadProducts();
}

function renderLayout(container) {
  const restaurant = appState.get('restaurant') || { name: 'مطعم العائلة' };

  container.innerHTML = `
    <div class="fade-in max-w-4xl mx-auto">
      <!-- هيدر المطعم -->
      <div class="text-center mb-8">
        <div class="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-utensils text-3xl text-indigo-600"></i>
        </div>
        <h1 class="text-3xl font-bold text-gray-800">${restaurant.name}</h1>
        <p class="text-gray-500 mt-2">امسح الكود للطلب</p>
      </div>

      <!-- محدد الأصناف -->
      <div id="qrCategoryTabs" class="flex gap-2 overflow-x-auto pb-2 mb-6 justify-center">
        <button class="qr-cat-btn px-4 py-2 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700" data-category="all">
          ${t('all') || 'الكل'}
        </button>
      </div>

      <!-- شبكة المنتجات -->
      <div id="qrProductGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div class="col-span-full text-center py-8 text-gray-400">
          <i class="fas fa-spinner fa-spin text-2xl"></i>
        </div>
      </div>

      <!-- زر عرض السلة (يظهر عند إضافة عناصر) -->
      <div id="qrCartFab" class="fixed bottom-6 left-6 hidden">
        <button id="viewCartBtn" class="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition flex items-center gap-2">
          <i class="fas fa-shopping-cart"></i>
          <span>${t('viewCart') || 'عرض السلة'}</span>
          <span id="qrCartCount" class="bg-white text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">0</span>
        </button>
      </div>

      <!-- نافذة السلة -->
      <div id="qrCartModal" class="hidden fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/50" id="qrCartOverlay"></div>
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold">${t('currentOrder')}</h3>
            <button id="closeCartBtn" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <div id="qrCartItems" class="space-y-3 mb-4">
            <p class="text-gray-400 text-center">${t('emptyCart')}</p>
          </div>

          <div class="border-t pt-4">
            <div class="flex justify-between font-bold text-lg mb-4">
              <span>${t('total')}</span>
              <span id="qrCartTotal">0.00</span>
            </div>
            <button id="qrPlaceOrderBtn" class="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-700 transition">
              ${t('placeOrder')}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindEvents() {
  document.getElementById('viewCartBtn')?.addEventListener('click', openCart);
  document.getElementById('closeCartBtn')?.addEventListener('click', closeCart);
  document.getElementById('qrCartOverlay')?.addEventListener('click', closeCart);
  document.getElementById('qrPlaceOrderBtn')?.addEventListener('click', placeOrder);
}

async function loadProducts() {
  qrState.loading = true;
  try {
    // محاولة جلب المنتجات من API (أو استخدام بيانات وهمية)
    let products = [];
    try {
      products = await productsAPI.getProducts({ isAvailable: true });
    } catch {
      // بيانات وهمية للعرض
      products = [
        { id: '1', name: 'برجر دجاج', price: 65, category_id: '1', categories: { name: 'وجبات رئيسية' } },
        { id: '2', name: 'برجر لحم', price: 75, category_id: '1', categories: { name: 'وجبات رئيسية' } },
        { id: '3', name: 'بطاطس مقلية', price: 25, category_id: '2', categories: { name: 'مقبلات' } },
        { id: '4', name: 'كولا', price: 15, category_id: '3', categories: { name: 'مشروبات' } },
        { id: '5', name: 'عصير برتقال', price: 20, category_id: '3', categories: { name: 'مشروبات' } },
        { id: '6', name: 'بيتزا مارغريتا', price: 90, category_id: '1', categories: { name: 'وجبات رئيسية' } },
      ];
    }

    qrState.products = products;
    
    // استخراج الأصناف الفريدة
    const catMap = {};
    products.forEach(p => {
      if (p.categories?.name) {
        catMap[p.category_id] = p.categories.name;
      }
    });
    qrState.categories = Object.entries(catMap).map(([id, name]) => ({ id, name }));

    renderCategories();
    renderProducts();
  } catch (error) {
    console.error('فشل تحميل المنتجات:', error);
  } finally {
    qrState.loading = false;
  }
}

function renderCategories() {
  const tabs = document.getElementById('qrCategoryTabs');
  if (!tabs) return;

  tabs.innerHTML = `
    <button class="qr-cat-btn px-4 py-2 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700" data-category="all">
      ${t('all') || 'الكل'}
    </button>
    ${qrState.categories.map(cat => `
      <button class="qr-cat-btn px-4 py-2 rounded-full text-sm text-gray-600 hover:bg-gray-100" data-category="${cat.id}">
        ${cat.name}
      </button>
    `).join('')}
  `;

  tabs.querySelectorAll('.qr-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.querySelectorAll('.qr-cat-btn').forEach(b => b.classList.remove('bg-indigo-100', 'text-indigo-700'));
      btn.classList.add('bg-indigo-100', 'text-indigo-700');
      qrState.activeCategory = btn.dataset.category;
      renderProducts();
    });
  });
}

function renderProducts() {
  const grid = document.getElementById('qrProductGrid');
  if (!grid) return;

  let filtered = qrState.products;
  if (qrState.activeCategory !== 'all') {
    filtered = filtered.filter(p => p.category_id === qrState.activeCategory);
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="col-span-full text-center py-8 text-gray-400">لا توجد منتجات</p>';
    return;
  }

  grid.innerHTML = filtered.map(product => `
    <div class="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center hover:shadow-md transition">
      <div>
        <h4 class="font-bold text-gray-800">${product.name}</h4>
        <p class="text-xs text-gray-400">${product.categories?.name || ''}</p>
        <p class="text-green-600 font-bold mt-1">${formatCurrency(product.price)}</p>
      </div>
      <button class="add-to-qr-cart w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition active:scale-90"
        data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
        <i class="fas fa-plus"></i>
      </button>
    </div>
  `).join('');

  // ربط أحداث الإضافة
  grid.querySelectorAll('.add-to-qr-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);
      addToCart(id, name, price);
    });
  });
}

function addToCart(id, name, price) {
  const existing = qrState.cart.find(item => item.id === id);
  if (existing) {
    existing.quantity++;
  } else {
    qrState.cart.push({ id, name, price, quantity: 1 });
  }
  updateCartUI();
  showToast(`تمت إضافة ${name}`, 'success');
}

function updateCartUI() {
  const count = qrState.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = qrState.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // زر السلة العائم
  const fab = document.getElementById('qrCartFab');
  const countEl = document.getElementById('qrCartCount');
  if (fab && count > 0) {
    fab.classList.remove('hidden');
    countEl.textContent = count;
  } else if (fab) {
    fab.classList.add('hidden');
  }

  // تحديث محتويات نافذة السلة
  const itemsContainer = document.getElementById('qrCartItems');
  const totalEl = document.getElementById('qrCartTotal');
  
  if (itemsContainer) {
    if (qrState.cart.length === 0) {
      itemsContainer.innerHTML = `<p class="text-gray-400 text-center">${t('emptyCart')}</p>`;
    } else {
      itemsContainer.innerHTML = qrState.cart.map(item => `
        <div class="flex justify-between items-center">
          <div>
            <span class="font-medium">${item.name}</span>
            <span class="text-sm text-gray-500"> ×${item.quantity}</span>
          </div>
          <span>${formatCurrency(item.price * item.quantity)}</span>
        </div>
      `).join('');
    }
  }

  if (totalEl) {
    totalEl.textContent = formatCurrency(total);
  }
}

function openCart() {
  document.getElementById('qrCartModal').classList.remove('hidden');
  updateCartUI();
}

function closeCart() {
  document.getElementById('qrCartModal').classList.add('hidden');
}

async function placeOrder() {
  if (qrState.cart.length === 0) {
    showToast('السلة فارغة', 'warning');
    return;
  }

  const total = qrState.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // في الواقع: إرسال الطلب عبر API
  showToast(`تم تقديم الطلب! الإجمالي: ${formatCurrency(total)}`, 'success');
  
  qrState.cart = [];
  updateCartUI();
  closeCart();
}
