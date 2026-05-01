// =============================================
// نظام المطاعم - Restaurant SaaS
// بناء الهيكل العام (الشريط الجانبي + الهيدر)
// =============================================

import { appState } from '../core/state.js';
import { router } from '../core/router.js';
import { t, changeLanguage } from '../core/i18n.js';
import { CONFIG } from '../core/config.js';

/**
 * بناء واجهة التطبيق الثابتة (الهيدر والشريط الجانبي)
 * يتم استدعاؤها مرة واحدة عند بدء التطبيق
 */
export function loadLayout() {
  renderHeader();
  renderSidebar();
}

/**
 * بناء الهيدر العلوي
 */
function renderHeader() {
  const header = document.getElementById('appHeader');
  if (!header) return;

  const lang = appState.get('language');
  
  header.className = 'bg-white shadow-sm px-4 py-3 flex items-center justify-between hidden';
  header.innerHTML = `
    <div class="flex items-center gap-4">
      <h1 class="text-xl font-bold text-gray-800" id="headerTitle">${t('dashboard')}</h1>
      <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium" id="currencyBadge">
        ${CONFIG.CURRENCIES[appState.get('currency')]?.symbol || 'ج.م'} ${appState.get('currency')}
      </span>
    </div>
    <div class="flex items-center gap-3">
      <!-- زر تغيير اللغة -->
      <button id="langToggleBtn" class="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1">
        <i class="fas fa-globe"></i>
        <span>${lang === 'ar' ? 'English' : 'العربية'}</span>
      </button>
      <!-- زر القائمة للجوال -->
      <button id="mobileMenuBtn" class="md:hidden text-gray-600 hover:text-gray-800 p-2">
        <i class="fas fa-bars text-2xl"></i>
      </button>
      <!-- زر الخروج -->
      <button id="logoutBtn" class="text-red-500 hover:text-red-700 p-2">
        <i class="fas fa-sign-out-alt text-xl"></i>
      </button>
    </div>
  `;

  // ربط الأحداث
  document.getElementById('langToggleBtn').onclick = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar';
    changeLanguage(newLang);
    loadLayout(); // إعادة بناء الواجهة باللغة الجديدة
    router.resolve();
    document.getElementById('appHeader').classList.remove('hidden');
  };

  document.getElementById('mobileMenuBtn').onclick = () => {
    const sidebar = document.getElementById('appSidebar');
    sidebar.classList.toggle('hidden');
  };

  document.getElementById('logoutBtn').onclick = () => {
    if (confirm(t('logout') + '؟')) {
      appState.set('user', null);
      appState.set('session', null);
      router.navigate('login');
    }
  };
}

/**
 * بناء الشريط الجانبي
 */
function renderSidebar() {
  const sidebar = document.getElementById('appSidebar');
  if (!sidebar) return;

  const restaurantName = appState.get('restaurant')?.name || 'مطعم العائلة';
  const plan = appState.get('restaurant')?.plan || 'Pro';
  
  sidebar.innerHTML = `
    <div class="p-5 text-center border-b border-indigo-800">
      <i class="fas fa-utensils text-3xl mb-2"></i>
      <h2 class="font-bold text-lg" id="restaurantName">${restaurantName}</h2>
      <p class="text-xs text-indigo-200">باقة ${plan}</p>
    </div>
    <nav class="flex-1 space-y-1 p-3 overflow-y-auto" id="mainNav"></nav>
    <div class="p-4 border-t border-indigo-800 text-xs text-center text-indigo-300">
      <span>© ${new Date().getFullYear()} ${t('appName')}</span>
    </div>
  `;

  // بناء روابط التنقل
  buildNavigation();
}

/**
 * بناء روابط الشريط الجانبي
 */
function buildNavigation() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;

  const user = appState.get('user');
  const currentPage = router.currentRoute || 'dashboard';

  const navItems = CONFIG.PAGES.filter(page => {
    // إذا كانت الصفحة تتطلب تسجيل دخول ولم يسجل المستخدم
    if (page.requiresAuth && !user) return false;
    // إذا كانت الصفحة محجوبة لدور معين
    if (page.roles && user && !page.roles.includes(user.role) && user.role !== 'admin') return false;
    return true;
  });

  nav.innerHTML = navItems.map(page => `
    <a href="#${page.id}" 
       class="nav-link flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-indigo-800 ${currentPage === page.id ? 'active bg-indigo-800 font-semibold' : ''}"
       data-page="${page.id}">
      <i class="fas fa-${page.icon} w-5 text-center"></i>
      <span>${t(page.id)}</span>
    </a>
  `).join('');

  // ربط أحداث النقر
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      router.navigate(page);

      // إغلاق الشريط الجانبي في الجوال تلقائياً
      if (window.innerWidth < 768) {
        document.getElementById('appSidebar').classList.add('hidden');
      }
    });
  });
}

/**
 * تحديث عنوان الصفحة في الهيدر
 * @param {string} pageTitle 
 */
export function updateHeaderTitle(pageTitle) {
  const titleEl = document.getElementById('headerTitle');
  if (titleEl) {
    titleEl.textContent = pageTitle;
  }
}

/**
 * إظهار/إخفاء الهيدر والسايد بار
 * @param {boolean} show 
 */
export function toggleAppUI(show) {
  const header = document.getElementById('appHeader');
  const sidebar = document.getElementById('appSidebar');
  
  if (header) header.classList.toggle('hidden', !show);
  if (sidebar) sidebar.classList.toggle('hidden', !show);
}
