/* =============================================
   نظام الكاشير - Restaurant POS
   JavaScript Application Logic
   ============================================= */

// ---------- متغيرات عامة ----------
let supabase = null;                // عميل Supabase
let currentUser = null;
let currentRestaurant = null;
let currentBranch = null;

// حالة التطبيق
const state = {
  language: 'ar',
  currency: 'SAR',
  orderType: 'dine_in',
  tableNumber: '',
  customerName: '',
  cart: [],                        // { id, name, price, quantity, notes }
  categories: [],
  products: [],
  branches: [],
  currentOrderId: null
};

// قاموس الترجمة (i18n بسيط)
const i18nDict = {
  ar: {
    categories: 'الأصناف',
    all: 'الكل',
    currentOrder: 'الطلب الحالي',
    emptyCart: 'السلة فارغة',
    subtotal: 'المجموع الفرعي',
    tax: 'الضريبة (15%)',
    total: 'الإجمالي',
    cash: 'نقداً',
    wallet: 'محفظة',
    placeOrder: 'إتمام الطلب',
    settings: 'الإعدادات',
    branch: 'الفرع',
    currency: 'العملة',
    save: 'حفظ',
    logout: 'تسجيل الخروج',
    paymentTitle: 'تأكيد الدفع',
    amountDue: 'المبلغ المستحق',
    cancel: 'إلغاء',
    loading: 'تحميل المنتجات...',
    orderSaved: 'تم حفظ الطلب بنجاح',
    orderPaid: 'تم الدفع بنجاح',
    selectBranch: 'اختر الفرع',
    dineIn: 'داخل المطعم',
    takeaway: 'تيك أواي',
    delivery: 'دليفري',
  },
  en: {
    categories: 'Categories',
    all: 'All',
    currentOrder: 'Current Order',
    emptyCart: 'Cart is empty',
    subtotal: 'Subtotal',
    tax: 'Tax (15%)',
    total: 'Total',
    cash: 'Cash',
    wallet: 'Wallet',
    placeOrder: 'Place Order',
    settings: 'Settings',
    branch: 'Branch',
    currency: 'Currency',
    save: 'Save',
    logout: 'Logout',
    paymentTitle: 'Confirm Payment',
    amountDue: 'Amount Due',
    cancel: 'Cancel',
    loading: 'Loading products...',
    orderSaved: 'Order saved successfully',
    orderPaid: 'Payment successful',
    selectBranch: 'Select branch',
    dineIn: 'Dine-in',
    takeaway: 'Takeaway',
    delivery: 'Delivery',
  }
};

// تنسيق العملة
const currencySymbols = {
  SAR: '﷼',
  USD: '$',
  EGP: '£'
};

// ---------- دوال مساعدة ----------
function t(key) {
  return i18nDict[state.language]?.[key] || key;
}

function formatCurrency(amount) {
  const symbol = currencySymbols[state.currency] || state.currency;
  return `${amount.toFixed(2)} ${symbol}`;
}

function updateDocumentDirection() {
  document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = state.language;
}

// تحديث كل النصوص في الواجهة حسب اللغة الحالية
function refreshUITexts() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = t(key);
    } else {
      el.textContent = t(key);
    }
  });
  // عناصر معينة بدون data-i18n
  document.getElementById('categoriesLabel').textContent = t('categories');
  document.getElementById('cartTitle').textContent = t('currentOrder');
  document.getElementById('emptyCartMsg').textContent = t('emptyCart');
  document.getElementById('subtotalLabel').textContent = t('subtotal');
  document.getElementById('taxLabel').textContent = t('tax');
  document.getElementById('totalLabel').textContent = t('total');
  document.getElementById('cashLabel').textContent = t('cash');
  document.getElementById('walletLabel').textContent = t('wallet');
  document.getElementById('placeOrderLabel').textContent = t('placeOrder');
  document.getElementById('settingsTitle').textContent = t('settings');
  document.getElementById('branchLabel').textContent = t('branch');
  document.getElementById('currencyLabel').textContent = t('currency');
  document.getElementById('saveSettingsBtn').innerHTML = `<i class="fas fa-save"></i> ${t('save')}`;
  document.getElementById('logoutBtn').innerHTML = `<i class="fas fa-sign-out-alt"></i> ${t('logout')}`;
  document.getElementById('paymentTitle').textContent = t('paymentTitle');
  document.getElementById('paymentTotalLabel').textContent = t('amountDue');
  document.getElementById('cancelPaymentBtn').textContent = t('cancel');
  document.getElementById('productGrid').innerHTML = `<p>${t('loading')}</p>`;
  document.getElementById('langText').textContent = state.language === 'ar' ? 'English' : 'العربية';
}

// ---------- تهيئة Supabase (اختياري: استبدل ببيانات مشروعك) ----------
async function initSupabase() {
  // في بيئة حقيقية: const SUPABASE_URL = 'https://xxx.supabase.co'
  // const SUPABASE_KEY = 'anon-key'
  // supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  // هنا محاكاة للتوضيح
  supabase = {
    auth: {
      getUser: async () => ({ data: { user: { id: '123', email: 'cashier@test.com' } }, error: null }),
      signOut: async () => ({ error: null })
    },
    from: (table) => ({
      select: (columns) => ({
        eq: (col, val) => ({
          single: async () => mockSelectSingle(table, col, val),
          order: (col, opts) => ({
            limit: async (n) => mockSelectOrdered(table, col, val, n)
          }),
          // للقوائم
          then: async (resolve) => resolve({ data: mockSelectAll(table, col, val), error: null })
        }),
        order: (col, opts) => mockSelectAll(table)
      }),
      insert: (data) => ({
        select: () => ({
          single: async () => ({ data: { id: crypto.randomUUID(), ...data }, error: null })
        })
      })
    })
  };
}

// بيانات وهمية مؤقتة
function mockSelectSingle(table, col, val) {
  return { data: { id: val, restaurant_id: 'r1', branch_id: 'b1' }, error: null };
}
function mockSelectAll(table, col, val) {
  if (table === 'categories') return [
    { id: 'cat1', name: 'مشروبات', restaurant_id: 'r1' },
    { id: 'cat2', name: 'وجبات رئيسية', restaurant_id: 'r1' }
  ];
  if (table === 'products') return [
    { id: 'p1', name: 'برجر', price: 25, category_id: 'cat2', is_available: true },
    { id: 'p2', name: 'كولا', price: 5, category_id: 'cat1', is_available: true },
    { id: 'p3', name: 'بطاطس', price: 10, category_id: 'cat2', is_available: true },
  ];
  if (table === 'branches') return [
    { id: 'b1', name: 'الرياض', currency: 'SAR', restaurant_id: 'r1' },
    { id: 'b2', name: 'جدة', currency: 'SAR', restaurant_id: 'r1' }
  ];
  return [];
}
function mockSelectOrdered(table, col, val, limit) {
  return { data: [{ order_number: 100 }], error: null };
}

// ---------- تهيئة الجلسة ----------
async function initSession() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('الرجاء تسجيل الدخول');
    window.location.href = '/login.html';
    return;
  }
  currentUser = user;
  // جلب بيانات المطعم والفرع من دور المستخدم (مبسط)
  const { data: role } = await supabase.from('user_restaurant_roles').select('*').eq('user_id', user.id).single();
  if (role) {
    currentRestaurant = { id: role.restaurant_id };
    currentBranch = { id: role.branch_id };
    await loadBranches();
    await loadData();
  }
}

async function loadBranches() {
  const { data } = await supabase.from('branches').select('*').eq('restaurant_id', currentRestaurant.id);
  state.branches = data || [];
}

async function loadData() {
  if (!currentRestaurant) return;
  const { data: cats } = await supabase.from('categories').select('*').eq('restaurant_id', currentRestaurant.id);
  const { data: prods } = await supabase.from('products').select('*').eq('restaurant_id', currentRestaurant.id).eq('is_available', true);
  state.categories = cats || [];
  state.products = prods || [];
  renderCategories();
  renderProducts('all');
}

// ---------- عرض الأصناف ----------
function renderCategories() {
  const container = document.getElementById('categoryList');
  container.innerHTML = '';
  // زر الكل
  const allBtn = document.createElement('button');
  allBtn.textContent = t('all');
  allBtn.className = 'active';
  allBtn.onclick = () => {
    setActiveCategory(null, allBtn);
    renderProducts('all');
  };
  container.appendChild(allBtn);
  state.categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat.name;
    btn.onclick = () => {
      setActiveCategory(cat.id, btn);
      renderProducts(cat.id);
    };
    container.appendChild(btn);
  });
}

function setActiveCategory(catId, element) {
  document.querySelectorAll('#categoryList button').forEach(b => b.classList.remove('active'));
  element.classList.add('active');
}

// ---------- عرض المنتجات ----------
function renderProducts(categoryId) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';
  const filtered = categoryId === 'all' ? state.products : state.products.filter(p => p.category_id === categoryId);
  if (filtered.length === 0) {
    grid.innerHTML = '<p class="text-gray-400">لا توجد منتجات</p>';
    return;
  }
  filtered.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="name">${product.name}</div>
      <div class="price">${formatCurrency(product.price)}</div>
    `;
    card.onclick = () => addToCart(product);
    grid.appendChild(card);
  });
}

// ---------- إدارة السلة ----------
function addToCart(product) {
  const existing = state.cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1, notes: '' });
  }
  renderCart();
}

function updateCartItem(productId, delta) {
  const index = state.cart.findIndex(item => item.id === productId);
  if (index === -1) return;
  state.cart[index].quantity += delta;
  if (state.cart[index].quantity <= 0) {
    state.cart.splice(index, 1);
  }
  renderCart();
}

function clearCart() {
  state.cart = [];
  renderCart();
}

function calculateTotals() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = 0.15;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function renderCart() {
  const container = document.getElementById('cartItemsContainer');
  const emptyMsg = document.getElementById('emptyCartMsg');
  container.innerHTML = '';
  if (state.cart.length === 0) {
    emptyMsg.classList.remove('hidden');
  } else {
    emptyMsg.classList.add('hidden');
    state.cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-price">${formatCurrency(item.price)}</div>
        </div>
        <div class="qty-controls">
          <button class="qty-btn" data-action="decrease" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
        </div>
      `;
      container.appendChild(div);
    });
    // ربط الأحداث للأزرار الديناميكية
    container.querySelectorAll('.qty-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const delta = btn.dataset.action === 'increase' ? 1 : -1;
        updateCartItem(id, delta);
      };
    });
  }
  updateTotalsDisplay();
}

function updateTotalsDisplay() {
  const { subtotal, tax, total } = calculateTotals();
  document.getElementById('subtotalValue').textContent = formatCurrency(subtotal);
  document.getElementById('taxValue').textContent = formatCurrency(tax);
  document.getElementById('totalValue').textContent = formatCurrency(total);
  document.getElementById('placeOrderBtn').disabled = state.cart.length === 0;
}

// ---------- عملية الطلب والدفع ----------
async function placeOrder() {
  if (state.cart.length === 0) return;
  const { subtotal, tax, total } = calculateTotals();
  const orderData = {
    restaurant_id: currentRestaurant.id,
    branch_id: currentBranch.id,
    order_number: 101, // يفترض جلبه من آخر رقم
    source: 'pos',
    type: state.orderType,
    status: 'new',
    table_number: state.orderType === 'dine_in' ? state.tableNumber : null,
    customer_name: state.customerName || null,
    subtotal,
    tax_amount: tax,
    total,
    created_by: currentUser.id
  };
  const { data: order, error } = await supabase.from('orders').insert(orderData).select().single();
  if (error) return alert(error.message);
  state.currentOrderId = order.id;
  // إضافة العناصر
  const items = state.cart.map(item => ({
    order_id: order.id,
    product_id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity
  }));
  // await supabase.from('order_items').insert(items); // محاكاة
  showPaymentModal();
}

function showPaymentModal() {
  document.getElementById('paymentModal').classList.remove('hidden');
  document.getElementById('paymentTotal').textContent = formatCurrency(calculateTotals().total);
}

function hidePaymentModal() {
  document.getElementById('paymentModal').classList.add('hidden');
}

async function processPayment(method) {
  // await supabase.from('payments').insert({...})
  alert(t('orderPaid'));
  hidePaymentModal();
  clearCart();
  state.currentOrderId = null;
}

// ---------- إعدادات الدرج ----------
function toggleDrawer(show) {
  const drawer = document.getElementById('settingsDrawer');
  if (show) drawer.classList.remove('hidden');
  else drawer.classList.add('hidden');
}

function applySettings() {
  const langSelect = document.getElementById('languageSelect');
  const currencySelect = document.getElementById('currencySelect');
  const branchSelect = document.getElementById('branchSelect');
  state.language = langSelect.value;
  state.currency = currencySelect.value;
  if (branchSelect.value) currentBranch = { id: branchSelect.value };
  updateDocumentDirection();
  refreshUITexts();
  renderCategories();
  renderProducts('all');
  renderCart();
  updateTotalsDisplay();
  document.getElementById('currencyBadge').textContent = `${currencySymbols[state.currency]} ${state.currency}`;
  toggleDrawer(false);
}

// ربط أحداث الإعدادات
function populateSettings() {
  const branchSelect = document.getElementById('branchSelect');
  branchSelect.innerHTML = `<option value="">${t('selectBranch')}</option>`;
  state.branches.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = b.name;
    branchSelect.appendChild(opt);
  });
}

// ---------- ربط الأحداث العامة ----------
function bindEvents() {
  // زر اللغة
  document.getElementById('langToggleBtn').onclick = () => {
    state.language = state.language === 'ar' ? 'en' : 'ar';
    updateDocumentDirection();
    refreshUITexts();
    renderCategories();
    renderProducts('all');
    renderCart();
    updateTotalsDisplay();
  };
  // فتح الإعدادات
  document.getElementById('menuBtn').onclick = () => {
    populateSettings();
    toggleDrawer(true);
  };
  document.getElementById('drawerOverlay').onclick = () => toggleDrawer(false);
  document.getElementById('closeDrawerBtn').onclick = () => toggleDrawer(false);
  document.getElementById('saveSettingsBtn').onclick = applySettings;
  document.getElementById('logoutBtn').onclick = () => supabase.auth.signOut().then(() => window.location.reload());
  // أزرار الدفع السريع
  document.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.onclick = () => {
      if (state.cart.length === 0) return;
      placeOrder().then(() => {
        processPayment(btn.dataset.method);
      });
    };
  });
  document.getElementById('placeOrderBtn').onclick = placeOrder;
  // نافذة الدفع
  document.getElementById('confirmPaymentCash').onclick = () => processPayment('cash');
  document.getElementById('confirmPaymentCard').onclick = () => processPayment('visa');
  document.getElementById('confirmPaymentWallet').onclick = () => processPayment('wallet');
  document.getElementById('cancelPaymentBtn').onclick = hidePaymentModal;
  document.getElementById('paymentOverlay').onclick = hidePaymentModal;
  // مسح السلة
  document.getElementById('clearCartBtn').onclick = clearCart;
}

// ---------- بدء التطبيق ----------
window.onload = async () => {
  await initSupabase();
  refreshUITexts();
  updateDocumentDirection();
  bindEvents();
  await initSession();
  // لو لم يتم جلب الجلسة (بيانات وهمية)
  if (!currentRestaurant) {
    currentRestaurant = { id: 'r1' };
    currentBranch = { id: 'b1' };
    await loadBranches();
    await loadData();
  }
  renderCart();
};
