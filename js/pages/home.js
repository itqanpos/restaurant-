function initHome() {
  const grid = document.getElementById('homeGrid');
  if (!grid) return;

  const pages = [
    { id: 'pos', icon: 'cash-register', label: 'الكاشير', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'kitchen', icon: 'fire', label: 'المطبخ', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { id: 'products', icon: 'utensils', label: 'المنتجات', color: 'bg-green-50 text-green-700 border-green-200' },
    { id: 'inventory', icon: 'boxes', label: 'المخزون', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { id: 'reports', icon: 'chart-bar', label: 'التقارير', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { id: 'discounts', icon: 'tags', label: 'الخصومات', color: 'bg-pink-50 text-pink-700 border-pink-200' },
    { id: 'users', icon: 'users', label: 'المستخدمين', color: 'bg-teal-50 text-teal-700 border-teal-200' },
    { id: 'settings', icon: 'cog', label: 'الإعدادات', color: 'bg-gray-50 text-gray-700 border-gray-300' },
    { id: 'qrmenu', icon: 'qrcode', label: 'QR Menu', color: 'bg-sky-50 text-sky-700 border-sky-200' }
  ];

  const allowed = pages.filter(p => App.canAccess(p.id));

  grid.innerHTML = allowed.map(p => `
    <div onclick="App.loadPage('${p.id}')" 
         class="rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border ${p.color} flex flex-col items-center justify-center text-center hover:-translate-y-1 duration-200">
      <div class="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
        <i class="fas fa-${p.icon} text-2xl" style="color: currentColor;"></i>
      </div>
      <h3 class="font-bold text-base">${p.label}</h3>
    </div>
  `).join('');
}
