import { AppState } from '../../state/store.js';

export function init() {
  const grid = document.getElementById('homeGrid');
  if (!grid) return;

  const pages = [
    { id: 'pos', icon: 'cash-register', label: 'الكاشير', color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'kitchen', icon: 'fire', label: 'المطبخ', color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'products', icon: 'utensils', label: 'المنتجات', color: 'bg-blue-700 hover:bg-blue-800' },
    { id: 'inventory', icon: 'boxes', label: 'المخزون', color: 'bg-blue-400 hover:bg-blue-500' },
    { id: 'reports', icon: 'chart-bar', label: 'التقارير', color: 'bg-blue-800 hover:bg-blue-900' },
    { id: 'discounts', icon: 'tags', label: 'الخصومات', color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'users', icon: 'users', label: 'المستخدمين', color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'settings', icon: 'cog', label: 'الإعدادات', color: 'bg-blue-700 hover:bg-blue-800' },
    { id: 'qrmenu', icon: 'qrcode', label: 'قائمة QR', color: 'bg-blue-400 hover:bg-blue-500' }
  ];

  grid.innerHTML = pages.map(p => `
    <div onclick="window.location.hash='${p.id}'" class="rounded-2xl p-6 shadow-md hover:shadow-lg transition cursor-pointer ${p.color} text-white flex flex-col items-center justify-center text-center hover:-translate-y-1 duration-200">
      <i class="fas fa-${p.icon} text-3xl mb-3"></i>
      <h3 class="font-bold text-lg">${p.label}</h3>
    </div>
  `).join('');
}
