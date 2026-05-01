// =============================================
// نظام المطاعم - Restaurant SaaS
// وحدة المنتجات - طبقة API
// =============================================

import { appState } from '../../core/state.js';

const supabase = window.supabase;

export const productsAPI = {
  /**
   * جلب جميع الأصناف للمطعم الحالي
   * @returns {Promise<Array>}
   */
  async getCategories() {
    const restaurant = appState.get('restaurant');
    if (!restaurant) return [];

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * إنشاء صنف جديد
   * @param {Object} category
   * @returns {Promise<Object>}
   */
  async createCategory(category) {
    const restaurant = appState.get('restaurant');
    const { data, error } = await supabase
      .from('categories')
      .insert({
        restaurant_id: restaurant.id,
        name: category.name,
        image_url: category.imageUrl || null,
        sort_order: category.sortOrder || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * جلب جميع المنتجات للمطعم الحالي
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  async getProducts(filters = {}) {
    const restaurant = appState.get('restaurant');
    if (!restaurant) return [];

    let query = supabase
      .from('products')
      .select(`
        *,
        categories(name)
      `)
      .eq('restaurant_id', restaurant.id)
      .order('name');

    if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters.isAvailable !== undefined) query = query.eq('is_available', filters.isAvailable);
    if (filters.search) query = query.ilike('name', `%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * جلب منتج واحد
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getProduct(id) {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name), recipes(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * إنشاء منتج جديد
   * @param {Object} product
   * @returns {Promise<Object>}
   */
  async createProduct(product) {
    const restaurant = appState.get('restaurant');
    const { data, error } = await supabase
      .from('products')
      .insert({
        restaurant_id: restaurant.id,
        category_id: product.categoryId || null,
        name: product.name,
        description: product.description || null,
        image_url: product.imageUrl || null,
        price: product.price,
        cost_price: product.costPrice || null,
        is_available: product.isAvailable !== false,
        track_inventory: product.trackInventory || false,
        preparation_time: product.preparationTime || 5,
        barcode: product.barcode || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * تحديث منتج
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateProduct(id, updates) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * حذف منتج (تعطيل)
   * @param {string} id
   */
  async deleteProduct(id) {
    const { error } = await supabase
      .from('products')
      .update({ is_available: false })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * جلب وصفات منتج
   * @param {string} productId
   * @returns {Promise<Array>}
   */
  async getProductRecipes(productId) {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        inventory_items(name, unit)
      `)
      .eq('product_id', productId);

    if (error) throw error;
    return data;
  },

  /**
   * إضافة مكون لوصفة منتج
   * @param {string} productId
   * @param {string} inventoryItemId
   * @param {number} quantityUsed
   */
  async addRecipeItem(productId, inventoryItemId, quantityUsed) {
    const { error } = await supabase
      .from('recipes')
      .upsert({
        product_id: productId,
        inventory_item_id: inventoryItemId,
        quantity_used: quantityUsed,
      });

    if (error) throw error;
  },

  /**
   * حذف مكون من وصفة
   * @param {string} recipeId
   */
  async removeRecipeItem(recipeId) {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (error) throw error;
  },

  /**
   * الاشتراك في تغييرات المنتجات (للتحديثات اللحظية)
   * @param {Function} callback
   * @returns {Object}
   */
  subscribeToProductChanges(callback) {
    const restaurant = appState.get('restaurant');
    if (!restaurant) return null;

    return supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `restaurant_id=eq.${restaurant.id}`
        },
        (payload) => callback(payload)
      )
      .subscribe();
  }
};
