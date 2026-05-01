// =============================================
// نظام المطاعم - Restaurant SaaS
// نقطة البداية - مُعدلة
// =============================================

import './core/supabase.js'; // ينشئ window.supabase
import { router } from './core/router.js';
import { appState } from './core/state.js';
import { loadLayout } from './shared/layout.js';

async function bootstrap() {
  // انتظر تحميل الـ DOM بالكامل
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
  }

  if (!window.supabase) {
    console.error('❌ Supabase غير متاح');
    document.getElementById('pageContainer').innerHTML =
      '<p class="text-red-500 p-6">خطأ: لم يتم تحميل Supabase. تأكد من إعداد المفاتيح في core/supabase.js</p>';
    return;
  }

  try {
    // استعادة الجلسة المخزنة
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session?.user) {
      appState.set('user', session.user);
      appState.set('session', session);
    }

    // مراقبة تغيرات المصادقة
    window.supabase.auth.onAuthStateChange((_event, session) => {
      appState.set('user', session?.user || null);
      appState.set('session', session);
    });

    // بناء الواجهة (هيدر + شريط جانبي)
    loadLayout();

    // تعريف المسارات
    initRouter();

    // تحميل الصفحة الحالية
    router.resolve();
  } catch (error) {
    console.error('فشل بدء التطبيق:', error);
    document.getElementById('pageContainer').innerHTML =
      `<p class="text-red-500 p-6">خطأ: ${error.message}</p>`;
  }
}

function initRouter() {
  router.addRoute('login', () => import('./pages/login.js').then(m => m.renderLoginPage()));
  router.addRoute('dashboard', () => import('./pages/dashboard.js').then(m => m.renderDashboardPage()));
  router.addRoute('pos', () => import('./pages/pos.js').then(m => m.renderPOSPage()));
  router.addRoute('kitchen', () => import('./pages/kitchen.js').then(m => m.renderKitchenPage()));
  router.addRoute('inventory', () => import('./pages/inventory.js').then(m => m.renderInventoryPage()));
  router.addRoute('reports', () => import('./pages/reports.js').then(m => m.renderReportsPage()));
  router.addRoute('settings', () => import('./pages/settings.js').then(m => m.renderSettingsPage()));
  router.addRoute('qrmenu', () => import('./pages/qrmenu.js').then(m => m.renderQRMenuPage()));
}

bootstrap();
