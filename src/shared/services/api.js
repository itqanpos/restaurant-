let _supabase = null;

export function initApi(supabaseInstance) {
  _supabase = supabaseInstance;
}

export const products = {
  async getAll(restId) {
    const { data } = await _supabase.from('products').select('*, categories(name)').eq('restaurant_id', restId).eq('is_available', true).order('name');
    return data || [];
  }
};

export const inventory = {
  async getAll(restId) {
    const { data } = await _supabase.from('inventory_items').select('*').eq('restaurant_id', restId).order('name');
    return data || [];
  }
};

export const orders = {
  async create(orderData, items) {
    const { data: order } = await _supabase.from('orders').insert(orderData).select().single();
    if (order && items.length) {
      await _supabase.from('order_items').insert(items.map(i => ({ ...i, order_id: order.id })));
    }
    return order;
  }
};

export const discounts = {
  async validate(code, restId) {
    const { data } = await _supabase.from('discounts').select('*').eq('code', code).eq('restaurant_id', restId).eq('is_active', true).single();
    if (!data) return null;
    const now = new Date();
    if (data.valid_from && new Date(data.valid_from) > now) return null;
    if (data.valid_until && new Date(data.valid_until) < now) return null;
    return data;
  }
};
