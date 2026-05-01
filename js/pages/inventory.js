// =============================================
// نظام المطاعم - Restaurant SaaS
// صفحة إدارة المخزون
// =============================================

import { appState } from '../core/state.js';
import { t } from '../core/i18n.js';
import { updateHeaderTitle, toggleAppUI } from '../shared/layout.js';
import { requireAuth } from '../modules/auth/auth.guard.js';
import { formatCurrency, showToast } from '../shared/utils.js';
import { inventoryAPI } from '../modules/inventory/inventory.api.js';
import { Modal } from '../shared/components/Modal.js';

let inventoryState = {
  items: [],
  loading: false,
  filter: 'all',
};

export async function renderInventoryPage() {
  if (!requireAuth()) return;

  toggleAppUI(true);
  updateHeaderTitle(t('inventory'));

  const container = document.getElementById('pageContainer');
  if (!container) return;

  renderLayout(container);
  bindEvents();
  await loadItems();
}

function renderLayout(container) {
  container.innerHTML = `
    <div class="fade-in">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">${t('inventory')}</h2>
        <div class="flex gap-2">
          <button id="addItemBtn" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
            <i class="fas fa-plus"></i> ${t('add')}
          </button>
          <button id="refreshInventoryBtn" class="bg-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-300">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      <!-- مرشحات -->
      <div class="bg-white p-3 rounded-xl shadow-sm mb-4 flex flex-wrap gap-2">
        <button class="filter-btn px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700" data-filter="all">
          ${t('all') || 'الكل'}
        </button>
        <button class="filter-btn px-3 py-1 rounded-full text-sm text-gray-600 hover:bg-gray-100" data-filter="low">
          <i class="fas fa-exclamation-triangle text-red-500"></i> ${t('lowStock')}
        </button>
        <input type="text" id="inventorySearch" placeholder="${t('search')}..." 
          class="border rounded-lg px-3 py-1 text-sm flex-1 min-w-[150px]">
      </div>

      <!-- جدول المخزون -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="p-3 text-right">${t('productName')}</th>
                <th class="p-3 text-center">${t('quantity')}</th>
                <th class="p-3 text-center">${t('unit')}</th>
                <th class="p-3 text-center">${t('minQuantity')}</th>
                <th class="p-3 text-center">${t('price')}</th>
                <th class="p-3 text-center">${t('status') || 'الحالة'}</th>
                <th class="p-3 text-center">${t('actions')}</th>
              </tr>
            </thead>
            <tbody id="inventoryTableBody">
              <tr><td colspan="7" class="text-center py-8 text-gray-400">
                <i class="fas fa-spinner fa-spin"></i> ${t('loading')}
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function bindEvents() {
  document.getElementById('addItemBtn').addEventListener('click', openAddItemModal);
  document.getElementById('refreshInventoryBtn').addEventListener('click', loadItems);
  document.getElementById('inventorySearch').addEventListener('input', filterItems);

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('bg-indigo-100', 'text-indigo-700'));
      btn.classList.add('bg-indigo-100', 'text-indigo-700');
      inventoryState.filter = btn.dataset.filter;
      filterItems();
    });
  });
}

async function loadItems() {
  try {
    inventoryState.loading = true;
    const items = await inventoryAPI.getItems();
    inventoryState.items = items;
    renderTable(items);
  } catch (error) {
    showToast('فشل تحميل المخزون', 'error');
  } finally {
    inventoryState.loading = false;
  }
}

function filterItems() {
  const search = document.getElementById('inventorySearch')?.value?.toLowerCase() || '';
  let filtered = inventoryState.items;

  if (inventoryState.filter === 'low') {
    filtered = filtered.filter(item => item.current_quantity <= item.min_quantity);
  }

  if (search) {
    filtered = filtered.filter(item => item.name.toLowerCase().includes(search));
  }

  renderTable(filtered);
}

function renderTable(items) {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400">لا توجد مواد</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => `
    <tr class="border-t hover:bg-gray-50 transition">
      <td class="p-3 font-medium">${item.name}</td>
      <td class="p-3 text-center ${item.current_quantity <= item.min_quantity ? 'text-red-600 font-bold' : ''}">
        ${item.current_quantity}
      </td>
      <td class="p-3 text-center text-gray-500">${item.unit}</td>
      <td class="p-3 text-center">${item.min_quantity}</td>
      <td class="p-3 text-center">${item.cost_per_unit ? formatCurrency(item.cost_per_unit) : '-'}</td>
      <td class="p-3 text-center">
        <span class="px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(item)}">
          ${item.current_quantity <= item.min_quantity ? t('lowStock') : t('inStock')}
        </span>
      </td>
      <td class="p-3 text-center">
        <div class="flex justify-center gap-2">
          <button onclick="window.editInventoryItem('${item.id}')" class="text-blue-600 hover:text-blue-800">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="window.adjustInventoryItem('${item.id}')" class="text-indigo-600 hover:text-indigo-800">
            <i class="fas fa-balance-scale"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // دوال عامة
  window.editInventoryItem = (id) => openEditItemModal(id);
  window.adjustInventoryItem = (id) => openAdjustModal(id);
}

function getStatusClass(item) {
  if (item.current_quantity <= 0) return 'bg-red-100 text-red-800';
  if (item.current_quantity <= item.min_quantity) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
}

function openAddItemModal() {
  const branch = appState.get('currentBranch');
  
  new Modal({
    title: t('add') + ' ' + t('productName'),
    content: `
      <div class="space-y-3">
        <div><label class="block text-sm mb-1">${t('productName')}</label><input id="itemName" class="form-input"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block text-sm mb-1">${t('quantity')}</label><input id="itemQty" type="number" class="form-input" value="0"></div>
          <div><label class="block text-sm mb-1">${t('unit')}</label><input id="itemUnit" class="form-input" placeholder="كغم"></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block text-sm mb-1">${t('minQuantity')}</label><input id="itemMin" type="number" class="form-input" value="0"></div>
          <div><label class="block text-sm mb-1">${t('price')}</label><input id="itemCost" type="number" class="form-input" step="0.01"></div>
        </div>
      </div>
    `,
    buttons: [
      { text: t('cancel'), class: 'bg-gray-200' },
      {
        text: t('save'),
        class: 'bg-indigo-600 text-white',
        onClick: async () => {
          const data = {
            name: document.getElementById('itemName').value,
            unit: document.getElementById('itemUnit').value,
            initialQuantity: parseFloat(document.getElementById('itemQty').value) || 0,
            minQuantity: parseFloat(document.getElementById('itemMin').value) || 0,
            costPerUnit: parseFloat(document.getElementById('itemCost').value) || null,
            branchId: branch?.id,
          };
          if (!data.name) return showToast('الاسم مطلوب', 'warning');
          try {
            await inventoryAPI.createItem(data);
            showToast('تمت الإضافة', 'success');
            loadItems();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      }
    ]
  }).open();
}

function openEditItemModal(id) {
  const item = inventoryState.items.find(i => i.id === id);
  if (!item) return;

  new Modal({
    title: t('edit'),
    content: `
      <div class="space-y-3">
        <div><label class="block text-sm mb-1">${t('productName')}</label><input id="editName" class="form-input" value="${item.name}"></div>
        <div><label class="block text-sm mb-1">${t('minQuantity')}</label><input id="editMin" type="number" class="form-input" value="${item.min_quantity}"></div>
        <div><label class="block text-sm mb-1">${t('price')}</label><input id="editCost" type="number" class="form-input" step="0.01" value="${item.cost_per_unit || ''}"></div>
      </div>
    `,
    buttons: [
      { text: t('cancel'), class: 'bg-gray-200' },
      {
        text: t('save'),
        class: 'bg-indigo-600 text-white',
        onClick: async () => {
          const updates = {
            name: document.getElementById('editName').value,
            min_quantity: parseFloat(document.getElementById('editMin').value) || 0,
            cost_per_unit: parseFloat(document.getElementById('editCost').value) || null,
          };
          try {
            await inventoryAPI.updateItem(id, updates);
            showToast('تم التحديث', 'success');
            loadItems();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      }
    ]
  }).open();
}

function openAdjustModal(id) {
  const item = inventoryState.items.find(i => i.id === id);
  if (!item) return;
  const branch = appState.get('currentBranch');

  new Modal({
    title: `${t('adjust') || 'جرد'} - ${item.name}`,
    content: `
      <p class="text-sm text-gray-500 mb-3">الكمية الحالية: <strong>${item.current_quantity} ${item.unit}</strong></p>
      <div><label class="block text-sm mb-1">الكمية الفعلية</label><input id="adjustQty" type="number" class="form-input" value="${item.current_quantity}" step="0.001"></div>
    `,
    buttons: [
      { text: t('cancel'), class: 'bg-gray-200' },
      {
        text: t('save'),
        class: 'bg-indigo-600 text-white',
        onClick: async () => {
          const qty = parseFloat(document.getElementById('adjustQty').value);
          if (isNaN(qty)) return;
          try {
            await inventoryAPI.stockCount(id, qty, branch?.id);
            showToast('تم الجرد', 'success');
            loadItems();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      }
    ]
  }).open();
}
