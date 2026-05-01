// =============================================
// نظام المطاعم - Restaurant SaaS
// حماية الصفحات (Auth Guard)
// =============================================

import { appState } from '../../core/state.js';
import { router } from '../../core/router.js';

/**
 * التحقق من أن المستخدم مسجل الدخول.
 * إذا لم يكن كذلك، يتم توجيهه إلى صفحة تسجيل الدخول.
 * @returns {boolean} true إذا كان مصرحاً
 */
export function requireAuth() {
  const user = appState.get('user');
  if (!user) {
    router.navigate('login');
    return false;
  }
  return true;
}

/**
 * التحقق من أن المستخدم لديه دور محدد.
 * @param {string|string[]} roles - الأدوار المسموحة
 * @returns {boolean} true إذا كان مصرحاً
 */
export function requireRole(roles) {
  if (!requireAuth()) return false;

  const user = appState.get('user');
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  // المدير (admin) يملك كل الصلاحيات
  if (user.role === 'admin') return true;

  if (!allowedRoles.includes(user.role)) {
    console.warn(`صلاحية غير كافية: ${user.role} ليس ضمن ${allowedRoles.join(', ')}`);
    router.navigate('dashboard');
    return false;
  }

  return true;
}

/**
 * حماية مخصصة: يمكن تمرير دالة شرط.
 * @param {Function} conditionFn - دالة ترجع true/false
 * @returns {boolean}
 */
export function requireCondition(conditionFn) {
  if (!requireAuth()) return false;
  if (!conditionFn(appState.get('user'), appState)) {
    router.navigate('dashboard');
    return false;
  }
  return true;
}
