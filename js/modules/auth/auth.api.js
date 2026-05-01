// =============================================
// نظام المطاعم - Restaurant SaaS
// وحدة المصادقة - طبقة API (Supabase)
// =============================================

import { appState } from '../../core/state.js';

// استخدام المتغير العام (تم تعريفه في core/supabase.js)
const supabase = window.supabase;

/**
 * كائن يحتوي على جميع دوال المصادقة
 */
export const authAPI = {
  /**
   * تسجيل الدخول بالبريد الإلكتروني وكلمة المرور
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} بيانات المستخدم
   */
  async signIn(email, password) {
    if (!email || !password) {
      throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw this.translateError(error);
    }

    // تحديث الحالة المركزية
    appState.set('user', data.user);
    appState.set('session', data.session);

    // جلب بيانات المطعم المرتبط
    await this.loadRestaurantData(data.user.id);

    return data;
  },

  /**
   * تسجيل مستخدم جديد
   * @param {string} email
   * @param {string} password
   * @param {Object} metadata
   * @returns {Promise<Object>}
   */
  async signUp(email, password, metadata = {}) {
    if (!email || !password) {
      throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان');
    }
    if (password.length < 6) {
      throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: metadata.fullName || '',
          phone: metadata.phone || '',
        },
      },
    });

    if (error) throw this.translateError(error);

    if (data.user && !data.session) {
      return { ...data, message: 'تم إرسال رابط تأكيد إلى بريدك الإلكتروني' };
    }

    appState.set('user', data.user);
    appState.set('session', data.session);
    return data;
  },

  /**
   * تسجيل الخروج
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    appState.set('user', null);
    appState.set('session', null);
    appState.set('restaurant', null);
    appState.set('branches', []);
    appState.set('currentBranch', null);
  },

  /**
   * إعادة تعيين كلمة المرور
   * @param {string} email
   */
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) throw this.translateError(error);
    return { message: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني' };
  },

  /**
   * تحديث كلمة المرور
   * @param {string} newPassword
   */
  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw this.translateError(error);
  },

  /**
   * جلب جلسة المستخدم الحالية
   */
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  /**
   * الاستماع لتغيرات المصادقة
   * @param {Function} callback
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  /**
   * جلب بيانات المطعم المرتبط بالمستخدم
   * @param {string} userId
   */
  async loadRestaurantData(userId) {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_restaurant_roles')
        .select(`
          role_id,
          restaurant_id,
          branch_id,
          roles(name),
          restaurants(*),
          branches(*)
        `)
        .eq('user_id', userId)
        .single();

      if (roleError || !roleData) {
        console.warn('لا توجد صلاحيات مرتبطة بهذا المستخدم');
        return;
      }

      // تخزين بيانات المطعم
      appState.set('restaurant', roleData.restaurants);
      appState.set('currentBranch', roleData.branches);

      // تخزين دور المستخدم
      const user = appState.get('user');
      if (user) {
        user.role = roleData.roles?.name || 'staff';
        appState.set('user', { ...user });
      }

      // جلب جميع الفروع
      const { data: branches } = await supabase
        .from('branches')
        .select('*')
        .eq('restaurant_id', roleData.restaurant_id);

      appState.set('branches', branches || []);
    } catch (err) {
      console.error('فشل تحميل بيانات المطعم:', err);
    }
  },

  /**
   * ترجمة أخطاء Supabase إلى العربية
   * @param {Object} error
   * @returns {Error}
   */
  translateError(error) {
    const errorMap = {
      'Invalid login credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      'Email not confirmed': 'لم يتم تأكيد البريد الإلكتروني بعد',
      'User already registered': 'البريد الإلكتروني مسجل بالفعل',
      'Password should be at least 6 characters': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      'Email rate limit exceeded': 'تم تجاوز الحد المسموح لإرسال البريد، حاول لاحقاً',
      'Database error finding user': 'خطأ في قاعدة البيانات، حاول مرة أخرى',
    };

    const message = errorMap[error.message] || error.message;
    return new Error(message);
  },
};
