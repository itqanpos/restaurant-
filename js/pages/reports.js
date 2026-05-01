// =============================================
// نظام المطاعم - Restaurant SaaS
// صفحة التقارير والتحليلات
// =============================================

import { appState } from '../core/state.js';
import { t } from '../core/i18n.js';
import { updateHeaderTitle, toggleAppUI } from '../shared/layout.js';
import { requireAuth, requireRole } from '../modules/auth/auth.guard.js';
import { formatCurrency, formatDate, showToast } from '../shared/utils.js';
import { ordersAPI } from '../modules/orders/orders.api.js';

let reportsState = {
  period: 'today',
  salesData: null,
  topProducts: [],
  loading: false,
};

export async function renderReportsPage() {
  if (!requireAuth() || !requireRole(['admin', 'manager'])) return;

  toggleAppUI(true);
  updateHeaderTitle(t('reports'));

  const container = document.getElementById('pageContainer');
  if (!container) return;

  renderLayout(container);
  bindEvents();
  await loadReportData();
}

function renderLayout(container) {
  container.innerHTML = `
    <div class="fade-in">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">${t('reports')}</h2>
        <div class="flex gap-2">
          <button id="exportReportBtn" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
            <i class="fas fa-download"></i> ${t('export')}
          </button>
        </div>
      </div>

      <!-- محدد الفترة -->
      <div class="bg-white p-3 rounded-xl shadow-sm mb-6 flex flex-wrap gap-2">
        <button class="period-btn px-4 py-2 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700" data-period="today">
          ${t('today') || 'اليوم'}
        </button>
        <button class="period-btn px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100" data-period="week">
          ${t('weekly')}
        </button>
        <button class="period-btn px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100" data-period="month">
          ${t('monthly')}
        </button>
        <button class="period-btn px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100" data-period="year">
          ${t('yearly') || 'سنوي'}
        </button>
      </div>

      <!-- بطاقات إحصائية -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="statsCards">
        <div class="bg-white p-5 rounded-xl shadow-sm">
          <p class="text-gray-500 text-sm">${t('salesToday')}</p>
          <h3 class="text-2xl font-bold text-green-600" id="statSales">--</h3>
        </div>
        <div class="bg-white p-5 rounded-xl shadow-sm">
          <p class="text-gray-500 text-sm">${t('ordersCount')}</p>
          <h3 class="text-2xl font-bold text-blue-600" id="statOrders">--</h3>
        </div>
        <div class="bg-white p-5 rounded-xl shadow-sm">
          <p class="text-gray-500 text-sm">${t('avgOrder')}</p>
          <h3 class="text-2xl font-bold text-purple-600" id="statAvg">--</h3>
        </div>
        <div class="bg-white p-5 rounded-xl shadow-sm">
          <p class="text-gray-500 text-sm">الضريبة المحصلة</p>
          <h3 class="text-2xl font-bold text-orange-600" id="statTax">--</h3>
        </div>
      </div>

      <!-- رسوم بيانية -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- رسم المبيعات -->
        <div class="bg-white p-5 rounded-xl shadow-sm">
          <h3 class="font-bold text-lg mb-4">${t('salesToday')}</h3>
          <canvas id="salesReportChart" height="250"></canvas>
        </div>

        <!-- المنتجات الأكثر مبيعاً -->
        <div class="bg-white p-5 rounded-xl shadow-sm">
          <h3 class="font-bold text-lg mb-4">${t('topProducts')}</h3>
          <div id="topProductsContainer" class="space-y-3">
            <p class="text-gray-400 text-center">جاري التحميل...</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindEvents() {
  // أزرار الفترة
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('bg-indigo-100', 'text-indigo-700'));
      btn.classList.add('bg-indigo-100', 'text-indigo-700');
      reportsState.period = btn.dataset.period;
      loadReportData();
    });
  });

  document.getElementById('exportReportBtn').addEventListener('click', exportReport);
}

async function loadReportData() {
  reportsState.loading = true;
  try {
    // محاكاة بيانات التقارير (تستبدل بطلبات API حقيقية)
    const data = generateMockReportData(reportsState.period);
    reportsState.salesData = data;
    updateStats(data);
    updateChart(data);
    updateTopProducts(data);
  } catch (error) {
    showToast('فشل تحميل التقارير', 'error');
  } finally {
    reportsState.loading = false;
  }
}

function generateMockReportData(period) {
  // بيانات وهمية للتوضيح
  const ranges = {
    today: { sales: 1250, orders: 34, avg: 36.7, tax: 175 },
    week: { sales: 8750, orders: 238, avg: 36.7, tax: 1225 },
    month: { sales: 35000, orders: 952, avg: 36.7, tax: 4900 },
    year: { sales: 420000, orders: 11424, avg: 36.7, tax: 58800 },
  };

  return {
    ...ranges[period],
    chartLabels: period === 'today' 
      ? ['8ص', '10ص', '12م', '2م', '4م', '6م', '8م', '10م']
      : period === 'week'
      ? ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة']
      : period === 'month'
      ? ['أسبوع 1', 'أسبوع 2', 'أسبوع 3', 'أسبوع 4']
      : ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    chartData: period === 'today'
      ? [50, 120, 200, 180, 150, 220, 180, 150]
      : period === 'week'
      ? [800, 950, 1200, 1100, 1400, 1250, 1050]
      : period === 'month'
      ? [7500, 8200, 9100, 10200]
      : [28000, 31000, 35000, 38000, 34000, 36000, 39000, 37000, 35000, 33000, 36000, 50000],
    topProducts: [
      { name: 'برجر دجاج', count: 145, revenue: 9425 },
      { name: 'برجر لحم', count: 120, revenue: 9000 },
      { name: 'كولا', count: 200, revenue: 3000 },
      { name: 'بطاطس مقلية', count: 180, revenue: 4500 },
      { name: 'عصير برتقال', count: 95, revenue: 1900 },
    ]
  };
}

function updateStats(data) {
  document.getElementById('statSales').textContent = formatCurrency(data.sales);
  document.getElementById('statOrders').textContent = data.orders;
  document.getElementById('statAvg').textContent = formatCurrency(data.avg);
  document.getElementById('statTax').textContent = formatCurrency(data.tax);
}

function updateChart(data) {
  const ctx = document.getElementById('salesReportChart');
  if (!ctx || !window.Chart) return;

  // إزالة الرسم القديم
  const existingChart = Chart.getChart(ctx);
  if (existingChart) existingChart.destroy();

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.chartLabels,
      datasets: [{
        label: t('salesToday'),
        data: data.chartData,
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (val) => formatCurrency(val) }
        }
      }
    }
  });
}

function updateTopProducts(data) {
  const container = document.getElementById('topProductsContainer');
  if (!container) return;

  container.innerHTML = data.topProducts.map((product, index) => `
    <div class="flex items-center justify-between py-2 border-b last:border-b-0">
      <div class="flex items-center gap-3">
        <span class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
          ${index + 1}
        </span>
        <div>
          <p class="font-medium">${product.name}</p>
          <p class="text-xs text-gray-500">${product.count} طلب</p>
        </div>
      </div>
      <span class="font-bold text-green-600">${formatCurrency(product.revenue)}</span>
    </div>
  `).join('');
}

function exportReport() {
  // محاكاة تصدير
  const data = reportsState.salesData;
  if (!data) return;

  let csv = 'التقرير,القيمة\n';
  csv += `المبيعات,${data.sales}\n`;
  csv += `عدد الطلبات,${data.orders}\n`;
  csv += `متوسط الطلب,${data.avg}\n`;
  csv += `الضريبة,${data.tax}\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `تقرير_${reportsState.period}_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('تم التصدير', 'success');
}
