// =============================================
// تهيئة لوحة التحكم – Dashboard Init
// =============================================
async function initDashboard() {
  // 1. جلب الإحصائيات الأساسية (يمكنك تحسينها بدوال SQL لاحقاً)
  try {
    const today = new Date().toISOString().split('T')[0]; // صيغة YYYY-MM-DD
    const { data: orders } = await window.supabase
      .from('orders')
      .select('total')
      .gte('created_at', today);

    const sales = orders?.reduce((sum, o) => sum + o.total, 0) || 0;
    const ordersCount = orders?.length || 0;

    // 2. تنبيهات المخزون
    const { data: lowStock } = await window.supabase
      .from('inventory_items')
      .select('id')
      .lte('current_quantity', window.supabase.raw('min_quantity'));

    const alerts = lowStock?.length || 0;

    // 3. ملء البطاقات
    const statsHTML = `
      <div class="bg-white p-4 rounded-xl shadow">
        <p class="text-gray-500">المبيعات اليوم</p>
        <h3 class="text-2xl font-bold text-green-600">${App.formatCurrency(sales)}</h3>
      </div>
      <div class="bg-white p-4 rounded-xl shadow">
        <p class="text-gray-500">الطلبات اليوم</p>
        <h3 class="text-2xl font-bold text-blue-600">${ordersCount}</h3>
      </div>
      <div class="bg-white p-4 rounded-xl shadow">
        <p class="text-gray-500">تنبيهات المخزون</p>
        <h3 class="text-2xl font-bold text-red-500">${alerts}</h3>
      </div>
      <div class="bg-white p-4 rounded-xl shadow">
        <p class="text-gray-500">متوسط الطلب</p>
        <h3 class="text-2xl font-bold text-purple-600">${ordersCount ? App.formatCurrency(sales / ordersCount) : '0.00 ج.م'}</h3>
      </div>
    `;
    document.getElementById('statsGrid').innerHTML = statsHTML;
  } catch (err) {
    console.error('خطأ في تحميل الإحصائيات:', err);
  }

  // 4. أحدث الطلبات
  try {
    const { data: latest } = await window.supabase
      .from('orders')
      .select('order_number, total, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const list = document.getElementById('latestOrders');
    list.innerHTML = latest?.length
      ? latest.map(o => `<div class="flex justify-between"><span>#${o.order_number}</span><span class="text-green-600">${App.formatCurrency(o.total)}</span></div>`).join('')
      : '<p class="text-gray-400">لا توجد طلبات اليوم</p>';
  } catch (err) {
    console.error(err);
  }

  // 5. رسم بياني (مثال بسيط)
  if (window.Chart) {
    const ctx = document.getElementById('weeklyChart')?.getContext('2d');
    if (ctx) {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['قبل 6 أيام','قبل 5','قبل 4','قبل 3','قبل 2','أمس','اليوم'],
          datasets: [{
            label: 'مبيعات (ج.م)',
            data: [800, 950, 1200, 1100, 1400, 1250, 900], // يمكن جلبها من API
            borderColor: '#6366f1',
            tension: 0.3
          }]
        }
      });
    }
  }
}
