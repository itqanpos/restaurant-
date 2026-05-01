// =============================================
// نظام المطاعم - Restaurant SaaS
// نقطة الدخول الرئيسية
// =============================================

// استيراد التبعيات الأساسية
import { initApp } from './app.js';
import { supabase, initSupabase } from './core/supabase.js';
import { appState } from './core/state.js';
import { router } from './core/router.js';
import { loadLayout } from './shared/layout.js';

// تهيئة Supabase ثم بدء التطبيق
async function bootstrap() {
  try {
    // تهيئة اتصال Supabase
    initSupabase();

    // محاولة استعادة جلسة المستخدم
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      appState.set('user', session.user);
      appState.set('session', session);
    }

    // مراقبة تغييرات المصادقة
    supabase.auth.onAuthStateChange((_event, session) => {
      appState.set('user', session?.user || null);
      appState.set('session', session);
    });

    // بناء واجهة التطبيق الثابتة (هيدر، شريط جانبي)
    loadLayout();

    // تهيئة المسارات
    initRouter();

    // تحميل الصفحة الحالية
    router.resolve();
  } catch (error) {
    console.error('فشل تشغيل التطبيق:', error);
    document.getElementById('pageContainer').innerHTML = 
      '<p class="text-red-500">خطأ في تحميل التطبيق. تأكد من مفاتيح Supabase.</p>';
  }
}

// تعريف المسارات
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

// بدء التطبيق
bootstrap();
