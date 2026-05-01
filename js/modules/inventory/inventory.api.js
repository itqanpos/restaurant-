// =============================================
// نظام المطاعم - Restaurant SaaS
// وحدة المخزون - طبقة API
// =============================================

import { appState } from '../../core/state.js';

const supabase = window.supabase;

export const inventoryAPI = {
  /**
   * جلب جميع مواد المخزون للمطعم الحالي
   * @param {Object} filters - مرشحات
   * @returns {Promise<Array>}
   */
  async getItems(filters = {}) {
    const restaurant = appState.get('restaurant');
    if (!restaurant) return [];

    let query = supabase
      .from('inventory_items')
      .select(`
        *,
        suppliers(name)
      `)
      .eq('restaurant_id', restaurant.id)
      .order('name');

    if (filters.branchId) query = query.eq('branch_id', filters.branchId);
    if (filters.lowStock) query = query.lte('current_quantity', supabase.raw('min_quantity'));
    if (filters.search) query = query.ilike('name', `%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * جلب مادة واحدة
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getItem(id) {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*, suppliers(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * إضافة مادة جديدة للمخزون
   * @param {Object} item
   * @returns {Promise<Object>}
   */
  async createItem(item) {
    const restaurant = appState.get('restaurant');
    const branch = appState.get('currentBranch');

    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        restaurant_id: restaurant.id,
        branch_id: item.branchId || branch?.id || null,
        name: item.name,
        unit: item.unit,
        current_quantity: item.initialQuantity || 0,
        min_quantity: item.minQuantity || 0,
        cost_per_unit: item.costPerUnit || null,
        supplier_id: item.supplierId || null,
      })
      .select()
      .single();

    if (error) throw error;

    // تسجيل حركة المخزون الأولية إذا كانت الكمية > 0
    if (item.initialQuantity > 0) {
      await this.addTransaction(data.id, branch?.id || item.branchId, 'purchase', item.initialQuantity, 'مخزون افتتاحي');
    }

    return data;
  },

  /**
   * تحديث مادة
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateItem(id, updates) {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * حذف مادة (إخفاء)
   * @param {string} id
   */
  async deleteItem(id) {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * إضافة حركة مخزون
   * @param {string} itemId
   * @param {string} branchId
   * @param {string} type - purchase | sale | adjustment | waste
   * @param {number} quantity - موجب للدخول، سالب للخروج
   * @param {string} notes
   * @returns {Promise<Object>}
   */
  async addTransaction(itemId, branchId, type, quantity, notes = '') {
    const user = appState.get('user');

    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert({
        inventory_item_id: itemId,
        branch_id: branchId,
        type,
        quantity,
        notes,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // تحديث الكمية الحالية
    await this.recalculateQuantity(itemId);

    return data;
  },

  /**
   * إعادة حساب الكمية الحالية لمادة
   * @param {string} itemId
   */
  async recalculateQuantity(itemId) {
    const { data: transactions } = await supabase
      .from('inventory_transactions')
      .select('quantity')
      .eq('inventory_item_id', itemId);

    const total = (transactions || []).reduce((sum, t) => sum + parseFloat(t.quantity), 0);

    await supabase
      .from('inventory_items')
      .update({ current_quantity: total })
      .eq('id', itemId);
  },

  /**
   * جلب حركات المخزون لمادة معينة
   * @param {string} itemId
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getTransactions(itemId, limit = 50) {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('inventory_item_id', itemId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * جرد المخزون (تحديث الكمية الفعلية)
   * @param {string} itemId
   * @param {number} actualQuantity
   * @param {string} branchId
   */
  async stockCount(itemId, actualQuantity, branchId) {
    const item = await this.getItem(itemId);
    const difference = actualQuantity - parseFloat(item.current_quantity);

    if (difference !== 0) {
      await this.addTransaction(
        itemId,
        branchId,
        'adjustment',
        difference,
        `جرد مخزون: الفرق ${difference > 0 ? '+' : ''}${difference}`
      );
    }
  },

  /**
   * جلب المواد المنخفضة (أقل من الحد الأدنى)
   * @returns {Promise<Array>}
   */
  async getLowStockItems() {
    const restaurant = appState.get('restaurant');
    if (!restaurant) return [];

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .lte('current_quantity', supabase.raw('min_quantity'));

    if (error) throw error;
    return data;
  },

  /**
   * جلب الموردين
   * @returns {Promise<Array>}
   */
  async getSuppliers() {
    const restaurant = appState.get('restaurant');
    if (!restaurant) return [];

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('name');

    if (error) throw error;
    return data;
  },

  /**
   * إضافة مورد
   * @param {Object} supplier
   * @returns {Promise<Object>}
   */
  async createSupplier(supplier) {
    const restaurant = appState.get('restaurant');
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        restaurant_id: restaurant.id,
        ...supplier,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
