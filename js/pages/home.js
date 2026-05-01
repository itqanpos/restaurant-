function initHome() {
  const grid = document.getElementById('homeGrid');
  if (!grid) return;

  const pages = [
    { id: 'dashboard', icon: 'th-large', label: 'لوحة التحكم', color: 'bg-indigo-500' },
    { id: 'pos', icon: 'cash-register', label: 'الكاشير', color: 'bg-green-500' },
    { id: 'kitchen', icon: 'fire', label: 'المطبخ', color: 'bg-orange-500' },
    { id: 'products', icon: 'utensils', label: 'المنتجات', color: 'bg-blue-500' },
    { id: 'inventory', icon: 'boxes', label: 'المخزون', color: 'bg-yellow-500' },
    { id: 'reports', icon: 'chart-bar', label: 'التقارير', color: 'bg-purple-500' },
    { id: 'discounts', icon: 'tags', label: 'الخصومات', color: 'bg-pink-500' },
    { id: 'users', icon: 'users', label: 'المستخدمين', color: 'bg-teal-500' },
    { id: 'settings', icon: 'cog', label: 'الإعدادات', color: 'bg-gray-500' },
    { id: 'qrmenu', icon: 'qrcode', label: 'QR Menu', color: 'bg-gray-700' }
  ];

  const allowed = pages.filter(p => App.canAccess(p.id));

  grid.innerHTML = allowed.map(p => `
    <div onclick="App.loadPage('${p.id}')" class="${p.color} text-white rounded-2xl p-6 shadow-lg cursor-pointer hover:scale-105 transition transform text-center">
      <i class="fas fa-${p.icon} text-4xl mb-4"></i>
      <h3 class="font-bold text-lg">${p.label}</h3>
    </div>
  `).join('');
}
