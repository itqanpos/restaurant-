// =============================================
// نظام المطاعم - Restaurant SaaS
// صفحة تسجيل الدخول
// =============================================

import { renderLoginPage } from '../modules/auth/auth.ui.js';
import { appState } from '../core/state.js';
import { router } from '../core/router.js';

/**
 * عرض صفحة تسجيل الدخول
 * إذا كان المستخدم مسجلاً بالفعل، يتم توجيهه للرئيسية
 */
export function renderLoginPage() {
  // التحقق إذا كان المستخدم مسجلاً مسبقاً
  const user = appState.get('user');
  if (user) {
    router.navigate('dashboard');
    return;
  }

  // استدعاء واجهة تسجيل الدخول من وحدة المصادقة
  renderLoginPage();
}
