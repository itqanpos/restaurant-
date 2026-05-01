// =============================================
// نظام المطاعم - Restaurant SaaS
// صفحة لوحة التحكم (Dashboard)
// =============================================

import { appState } from '../core/state.js';
import { t } from '../core/i18n.js';
import { updateHeaderTitle, toggleAppUI } from '../shared/layout.js';
import { requireAuth } from '../modules/auth/auth.guard.js';
import { formatCurrency, formatTime } from '../shared/utils.js';

/**
 * عرض صفحة لوحة التحكم
 */
export function renderDashboardPage() {
  // حماية - تحقق من تسجيل الدخول
  if (!requireAuth()) return;

  // إظهار الهيدر والشريط الجانبي
  toggleAppUI(true);
  updateHeaderTitle(t('dashboard'));

  const container = document.getElementById('pageContainer');
  if (!container) return;

  const restaurant = appState.get('restaurant') || {};
  const lowStockCount = 2; // سيتم جلبه من API لاحقاً
  const todaySales = 1250; // بيانات وهمية
  const ordersCount = 34;
  const avgOrder = 36.7;
  const loyaltyPoints = appState.get('loyaltyPoints') || 0;

  container.innerHTML = `
    <div class="fade-in">
      <h2 class="text-2xl font-bold mb-6">${t('dashboard')}</h2>
      
      <!-- بطاقات إحصائية -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">${t('salesToday')}</p>
              <h3 class="text-2xl font-bold text-green-600 mt-1">${formatCurrency(todaySales)}</h3>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <i class="fas fa-chart-line text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">${t('ordersCount')}</p>
              <h3 class="text-2xl font-bold text-blue-600 mt-1">${ordersCount}</h3>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <i class="fas fa-receipt text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">${t('avgOrder')}</p>
              <h3 class="text-2xl font-bold text-purple-600 mt-1">${formatCurrency(avgOrder)}</h3>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <i class="fas fa-calculator text-purple-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">${t('inventoryAlerts')}</p>
              <h3 class="text-2xl font-bold text-red-600 mt-1">${lowStockCount}</h3>
            </div>
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- رسم بياني وأحدث الطلبات -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- رسم بياني للمبيعات -->
        <div class="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 class="font-bold text-lg mb-4">${t('salesToday')}</h3>
          <canvas id="salesChart" height="250"></canvas>
        </div>

        <!-- أحدث الطلبات -->
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 class="font-bold text-lg mb-4">${t('latestOrders')}</h3>
          <div id="latestOrdersContainer" class="space-y-3">
            <!-- يتم ملؤها ديناميكياً -->
            <p class="text-gray-400 text-sm text-center">لا توجد طلبات حديثة</p>
          </div>
        </div>
      </div>

      <!-- نقاط الولاء (بطاقة إضافية) -->
      <div class="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 p-5 rounded-xl shadow-sm text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm opacity-90">${t('loyalty')}</p>
            <h3 class="text-3xl font-bold">${loyaltyPoints} ${t('points')}</h3>
          </div>
          <i class="fas fa-star text-4xl opacity-50"></i>
        </div>
      </div>
    </div>
  `;

  // رسم المبيعات البياني
  setTimeout(() => {
    const ctx = document.getElementById('salesChart');
    if (ctx && window.Chart) {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
          datasets: [{
            label: t('salesToday'),
            data: [800, 950, 1200, 1100, 1400, 1250, 900],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }, 200);
}
