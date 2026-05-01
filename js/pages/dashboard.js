// =============================================
// نظام المطاعم - Restaurant SaaS
// صفحة لوحة التحكم (نسخة آمنة)
// =============================================

import { appState } from '../core/state.js';
import { updateHeaderTitle, toggleAppUI } from '../shared/layout.js';
import { requireAuth } from '../modules/auth/auth.guard.js';

export function renderDashboardPage() {
  try {
    // 1. التحقق من تسجيل الدخول
    if (!requireAuth()) return;

    // 2. إظهار واجهة التطبيق
    toggleAppUI(true);
    updateHeaderTitle('الرئيسية');

    // 3. جلب العنصر الحاوي
    const container = document.getElementById('pageContainer');
    if (!container) throw new Error('pageContainer غير موجود');

    // 4. بيانات افتراضية آمنة
    const restaurantName = appState.get('restaurant')?.name || 'مطعم العائلة';
    const currency = appState.get('currency') || 'EGP';
    const symbol = currency === 'EGP' ? 'ج.م' : currency;
    const loyaltyPoints = appState.get('loyaltyPoints') || 0;

    // 5. بناء HTML الصفحة
    container.innerHTML = `
      <div class="fade-in">
        <h1 class="text-2xl font-bold mb-6">لوحة التحكم</h1>
        
        <!-- بطاقات إحصائية -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white p-4 rounded-xl shadow">
            <p class="text-gray-500">مبيعات اليوم</p>
            <h3 class="text-2xl font-bold text-green-600">1,250 ${symbol}</h3>
          </div>
          <div class="bg-white p-4 rounded-xl shadow">
            <p class="text-gray-500">الطلبات</p>
            <h3 class="text-2xl font-bold">34</h3>
          </div>
          <div class="bg-white p-4 rounded-xl shadow">
            <p class="text-gray-500">نقاط الولاء</p>
            <h3 class="text-2xl font-bold text-yellow-500">${loyaltyPoints}</h3>
          </div>
          <div class="bg-white p-4 rounded-xl shadow">
            <p class="text-gray-500">تنبيهات</p>
            <h3 class="text-2xl font-bold text-red-500">2</h3>
          </div>
        </div>
        
        <!-- قسم إضافي -->
        <div class="bg-white p-4 rounded-xl shadow">
          <p class="text-gray-500">مرحباً بك في نظام إدارة المطاعم</p>
          <p class="text-sm text-gray-400 mt-2">${restaurantName} - باقة Pro</p>
        </div>
      </div>
    `;

  } catch (error) {
    console.error('خطأ في عرض لوحة التحكم:', error);
    document.getElementById('pageContainer').innerHTML = 
      `<p class="text-red-500 p-6">تعذر تحميل لوحة التحكم: ${error.message}</p>`;
  }
}
