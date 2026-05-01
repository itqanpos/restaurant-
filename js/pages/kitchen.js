// =============================================
// نظام المطاعم - Restaurant SaaS
// صفحة شاشة المطبخ (Kitchen Display System)
// =============================================

import { appState } from '../core/state.js';
import { t } from '../core/i18n.js';
import { updateHeaderTitle, toggleAppUI } from '../shared/layout.js';
import { requireAuth } from '../modules/auth/auth.guard.js';
import { requireRole } from '../modules/auth/auth.guard.js';
import { formatTime, timeAgo, showToast } from '../shared/utils.js';
import { ordersAPI } from '../modules/orders/orders.api.js';

// حالة المطبخ
const kitchenState = {
  orders: [],
  channel: null,
  audioEnabled: true,
};

/**
 * عرض صفحة المطبخ
 */
export async function renderKitchenPage() {
  if (!requireAuth() || !requireRole(['kitchen', 'admin', 'manager'])) return;

  toggleAppUI(true);
  updateHeaderTitle(t('kitchen'));

  const container = document.getElementById('pageContainer');
  if (!container) return;

  renderKitchenLayout(container);
  bindKitchenEvents();
  
  // تحميل الطلبات النشطة
  await loadActiveOrders();
  
  // الاشتراك في الطلبات الجديدة
  subscribeToNewOrders();
}

/**
 * عرض هيكل شاشة المطبخ
 */
function renderKitchenLayout(container) {
  container.innerHTML = `
    <div class="h-full flex flex-col fade-in">
      <!-- الشريط العلوي للمطبخ -->
      <div class="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h2 class="text-xl font-bold"><i class="fas fa-fire text-orange-500"></i> ${t('kitchen')}</h2>
          <span class="text-sm text-gray-400" id="kitchenClock">--:--</span>
        </div>
        <div class="flex items-center gap-3">
          <button id="toggleAudioBtn" class="px-3 py-2 rounded-lg text-sm ${kitchenState.audioEnabled ? 'bg-green-600' : 'bg-gray-600'}">
            <i class="fas ${kitchenState.audioEnabled ? 'fa-volume-up' : 'fa-volume-mute'}"></i>
          </button>
          <button id="refreshKitchenBtn" class="px-3 py-2 bg-indigo-600 rounded-lg text-sm">
            <i class="fas fa-sync-alt"></i> تحديث
          </button>
        </div>
      </div>

      <!-- شبكة الطلبات -->
      <div id="kitchenOrdersGrid" class="flex-1 overflow-y-auto p-4">
        <div class="flex items-center justify-center h-full text-gray-400">
          <i class="fas fa-spinner fa-spin text-2xl"></i>
        </div>
      </div>
    </div>
  `;

  // تحديث الساعة
  updateClock();
  setInterval(updateClock, 30000);
}

/**
 * تحديث الساعة
 */
function updateClock() {
  const clock = document.getElementById('kitchenClock');
  if (clock) {
    clock.textContent = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * ربط أحداث المطبخ
 */
function bindKitchenEvents() {
  document.getElementById('toggleAudioBtn')?.addEventListener('click', () => {
    kitchenState.audioEnabled = !kitchenState.audioEnabled;
    const btn = document.getElementById('toggleAudioBtn');
    btn.innerHTML = kitchenState.audioEnabled
      ? '<i class="fas fa-volume-up"></i>'
      : '<i class="fas fa-volume-mute"></i>';
    btn.className = `px-3 py-2 rounded-lg text-sm ${kitchenState.audioEnabled ? 'bg-green-600' : 'bg-gray-600'}`;
  });

  document.getElementById('refreshKitchenBtn')?.addEventListener('click', loadActiveOrders);
}

/**
 * تحميل الطلبات النشطة
 */
async function loadActiveOrders() {
  try {
    const orders = await ordersAPI.getOrders({ 
      status: ['new', 'preparing'].join(','),
      limit: 50 
    });
    kitchenState.orders = orders;
    renderKitchenOrders();
  } catch (error) {
    console.error('فشل تحميل طلبات المطبخ:', error);
    showToast('فشل تحميل الطلبات', 'error');
  }
}

/**
 * عرض الطلبات في الشبكة
 */
function renderKitchenOrders() {
  const grid = document.getElementById('kitchenOrdersGrid');
  if (!grid) return;

  if (kitchenState.orders.length === 0) {
    grid.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full text-gray-400">
        <i class="fas fa-check-circle text-5xl mb-4 text-green-400"></i>
        <p class="text-lg">لا توجد طلبات نشطة</p>
      </div>`;
    return;
  }

  grid.innerHTML = kitchenState.orders.map(order => `
    <div class="kitchen-order-card bg-white rounded-xl shadow-sm border p-4 mb-4" data-order-id="${order.id}">
      <!-- هيدر الطلب -->
      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="font-bold text-lg">طلب #${order.order_number}</h3>
          <span class="text-xs text-gray-500">${timeAgo(order.created_at)}</span>
          <span class="text-xs px-2 py-0.5 rounded-full ${getTypeBadgeClass(order.type)}">${t(order.type)}</span>
        </div>
        <span class="px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(order.status)}">
          ${t(order.status)}
        </span>
      </div>

      <!-- عناصر الطلب -->
      <ul class="list-disc list-inside space-y-1 mb-4 text-sm">
        ${(order.order_items || []).map(item => `
          <li class="flex justify-between">
            <span>${item.name}</span>
            <span class="font-bold text-gray-600">×${item.quantity}</span>
          </li>
        `).join('')}
      </ul>

      <!-- ملاحظات -->
      ${order.notes ? `
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-sm mb-3">
          <i class="fas fa-sticky-note text-yellow-600"></i> ${order.notes}
        </div>
      ` : ''}

      <!-- أزرار الحالة -->
      <div class="flex gap-2">
        ${order.status === 'new' ? `
          <button onclick="window.updateKitchenOrder('${order.id}', 'preparing')" 
            class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            <i class="fas fa-play"></i> ${t('preparing')}
          </button>
        ` : ''}
        
        ${order.status === 'preparing' ? `
          <button onclick="window.updateKitchenOrder('${order.id}', 'ready')" 
            class="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
            <i class="fas fa-check"></i> ${t('ready')}
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');

  // دوال عامة لتحديث الحالة
  window.updateKitchenOrder = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateOrderStatus(orderId, newStatus);
      
      // تحديث محلي
      const order = kitchenState.orders.find(o => o.id === orderId);
      if (order) {
        order.status = newStatus;
        if (newStatus === 'ready') {
          // إزالة الطلب من الشاشة بعد 5 ثواني
          setTimeout(() => {
            kitchenState.orders = kitchenState.orders.filter(o => o.id !== orderId);
            renderKitchenOrders();
          }, 5000);
        }
        renderKitchenOrders();
      }
      
      showToast(`تم تحديث الطلب #${order?.order_number || orderId}`, 'success');
    } catch (error) {
      showToast('فشل تحديث الطلب', 'error');
    }
  };
}

/**
 * الاشتراك في الطلبات الجديدة (Realtime)
 */
function subscribeToNewOrders() {
  if (kitchenState.channel) {
    kitchenState.channel.unsubscribe();
  }

  kitchenState.channel = ordersAPI.subscribeToNewOrders((newOrder) => {
    // إضافة الطلب الجديد للقائمة
    kitchenState.orders.unshift(newOrder);
    renderKitchenOrders();
    
    // تشغيل صوت التنبيه
    if (kitchenState.audioEnabled) {
      playNotificationSound();
    }
    
    showToast(`${t('newOrder')} #${newOrder.order_number}`, 'info');
  });
}

/**
 * تشغيل صوت التنبيه
 */
function playNotificationSound() {
  try {
    const audio = new Audio('data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9QqOwKNpqVZINbrhihLmBJcDSa7EFkrg7EOz4+Ip2QAAAIAAdEEBQAAAAAAqJ3F0RAAgAAAAAECBAQEBAQEBICA8Q0BAPgAAAAADAgQBAQEBAQEJCAgJAAD8IAAABAEAAAAAAAAAAAAAAAAAAP//wBAAAAABAgICAgMDAwgICRkZGRk=');
    audio.play().catch(e => console.log('تنبيه الصوت مطلوب تفاعل المستخدم أولاً'));
  } catch (e) {
    // تجاهل أخطاء الصوت
  }
}

/**
 * كلاسات شكل الحالة
 */
function getStatusBadgeClass(status) {
  const classes = {
    new: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-blue-100 text-blue-800',
    ready: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

function getTypeBadgeClass(type) {
  const classes = {
    dine_in: 'bg-purple-100 text-purple-800',
    takeaway: 'bg-orange-100 text-orange-800',
    delivery: 'bg-cyan-100 text-cyan-800',
  };
  return classes[type] || '';
}

/**
 * تنظيف الاشتراك عند مغادرة الصفحة
 */
export function cleanupKitchen() {
  if (kitchenState.channel) {
    kitchenState.channel.unsubscribe();
    kitchenState.channel = null;
  }
}
