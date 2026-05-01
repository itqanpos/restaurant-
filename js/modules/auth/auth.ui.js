// =============================================
// نظام المطاعم - Restaurant SaaS
// واجهة تسجيل الدخول (UI)
// =============================================

import { authAPI } from './auth.api.js';
import { router } from '../../core/router.js';
import { t, changeLanguage } from '../../core/i18n.js';
import { appState } from '../../core/state.js';
import { showToast } from '../../shared/utils.js';

/**
 * عرض صفحة تسجيل الدخول
 */
export function renderLoginPage() {
  const container = document.getElementById('pageContainer');
  if (!container) return;

  // إخفاء الهيدر والسايد بار لأننا في صفحة عامة
  document.getElementById('appHeader')?.classList.add('hidden');
  document.getElementById('appSidebar')?.classList.add('hidden');

  const lang = appState.get('language') || 'ar';

  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 p-4">
      <div class="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <!-- شعار -->
        <div class="text-center mb-8">
          <i class="fas fa-utensils text-5xl text-indigo-600 mb-3"></i>
          <h2 class="text-2xl font-bold text-gray-800">${t('login')}</h2>
          <p class="text-gray-500 mt-2">${t('welcomeBack') || 'أهلاً بك في نظام إدارة المطاعم'}</p>
        </div>

        <!-- نموذج تسجيل الدخول -->
        <form id="loginForm" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${t('email')}</label>
            <div class="relative">
              <i class="fas fa-envelope absolute right-3 top-3.5 text-gray-400"></i>
              <input type="email" id="loginEmail" required
                class="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="example@restaurant.com">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${t('password')}</label>
            <div class="relative">
              <i class="fas fa-lock absolute right-3 top-3.5 text-gray-400"></i>
              <input type="password" id="loginPassword" required
                class="w-full pr-10 pl-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="••••••••">
              <button type="button" id="togglePassword"
                class="absolute left-3 top-3.5 text-gray-400 hover:text-gray-600">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>

          <!-- تذكرني ونسيت كلمة المرور -->
          <div class="flex justify-between items-center text-sm">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="rememberMe" class="rounded border-gray-300 text-indigo-600">
              <span>${lang === 'ar' ? 'تذكرني' : 'Remember me'}</span>
            </label>
            <a href="#" id="forgotPasswordLink" class="text-indigo-600 hover:underline">
              ${t('forgotPassword')}
            </a>
          </div>

          <!-- رسالة خطأ -->
          <div id="loginError" class="hidden bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm"></div>

          <!-- زر الدخول -->
          <button type="submit"
            class="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-indigo-700 transition transform active:scale-95">
            <i class="fas fa-sign-in-alt ml-2"></i> ${t('signIn')}
          </button>
        </form>

        <!-- رابط التسجيل -->
        <p class="mt-6 text-center text-sm text-gray-500">
          ${t('noAccount')} <a href="#" id="signUpLink" class="text-indigo-600 hover:underline font-medium">${t('signUp')}</a>
        </p>

        <!-- تغيير اللغة -->
        <div class="mt-6 text-center">
          <button id="langSwitchBtn" class="text-gray-400 hover:text-gray-600 text-sm transition">
            <i class="fas fa-globe"></i> ${lang === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
      </div>
    </div>
  `;

  // إخفاء/إظهار كلمة المرور
  document.getElementById('togglePassword').addEventListener('click', () => {
    const input = document.getElementById('loginPassword');
    const icon = document.querySelector('#togglePassword i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fas fa-eye';
    }
  });

  // إرسال النموذج
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // حالة تحميل
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i> جاري الدخول...';
    errorDiv.classList.add('hidden');

    try {
      await authAPI.signIn(email, password);
      showToast('تم تسجيل الدخول بنجاح', 'success');
      router.navigate('dashboard');
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fas fa-sign-in-alt ml-2"></i> ${t('signIn')}`;
    }
  });

  // رابط نسيت كلمة المرور
  document.getElementById('forgotPasswordLink').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    if (!email) {
      showToast('الرجاء إدخال البريد الإلكتروني أولاً', 'warning');
      return;
    }
    try {
      await authAPI.resetPassword(email);
      showToast('تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  // تغيير اللغة
  document.getElementById('langSwitchBtn').addEventListener('click', () => {
    const newLang = lang === 'ar' ? 'en' : 'ar';
    changeLanguage(newLang);
    renderLoginPage(); // إعادة رسم الصفحة باللغة الجديدة
  });
}
