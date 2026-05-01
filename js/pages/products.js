// =============================================
// إدارة المنتجات – Products Manager
// =============================================
async function initProducts() {
  await loadProducts();
  await loadCategories();
}

async function loadProducts() {
  const tbody = document.getElementById('productsTableBody');
  try {
    const products = await window.Api.getProducts(App.restaurant.id);
    tbody.innerHTML = products.map(p => `
      <tr class="border-t">
        <td class="p-3 font-medium">${p.name}</td>
        <td class="p-3">${p.categories?.name || '-'}</td>
        <td class="p-3">${App.formatCurrency(p.price)}</td>
        <td class="p-3"><span class="px-2 py-1 rounded-full text-xs ${p.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${p.is_available ? 'متاح' : 'مخفي'}</span></td>
        <td class="p-3">
          <button onclick="editProduct('${p.id}')" class="text-blue-600 mr-2"><i class="fas fa-edit"></i></button>
          <button onclick="deleteProduct('${p.id}')" class="text-red-500"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-red-500">فشل تحميل المنتجات</td></tr>';
  }
}

async function loadCategories() {
  const select = document.getElementById('productCategory');
  const categories = await window.Api.getCategories(App.restaurant.id);
  select.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

window.openProductModal = function(id = null) {
  document.getElementById('productModal').classList.remove('hidden');
  document.getElementById('modalTitle').textContent = id ? 'تعديل المنتج' : 'إضافة منتج جديد';
  document.getElementById('productId').value = id || '';
  if (!id) {
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
  } else {
    const product = App.products.find(p => p.id === id);
    if (product) {
      document.getElementById('productName').value = product.name;
      document.getElementById('productPrice').value = product.price;
      document.getElementById('productCategory').value = product.category_id || '';
    }
  }
};

window.closeProductModal = function() {
  document.getElementById('productModal').classList.add('hidden');
};

window.saveProduct = async function(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const name = document.getElementById('productName').value;
  const price = parseFloat(document.getElementById('productPrice').value);
  const categoryId = document.getElementById('productCategory').value || null;

  if (id) {
    await window.Api.updateProduct(id, { name, price, category_id: categoryId });
  } else {
    await window.Api.addProduct(App.restaurant.id, { name, price, category_id: categoryId, is_available: true });
  }
  closeProductModal();
  App.products = await window.Api.getProducts(App.restaurant.id);
  loadProducts();
};

window.deleteProduct = async function(id) {
  if (confirm('إخفاء هذا المنتج؟')) {
    await window.Api.updateProduct(id, { is_available: false });
    App.products = await window.Api.getProducts(App.restaurant.id);
    loadProducts();
  }
};
