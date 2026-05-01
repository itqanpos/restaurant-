// =============================================
// نظام المطاعم - Restaurant SaaS
// واجهة المصادقة - مُعدلة
// =============================================

import { appState } from '../../core/state.js';

export const authAPI = {
  async signIn(email, password) {
    if (!window.supabase) throw new Error('Supabase غير متصل');
    
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw this.translateError(error);

    appState.set('user', data.user);
    appState.set('session', data.session);
    await this.loadRestaurantData(data.user.id);
    return data;
  },

  async signUp(email, password, metadata = {}) {
    if (!window.supabase) throw new Error('Supabase غير متصل');

    const { data, error } = await window.supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: metadata.fullName || '', phone: metadata.phone || '' } },
    });

    if (error) throw this.translateError(error);

    if (data.user && !data.session) {
      return { ...data, message: 'تم إرسال رابط تأكيد إلى بريدك الإلكتروني' };
    }

    appState.set('user', data.user);
    appState.set('session', data.session);
    return data;
  },

  async signOut() {
    if (!window.supabase) return;
    await window.supabase.auth.signOut();
    appState.set('user', null);
    appState.set('session', null);
    appState.set('restaurant', null);
  },

  async loadRestaurantData(userId) {
    try {
      const { data: roleData } = await window.supabase
        .from('user_restaurant_roles')
        .select('role_id, restaurant_id, branch_id, roles(name), restaurants(*), branches(*)')
        .eq('user_id', userId)
        .single();

      if (roleData) {
        appState.set('restaurant', roleData.restaurants);
        appState.set('currentBranch', roleData.branches);

        const user = appState.get('user');
        if (user) {
          user.role = roleData.roles?.name || 'staff';
          appState.set('user', { ...user });
        }

        const { data: branches } = await window.supabase
          .from('branches')
          .select('*')
          .eq('restaurant_id', roleData.restaurant_id);

        appState.set('branches', branches || []);
      }
    } catch (e) {
      console.warn('تعذر تحميل بيانات المطعم:', e);
    }
  },

  translateError(error) {
    const map = {
      'Invalid login credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      'Email not confirmed': 'لم يتم تأكيد البريد الإلكتروني بعد',
      'User already registered': 'البريد الإلكتروني مسجل بالفعل',
    };
    return new Error(map[error.message] || error.message);
  },
};
