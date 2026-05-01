// =============================================
// نظام المطاعم - Restaurant SaaS
// صفحة الإعدادات
// =============================================

import { appState } from '../core/state.js';
import { t, changeLanguage } from '../core/i18n.js';
import { updateHeaderTitle, toggleAppUI } from '../shared/layout.js';
import { requireAuth, requireRole } from '../modules/auth/auth.guard.js';
import { CONFIG } from '../core/config.js';
import { formatCurrency, showToast } from '../shared/utils.js';
import { Modal } from '../shared/components/Modal.js';

export async function renderSettingsPage() {
  if (!requireAuth() || !requireRole('admin')) return;

  toggleAppUI(true);
  updateHeaderTitle(t('settings'));

  const container = document.getElementById('pageContainer');
  if (!container) return;

  renderLayout(container);
  bindEvents();
}

function renderLayout(container) {
  const restaurant = appState.get('restaurant') || {};
  const currentLang = appState.get('language') || 'ar';
  const currentCurrency = appState.get('currency') || 'EGP';
  const taxRate = appState.get('taxRate') || CONFIG.DEFAULT_TAX_RATE;

  container.innerHTML = `
    <div class="fade-in max-w-3xl mx-auto">
      <h2 class="text-2xl font-bold mb-6">${t('settings')}</h2>

      <!-- معلومات المطعم -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 class="font-bold text-lg mb-4">${t('restaurantName')}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${t('restaurantName')}</label>
            <input type="text" id="restaurantNameInput" class="form-input" value="${restaurant.name || ''}">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${t('email')}</label>
            <input type="email" id="restaurantEmailInput" class="form-input" value="${restaurant.contact_email || ''}">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
            <input type="text" id="restaurantPhoneInput" class="form-input" value="${restaurant.contact_phone || ''}">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
            <input type="text" id="restaurantAddressInput" class="form-input" value="${restaurant.address || ''}">
          </div>
        </div>
        <button id="saveRestaurantBtn" class="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
          <i class="fas fa-save"></i> ${t('save')}
        </button>
      </div>

      <!-- الإعدادات العامة -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 class="font-bold text-lg mb-4">الإعدادات العامة</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- اللغة -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${t('language')}</label>
            <select id="languageSelect" class="form-input">
              <option value="ar" ${currentLang === 'ar' ? 'selected' : ''}>العربية</option>
              <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
            </select>
          </div>

          <!-- العملة -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${t('currency')}</label>
            <select id="currencySelect" class="form-input">
              ${Object.entries(CONFIG.CURRENCIES).map(([code, info]) => `
                <option value="${code}" ${currentCurrency === code ? 'selected' : ''}>
                  ${info.symbol} ${info.name} (${code})
                </option>
              `).join('')}
            </select>
          </div>

          <!-- نسبة الضريبة -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${t('taxRate')} (%)</label>
            <input type="number" id="taxRateInput" class="form-input" value="${taxRate}" min="0" max="100" step="0.01">
          </div>

          <!-- باقة الاشتراك -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${t('subscription')}</label>
            <select id="planSelect" class="form-input" disabled>
              <option value="starter">${CONFIG.SUBSCRIPTION_PLANS.starter.name}</option>
              <option value="pro" selected>${CONFIG.SUBSCRIPTION_PLANS.pro.name}</option>
              <option value="enterprise">${CONFIG.SUBSCRIPTION_PLANS.enterprise.name}</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">الترقية متاحة من لوحة تحكم الموقع الرئيسي</p>
          </div>
        </div>
        <button id="saveSettingsBtn" class="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
          <i class="fas fa-save"></i> ${t('save')}
        </button>
      </div>

      <!-- إدارة الفروع -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-lg">${t('branches')}</h3>
          <button id="addBranchBtn" class="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700">
            <i class="fas fa-plus"></i> ${t('add')}
          </button>
        </div>
        <div id="branchesList" class="space-y-3">
          ${renderBranchesList()}
        </div>
      </div>

      <!-- منطقة الخطر -->
      <div class="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 class="font-bold text-lg text-red-800 mb-2">منطقة الخطر</h3>
        <p class="text-sm text-red-600 mb-4">هذه الإجراءات لا يمكن التراجع عنها</p>
        <button id="deleteRestaurantBtn" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
          <i class="fas fa-trash"></i> حذف المطعم
        </button>
      </div>
    </div>
  `;
}

function renderBranchesList() {
  const branches = appState.get('branches') || [];
  if (branches.length === 0) {
    return '<p class="text-gray-400">لا توجد فروع</p>';
  }
  return branches.map(branch => `
    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <div>
        <p class="font-medium">${branch.name}</p>
        <p class="text-xs text-gray-500">${branch.address || 'بدون عنوان'}</p>
      </div>
      <div class="flex gap-2">
        <button class="text-blue-600 hover:text-blue-800" onclick="alert('تعديل الفرع')">
          <i class="fas fa-edit"></i>
        </button>
        <button class="text-red-500 hover:text-red-700" onclick="alert('حذف الفرع')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function bindEvents() {
  // حفظ معلومات المطعم
  document.getElementById('saveRestaurantBtn').addEventListener('click', () => {
    showToast('تم حفظ معلومات المطعم', 'success');
  });

  // حفظ الإعدادات العامة
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const lang = document.getElementById('languageSelect').value;
    const currency = document.getElementById('currencySelect').value;
    const taxRate = parseFloat(document.getElementById('taxRateInput').value) || 0;

    appState.set('currency', currency);
    appState.set('taxRate', taxRate);
    changeLanguage(lang);

    showToast('تم حفظ الإعدادات', 'success');
    renderSettingsPage(); // إعادة تحميل الصفحة لتطبيق التغييرات
  });

  // إضافة فرع
  document.getElementById('addBranchBtn').addEventListener('click', () => {
    new Modal({
      title: t('add') + ' ' + t('branch') || 'فرع',
      content: `
        <div class="space-y-3">
          <div><label class="block text-sm mb-1">اسم الفرع</label><input id="branchName" class="form-input"></div>
          <div><label class="block text-sm mb-1">العنوان</label><input id="branchAddress" class="form-input"></div>
          <div><label class="block text-sm mb-1">رقم الهاتف</label><input id="branchPhone" class="form-input"></div>
        </div>
      `,
      buttons: [
        { text: t('cancel'), class: 'bg-gray-200' },
        {
          text: t('save'),
          class: 'bg-indigo-600 text-white',
          onClick: () => {
            showToast('تم إضافة الفرع (محاكاة)', 'success');
          }
        }
      ]
    }).open();
  });

  // حذف المطعم
  document.getElementById('deleteRestaurantBtn').addEventListener('click', () => {
    if (confirm('هل أنت متأكد من حذف المطعم؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      showToast('تم حذف المطعم (محاكاة)', 'error');
    }
  });
}
