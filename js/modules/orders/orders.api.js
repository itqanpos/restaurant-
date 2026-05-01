// =============================================
// نظام المطاعم - Restaurant SaaS
// وحدة الطلبات - طبقة API
// =============================================

import { appState } from '../../core/state.js';
import { generateId } from '../../shared/utils.js';

const supabase = window.supabase;

export const ordersAPI = {
  /**
   * إنشاء طلب جديد مع عناصره
   * @param {Object} orderData - بيانات رأس الطلب
   * @param {Array} items - عناصر الطلب
   * @returns {Promise<Object>}
   */
  async createOrder(orderData, items) {
    const restaurant = appState.get('restaurant');
    const branch = appState.get('currentBranch');
    const user = appState.get('user');

    if (!restaurant || !branch) {
      throw new Error('لم يتم تحديد المطعم أو الفرع');
    }

    // تجهيز بيانات الطلب
    const order = {
      restaurant_id: restaurant.id,
      branch_id: branch.id,
      order_number: await this.generateOrderNumber(branch.id),
      source: 'pos',
      type: orderData.type || 'dine_in',
      status: 'new',
      table_number: orderData.tableNumber || null,
      customer_name: orderData.customerName || null,
      customer_phone: orderData.customerPhone || null,
      notes: orderData.notes || null,
      subtotal: orderData.subtotal,
      tax_amount: orderData.tax,
      discount_amount: orderData.discount || 0,
      total: orderData.total,
      created_by: user?.id || null,
    };

    // إدراج الطلب
    const { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();

    if (orderError) throw orderError;

    // إدراج عناصر الطلب
    const orderItems = items.map(item => ({
      order_id: createdOrder.id,
      product_id: item.productId || null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes || null,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // خصم المخزون إذا كان مفعلاً
    await this.deductInventory(items);

    return createdOrder;
  },

  /**
   * جلب طلبات الفرع الحالي
   * @param {Object} filters - مرشحات (status, date, type...)
   * @returns {Promise<Array>}
   */
  async getOrders(filters = {}) {
    const branch = appState.get('currentBranch');
    if (!branch) return [];

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        payments(*)
      `)
      .eq('branch_id', branch.id)
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.date) query = query.eq('created_at::date', filters.date);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * تحديث حالة طلب
   * @param {string} orderId
   * @param {string} status
   */
  async updateOrderStatus(orderId, status) {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) throw error;
  },

  /**
   * تسجيل دفعة
   * @param {string} orderId
   * @param {string} method - cash | visa | wallet
   * @param {number} amount
   */
  async addPayment(orderId, method, amount) {
    const user = appState.get('user');
    const { error } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        method,
        amount,
        paid_by: user?.id,
      });

    if (error) throw error;
  },

  /**
   * توليد رقم تسلسلي للطلب داخل الفرع
   * @param {string} branchId
   * @returns {Promise<number>}
   */
  async generateOrderNumber(branchId) {
    const { data, error } = await supabase
      .from('orders')
      .select('order_number')
      .eq('branch_id', branchId)
      .order('order_number', { ascending: false })
      .limit(1);

    if (error || !data?.length) return 1;
    return (data[0].order_number || 0) + 1;
  },

  /**
   * خصم المخزون بناءً على وصفات المنتجات
   * @param {Array} items
   */
  async deductInventory(items) {
    for (const item of items) {
      if (!item.productId) continue;

      // جلب الوصفة
      const { data: recipes } = await supabase
        .from('recipes')
        .select('inventory_item_id, quantity_used')
        .eq('product_id', item.productId);

      if (!recipes?.length) continue;

      // خصم كل مكون
      for (const recipe of recipes) {
        const qtyToDeduct = recipe.quantity_used * item.quantity;

        // استخدام RPC لخصم المخزون (أو تحديث مباشر)
        const { error } = await supabase.rpc('deduct_inventory', {
          p_item_id: recipe.inventory_item_id,
          p_quantity: qtyToDeduct,
          p_branch_id: appState.get('currentBranch')?.id,
          p_reference: `order_item:${item.productId}`
        });

        if (error) console.warn('فشل خصم المخزون:', error);
      }
    }
  },

  /**
   * الاشتراك في طلبات جديدة (للمطبخ)
   * @param {Function} callback
   * @returns {Object} channel
   */
  subscribeToNewOrders(callback) {
    const branch = appState.get('currentBranch');
    if (!branch) return null;

    return supabase
      .channel('new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `branch_id=eq.${branch.id}`
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },

  /**
   * الاشتراك في تحديثات حالة الطلبات
   * @param {string} orderId
   * @param {Function} callback
   */
  subscribeToOrderUpdates(orderId, callback) {
    return supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  }
};
