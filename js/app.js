// =============================================
// نظام المطاعم SaaS - المنطق الرئيسي
// مع الإضافات: QR Menu، Split Bill، Loyalty،
// Recipe & Inventory، Kitchen المتقدم،
// اختصارات الكيبورد، تقارير مقارنة
// =============================================

// ---------- البيانات الوهمية (محاكاة قاعدة بيانات) ----------
const mockData = {
  restaurants: [
    { id: 1, name: 'مطعم العائلة', plan: 'Pro', currency: 'EGP', symbol: 'ج.م', taxRate: 14 }
  ],
  currentRestaurant: null,
  products: [
    { id: 1, name: 'برجر دجاج', price: 65, category: 'وجبات رئيسية', recipe: [{ itemId: 1, qty: 0.2 }, { itemId: 3, qty: 0.1 }] },
    { id: 2, name: 'برجر لحم', price: 75, category: 'وجبات رئيسية', recipe: [{ itemId: 2, qty: 0.2 }, { itemId: 3, qty: 0.1 }] },
    { id: 3, name: 'بطاطس مقلية', price: 25, category: 'مقبلات', recipe: [{ itemId: 4, qty: 0.3 }] },
    { id: 4, name: 'كولا', price: 15, category: 'مشروبات', recipe: [] },
    { id: 5, name: 'عصير برتقال', price: 20, category: 'مشروبات', recipe: [{ itemId: 5, qty: 0.5 }] }
  ],
  inventory: [
    { id: 1, name: 'دجاج', qty: 10, unit: 'كغم', min: 2 },
    { id: 2, name: 'لحم', qty: 8, unit: 'كغم', min: 2 },
    { id: 3, name: 'خبز', qty: 50, unit: 'حبة', min: 20 },
    { id: 4, name: 'زيت', qty: 5, unit: 'لتر', min: 1 },
    { id: 5, name: 'برتقال', qty: 20, unit: 'حبة', min: 5 }
  ],
  loyaltyPoints: 0,
  ordersHistory: [],
  kitchenOrders: []
};

// ---------- كائن التطبيق ----------
const App = {
  loggedIn: true,
  currentPage: 'dashboard',
  currency: 'EGP',
  currencySymbol: 'ج.م',
  taxRate: 14,
  cart: [],
  // لتقسيم الفاتورة
  splitMode: false,
  splitNumber: 2,
  splitMethod: 'equally', // equally, items

  // تبديل اللغة
  toggleLanguage() {
    const newLang = i18n.currentLang === 'ar' ? 'en' : 'ar';
    i18n.setLanguage(newLang);
  },

  // اختيار مطعم (محاكاة متعددة المستأجرين)
  selectRestaurant(id) {
    const rest = mockData.restaurants.find(r => r.id === id);
    if (rest) {
      mockData.currentRestaurant = rest;
      this.currency = rest.currency;
      this.currencySymbol = rest.symbol;
      this.taxRate = rest.taxRate;
      document.getElementById('restaurantName').textContent = rest.name;
      document.getElementById('subscriptionPlan').textContent = `باقة ${rest.plan}`;
      document.getElementById('currencyBadge').textContent = `${rest.symbol} ${rest.currency}`;
    }
  },

  // تسجيل الخروج
  logout() {
    if (confirm(i18n.t('logout') + '؟')) {
      this.loggedIn = false;
      location.reload();
    }
  },

  // التنقل بين الصفحات
  navigateTo(page) {
    this.currentPage = page;
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });
    document.getElementById('headerTitle').textContent = i18n.t(page);
    window.location.hash = page;
    PageRenderer.render(page);
    if (window.innerWidth < 768) {
      document.getElementById('sidebar').classList.add('hidden');
    }
  },

  // ---------- وظائف الكاشير ----------
  addToCart(id, name, price) {
    const existing = this.cart.find(item => item.id === id);
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({ id, name, price, qty: 1 });
    }
    PageRenderer.renderCart();
  },

  changeQty(id, delta) {
    const item = this.cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) this.cart = this.cart.filter(i => i.id !== id);
    PageRenderer.renderCart();
  },

  // حساب الإجمالي مع الضريبة
  getTotals() {
    const subtotal = this.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const tax = subtotal * (this.taxRate / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  },

  // إنشاء الطلب (مع خصم المخزون ونقاط الولاء)
  placeOrder(paymentMethod = 'cash') {
    if (this.cart.length === 0) return;
    const { total } = this.getTotals();
    // توليد رقم طلب
    const orderId = Date.now().toString().slice(-6);
    const items = this.cart.map(item => `${item.name} x${item.qty}`);
    // خصم المخزون حسب الوصفات
    this.cart.forEach(cartItem => {
      const product = mockData.products.find(p => p.id === cartItem.id);
      if (product && product.recipe) {
        product.recipe.forEach(rec => {
          const invItem = mockData.inventory.find(i => i.id === rec.itemId);
          if (invItem) {
            invItem.qty -= rec.qty * cartItem.qty;
            if (invItem.qty < 0) invItem.qty = 0;
          }
        });
      }
    });
    // إضافة إلى سجل الطلبات
    mockData.ordersHistory.push({ id: orderId, items, total, time: new Date().toLocaleTimeString() });
    // إضافة للمطبخ
    App.kitchenAddOrder(orderId, items);
    // نقاط الولاء (1 نقطة لكل 10 جنيه)
    const pointsEarned = Math.floor(total / 10);
    mockData.loyaltyPoints += pointsEarned;
    alert(`${i18n.t('confirmPayment')} #${orderId}\n${i18n.t('earnPoints')}: ${pointsEarned}`);
    this.cart = [];
    PageRenderer.renderCart();
  },

  // إضافة طلب للمطبخ مع حالة
  kitchenAddOrder(id, items) {
    mockData.kitchenOrders.unshift({
      id, items, status: 'new', time: new Date().toLocaleTimeString(), elapsed: 0
    });
  },

  // تقسيم الفاتورة
  openSplitBill() {
    const modal = document.getElementById('modalContainer');
    const { total } = this.getTotals();
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.innerHTML=''">
        <div class="modal-content" onclick="event.stopPropagation()">
          <h3 class="text-xl font-bold mb-4">${i18n.t('splitBill')}</h3>
          <div class="space-y-3">
            <button class="btn-primary w-full" onclick="App.splitEqually()">${i18n.t('splitEqually')} (${total.toFixed(2)})</button>
            <button class="btn-primary w-full" onclick="App.splitByPeople()">${i18n.t('splitPeople')}</button>
            <button class="btn-primary w-full" onclick="App.splitByItems()">${i18n.t('splitByItems')}</button>
          </div>
          <button class="mt-4 text-gray-500" onclick="document.getElementById('modalContainer').innerHTML=''">${i18n.t('cancel')}</button>
        </div>
      </div>
    `;
  },

  splitEqually() {
    const { total } = this.getTotals();
    const person = prompt('عدد الأشخاص:', '2');
    if (person) {
      const perPerson = (total / parseInt(person)).toFixed(2);
      alert(`كل شخص يدفع ${perPerson} ${this.currencySymbol}`);
      document.getElementById('modalContainer').innerHTML = '';
      this.cart = []; // محاكاة إتمام الدفع
      PageRenderer.renderCart();
    }
  },

  splitByPeople() {
    // مشابه مع عدد الأشخاص
    this.splitEqually();
  },

  splitByItems() {
    // تقسيم حسب كل صنف يختاره الشخص (يمكن تطويره)
    alert('اختر الأصناف لكل شخص (محاكاة)');
    document.getElementById('modalContainer').innerHTML = '';
  },

  // اختصارات لوحة المفاتيح
  handleShortcut(e) {
    if (this.currentPage !== 'pos') return;
    if (e.key === 'F1') { e.preventDefault(); this.placeOrder('cash'); }
    else if (e.key === 'F2') { e.preventDefault(); this.placeOrder('visa'); }
    else if (e.key === 'F3') { e.preventDefault(); this.placeOrder('wallet'); }
    else if (e.key === 'F4') { e.preventDefault(); this.openSplitBill(); }
  }
};

// ---------- عرض الصفحات ----------
const PageRenderer = {
  render(page) {
    const container = document.getElementById('pageContainer');
    container.innerHTML = '';
    container.classList.add('fade-in');
    switch(page) {
      case 'dashboard': this.renderDashboard(container); break;
      case 'pos': this.renderPOS(container); break;
      case 'kitchen': this.renderKitchen(container); break;
      case 'inventory': this.renderInventory(container); break;
      case 'reports': this.renderReports(container); break;
      case 'settings': this.renderSettings(container); break;
      case 'qrmenu': this.renderQRMenu(container); break;
      default: this.renderDashboard(container);
    }
  },

  // الرئيسية - مع نقاط الولاء ومقارنة
  renderDashboard(container) {
    const lowCount = mockData.inventory.filter(i => i.qty <= i.min).length;
    container.innerHTML = `
      <div class="p-6">
        <h2 class="text-2xl font-bold mb-4">${i18n.t('dashboard')}</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white p-4 rounded-xl shadow">
            <span class="text-gray-500">${i18n.t('salesToday')}</span>
            <h3 class="text-2xl font-bold text-green-600">1,250 ${App.currencySymbol}</h3>
          </div>
          <div class="bg-white p-4 rounded-xl shadow">
            <span class="text-gray-500">${i18n.t('ordersCount')}</span>
            <h3 class="text-2xl font-bold">${mockData.ordersHistory.length}</h3>
          </div>
          <div class="bg-white p-4 rounded-xl shadow">
            <span class="text-gray-500">${i18n.t('points')}</span>
            <h3 class="text-2xl font-bold text-yellow-500">${mockData.loyaltyPoints}</h3>
          </div>
          <div class="bg-white p-4 rounded-xl shadow">
            <span class="text-gray-500">${i18n.t('inventoryAlerts')}</span>
            <h3 class="text-2xl font-bold text-red-500">${lowCount}</h3>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="lg:col-span-2 bg-white p-4 rounded-xl shadow">
            <canvas id="salesChart" height="200"></canvas>
          </div>
          <div class="bg-white p-4 rounded-xl shadow">
            <h3 class="font-bold mb-2">${i18n.t('latestOrders')}</h3>
            <div id="latestOrdersList" class="space-y-2 text-sm"></div>
          </div>
        </div>
      </div>
    `;
    // رسم بياني مقارن (آخر 7 أيام)
    setTimeout(() => {
      const ctx = document.getElementById('salesChart');
      if (ctx) {
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['أمس', 'يومين', '3 أيام', '4 أيام', '5 أيام', '6 أيام', 'اليوم'],
            datasets: [
              { label: 'مبيعات (ج.م)', data: [800, 950, 1200, 1100, 1400, 1250, 900], borderColor: '#6366f1' }
            ]
          }
        });
      }
      const list = document.getElementById('latestOrdersList');
      if (list) {
        list.innerHTML = mockData.ordersHistory.slice(-5).reverse().map(o =>
          `<div class="flex justify-between"><span>#${o.id}</span><span class="text-green-600">${o.total} ${App.currencySymbol}</span></div>`
        ).join('') || '<p class="text-gray-400">لا طلبات</p>';
      }
    }, 100);
  },

  // الكاشير - مع Split Bill واختصارات
  renderPOS(container) {
    container.innerHTML = `
      <div class="flex h-full">
        <div class="flex-1 flex flex-col">
          <div class="p-3 bg-white shadow flex gap-2 flex-wrap">
            <select class="border rounded p-2"><option>${i18n.t('dineIn')}</option></select>
            <input type="text" placeholder="${i18n.t('tableNo')}" class="border rounded p-2 w-24">
            <input type="text" placeholder="${i18n.t('customerName')}" class="border rounded p-2 flex-1 min-w-[120px]">
          </div>
          <div class="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" id="productGrid">
            ${mockData.products.map(p => `
              <div class="product-card" onclick="App.addToCart(${p.id}, '${p.name}', ${p.price})">
                <div class="text-xs text-gray-400">${p.category}</div>
                <div class="font-bold">${p.name}</div>
                <div class="text-green-600 font-bold">${p.price} ${App.currencySymbol}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="w-80 lg:w-96 bg-white border-r flex flex-col flex-shrink-0">
          <div class="p-4 border-b flex justify-between">
            <h2 class="font-bold text-lg">${i18n.t('currentOrder')}</h2>
            <button onclick="App.openSplitBill()" class="text-indigo-600 text-sm"><i class="fas fa-divide"></i> ${i18n.t('splitBill')}</button>
          </div>
          <div id="cartContainer" class="flex-1 overflow-y-auto p-4"></div>
          <div class="border-t p-4 bg-gray-50">
            <div class="flex justify-between font-bold text-lg mb-2">
              <span>${i18n.t('total')}</span>
              <span id="totalDisplay">0.00 ${App.currencySymbol}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <button class="bg-green-600 text-white p-2 rounded-lg" onclick="App.placeOrder('cash')">F1 ${i18n.t('cash')}</button>
              <button class="bg-blue-600 text-white p-2 rounded-lg" onclick="App.placeOrder('visa')">F2 ${i18n.t('visa')}</button>
              <button class="bg-purple-600 text-white p-2 rounded-lg" onclick="App.placeOrder('wallet')">F3 ${i18n.t('wallet')}</button>
            </div>
          </div>
        </div>
      </div>
    `;
    PageRenderer.renderCart();
  },

  renderCart() {
    const container = document.getElementById('cartContainer');
    const totalEl = document.getElementById('totalDisplay');
    if (!container) return;
    if (App.cart.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-center mt-8">' + i18n.t('emptyCart') + '</p>';
      if (totalEl) totalEl.textContent = '0.00 ' + App.currencySymbol;
      return;
    }
    const { subtotal, tax, total } = App.getTotals();
    container.innerHTML = App.cart.map(item => `
      <div class="cart-item flex justify-between items-center">
        <div>
          <div class="font-medium">${item.name}</div>
          <div class="text-sm text-gray-500">${item.price} × ${item.qty}</div>
        </div>
        <div class="flex items-center gap-2">
          <button class="qty-btn" onclick="App.changeQty(${item.id}, -1)">-</button>
          <span>${item.qty}</span>
          <button class="qty-btn" onclick="App.changeQty(${item.id}, 1)">+</button>
        </div>
      </div>
    `).join('');
    container.innerHTML += `
      <div class="text-xs text-gray-600 mt-2">
        <div>المجموع: ${subtotal.toFixed(2)}</div>
        <div>الضريبة (${App.taxRate}%): ${tax.toFixed(2)}</div>
      </div>`;
    if (totalEl) totalEl.textContent = `${total.toFixed(2)} ${App.currencySymbol}`;
  },

  // المطبخ - مع مؤقت
  renderKitchen(container) {
    container.innerHTML = `
      <div class="p-6">
        <h2 class="text-2xl font-bold mb-4">${i18n.t('kitchen')}</h2>
        <div id="kitchenOrdersContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </div>
    `;
    this.updateKitchenDisplay();
  },

  updateKitchenDisplay() {
    const cont = document.getElementById('kitchenOrdersContainer');
    if (!cont) return;
    cont.innerHTML = mockData.kitchenOrders.map(order => `
      <div class="kitchen-order ${order.status === 'preparing' ? 'status-preparing' : order.status === 'ready' ? 'status-ready' : ''}">
        <div class="flex justify-between">
          <h3 class="font-bold">#${order.id}</h3>
          <span class="text-xs">${order.time}</span>
        </div>
        <ul class="list-disc list-inside text-sm my-2">
          ${order.items.map(i => `<li>${i}</li>`).join('')}
        </ul>
        <div class="flex gap-2">
          ${order.status === 'new' ? `<button class="bg-blue-600 text-white py-1 px-3 rounded" onclick="App.updateKitchenStatus('${order.id}','preparing')">${i18n.t('preparing')}</button>` : ''}
          ${order.status === 'preparing' ? `<button class="bg-green-600 text-white py-1 px-3 rounded" onclick="App.updateKitchenStatus('${order.id}','ready')">${i18n.t('ready')}</button>` : ''}
          ${order.status === 'ready' ? `<span class="text-green-600 font-bold">${i18n.t('completed')}</span>` : ''}
        </div>
      </div>
    `).join('') || '<p class="text-gray-400">لا طلبات نشطة</p>';
  },

  // تحديث حالة المطبخ
  App.updateKitchenStatus = function(orderId, newStatus) {
    const order = mockData.kitchenOrders.find(o => o.id == orderId);
    if (order) {
      order.status = newStatus;
      if (newStatus === 'ready') order.elapsed = Math.floor((Date.now() - new Date(order.time).getTime())/1000);
      PageRenderer.updateKitchenDisplay();
    }
  },

  // المخزون مع الوصفات
  renderInventory(container) {
    container.innerHTML = `
      <div class="p-6">
        <h2 class="text-2xl font-bold mb-4">${i18n.t('inventory')} - ${i18n.t('lowStock')}</h2>
        <table class="w-full bg-white rounded-xl shadow">
          <thead class="bg-gray-50"><tr><th class="p-3">المادة</th><th>الكمية</th><th>الوحدة</th><th>الحد</th><th>الحالة</th></tr></thead>
          <tbody>
            ${mockData.inventory.map(i => `
              <tr class="border-t">
                <td class="p-3">${i.name}</td>
                <td class="${i.qty <= i.min ? 'low-stock' : ''}">${i.qty}</td>
                <td>${i.unit}</td>
                <td>${i.min}</td>
                <td><span class="px-2 py-1 rounded-full text-xs ${i.qty <= i.min ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">${i.qty <= i.min ? i18n.t('lowStock') : i18n.t('inStock')}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // التقارير مع مقارنة
  renderReports(container) {
    container.innerHTML = `
      <div class="p-6">
        <h2 class="text-2xl font-bold mb-4">${i18n.t('reports')} - ${i18n.t('compare')}</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-white p-4 rounded-xl shadow"><canvas id="compareChart" height="200"></canvas></div>
          <div class="bg-white p-4 rounded-xl shadow">
            <h3 class="font-bold">أعلى المنتجات مبيعاً</h3>
            <ol class="list-decimal list-inside mt-2">
              <li>برجر دجاج</li><li>كولا</li><li>بطاطس</li>
            </ol>
          </div>
        </div>
      </div>
    `;
    setTimeout(() => {
      const ctx = document.getElementById('compareChart');
      if (ctx) {
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['الأسبوع الماضي', 'هذا الأسبوع'],
            datasets: [
              { label: 'مبيعات (ج.م)', data: [2100, 2450], backgroundColor: '#6366f1' }
            ]
          }
        });
      }
    }, 100);
  },

  // الإعدادات (باقة اشتراك، ضرائب)
  renderSettings(container) {
    container.innerHTML = `
      <div class="p-6 max-w-xl">
        <h2 class="text-2xl font-bold mb-4">${i18n.t('settings')}</h2>
        <div class="bg-white p-6 rounded-xl shadow space-y-4">
          <div><label>اسم المطعم</label><input class="form-input" value="${mockData.restaurants[0].name}"></div>
          <div><label>الباقة</label><select class="form-input"><option>Pro</option></select></div>
          <div><label>نسبة الضريبة %</label><input class="form-input" type="number" value="${App.taxRate}"></div>
          <button class="btn-primary">${i18n.t('save')}</button>
        </div>
      </div>
    `;
  },

  // QR Menu (طلب من الزبون)
  renderQRMenu(container) {
    container.innerHTML = `
      <div class="p-6">
        <h2 class="text-2xl font-bold mb-4">${i18n.t('qrmenu')}</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${mockData.products.map(p => `
            <div class="bg-white p-4 rounded-xl shadow text-center">
              <div class="font-bold">${p.name}</div>
              <div class="text-green-600">${p.price} ${App.currencySymbol}</div>
              <button class="mt-2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm"
                onclick="alert('تمت إضافة ${p.name} إلى السلة')">${i18n.t('addToCart')}</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};

// ---------- التهيئة ----------
window.onload = () => {
  // محاكاة دخول
  mockData.currentRestaurant = mockData.restaurants[0];
  App.selectRestaurant(1);

  if (App.loggedIn) {
    document.getElementById('appHeader').classList.remove('hidden');
    document.getElementById('sidebar').classList.remove('hidden');
  }

  // بناء روابط الشريط الجانبي
  const nav = document.getElementById('mainNav');
  const pages = ['dashboard', 'pos', 'kitchen', 'inventory', 'reports', 'settings', 'qrmenu'];
  const icons = { dashboard: 'th-large', pos: 'cash-register', kitchen: 'fire', inventory: 'boxes', reports: 'chart-bar', settings: 'cog', qrmenu: 'qrcode' };
  nav.innerHTML = pages.map(p => `
    <a class="nav-link" data-page="${p}" onclick="App.navigateTo('${p}')">
      <i class="fas fa-${icons[p]}"></i> <span>${i18n.t(p)}</span>
    </a>
  `).join('');

  // أحداث الأزرار
  document.getElementById('langToggle').onclick = () => App.toggleLanguage();
  document.getElementById('toggleSidebar').onclick = () => document.getElementById('sidebar').classList.toggle('hidden');
  document.getElementById('logoutBtn').onclick = () => App.logout();

  // اختصارات الكيبورد
  document.addEventListener('keydown', (e) => App.handleShortcut(e));

  // الصفحة الحالية
  const startPage = window.location.hash.slice(1) || 'dashboard';
  App.navigateTo(startPage);

  window.addEventListener('hashchange', () => {
    App.navigateTo(window.location.hash.slice(1) || 'dashboard');
  });

  // تحديث ساعة المطبخ
  setInterval(() => {
    if (App.currentPage === 'kitchen') {
      // تحديث عرض الوقت
      document.querySelectorAll('.kitchen-order').forEach((el, idx) => {
        const order = mockData.kitchenOrders[idx];
        if (order && order.status !== 'ready') {
          // يمكن إضافة عداد وقت
        }
      });
    }
  }, 10000);
};
