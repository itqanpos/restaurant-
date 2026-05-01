// =============================================
// شاشة المطبخ – Kitchen Display (Live)
// =============================================
let kitchenChannel = null; // قناة Realtime

async function initKitchen() {
  // 1. تحميل الطلبات النشطة (جديد + قيد التحضير)
  try {
    const { data: activeOrders } = await window.supabase
      .from('orders')
      .select('*, order_items(*)')
      .in('status', ['new', 'preparing'])
      .order('created_at', { ascending: true });

    App.kitchenOrders = activeOrders?.map(order => ({
      id: order.id,
      order_number: order.order_number,
      items: order.order_items?.map(i => `${i.name} ×${i.quantity}`) || [],
      status: order.status,
      time: order.created_at
    })) || [];

    renderKitchenOrders();
  } catch (err) {
    console.error('فشل تحميل طلبات المطبخ:', err);
  }

  // 2. الاشتراك في الطلبات الجديدة (Realtime)
  if (App.branch?.id && !kitchenChannel) {
    kitchenChannel = window.Api.subscribeToNewOrders(App.branch.id, (newOrder) => {
      // عند وصول طلب جديد، أضفه إلى القائمة
      const exists = App.kitchenOrders.find(o => o.id === newOrder.id);
      if (!exists) {
        App.kitchenOrders.unshift({
          id: newOrder.id,
          order_number: newOrder.order_number,
          items: [], // يمكن جلبها إذا لزم الأمر، لكن نعرض الرقم للحظة
          status: 'new',
          time: newOrder.created_at
        });
        renderKitchenOrders();
        playNotificationSound();
      }
    });
  }
}

// عرض الطلبات في الشبكة
function renderKitchenOrders() {
  const grid = document.getElementById('kitchenOrdersGrid');
  if (!grid) return;

  if (!App.kitchenOrders.length) {
    grid.innerHTML = '<p class="text-gray-400 col-span-full text-center py-8">لا توجد طلبات نشطة</p>';
    return;
  }

  grid.innerHTML = App.kitchenOrders.map(order => `
    <div class="bg-white rounded-xl p-4 shadow border-r-4 transition-all duration-300
      ${order.status === 'new' ? 'border-yellow-500 bg-yellow-50' : ''}
      ${order.status === 'preparing' ? 'border-blue-500 bg-blue-50' : ''}
      ${order.status === 'ready' ? 'border-green-500 bg-green-50' : ''}">
      <div class="flex justify-between items-start mb-3">
        <h3 class="font-bold text-lg">طلب #${order.order_number}</h3>
        <span class="text-xs text-gray-500">${formatTimeAgo(order.time)}</span>
      </div>
      <ul class="list-disc list-inside text-sm mb-4 space-y-1">
        ${order.items.length ? order.items.map(item => `<li>${item}</li>`).join('') : '<li>تفاصيل غير متوفرة</li>'}
      </ul>
      <div class="flex gap-2">
        ${order.status === 'new' ? `
          <button onclick="updateKitchenStatus('${order.id}', 'preparing')" class="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            بدء التحضير
          </button>
        ` : ''}
        ${order.status === 'preparing' ? `
          <button onclick="updateKitchenStatus('${order.id}', 'ready')" class="flex-1 bg-green-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-green-700">
            جاهز
          </button>
        ` : ''}
        ${order.status === 'ready' ? `
          <span class="text-green-600 font-bold text-sm py-1.5"><i class="fas fa-check-circle"></i> جاهز للتسليم</span>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// تحديث حالة الطلب في Supabase والمحلي
window.updateKitchenStatus = async function(orderId, newStatus) {
  try {
    await window.Api.updateOrderStatus(orderId, newStatus);
    const order = App.kitchenOrders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      renderKitchenOrders();

      // إخفاء الطلب بعد 10 ثوانٍ إذا أصبح جاهزاً
      if (newStatus === 'ready') {
        setTimeout(() => {
          App.kitchenOrders = App.kitchenOrders.filter(o => o.id !== orderId);
          renderKitchenOrders();
        }, 10000);
      }
    }
  } catch (err) {
    alert('فشل تحديث الحالة: ' + err.message);
  }
};

// تشغيل صوت التنبيه
function playNotificationSound() {
  try {
    const audio = new Audio('data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9QqOwKNpqVZINbrhihLmBJcDSa7EFkrg7EOz4+Ip2QAAAIAAdEEBQAAAAAAqJ3F0RAAgAAAAAECBAQEBAQEBICA8Q0BAPgAAAAADAgQBAQEBAQEJCAgJAAD8IAAABAEAAAAAAAAAAAAAAAAAAP//wBAAAAABAgICAgMDAwgICRkZGRk=');
    audio.play().catch(() => {});
  } catch (e) {}
}

// تنسيق الوقت النسبي
function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  return `منذ ${hours} ساعة`;
}
