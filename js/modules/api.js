// =============================================
// نظام المطاعم - Restaurant SaaS
// طبقة API المركزية (Supabase)
// =============================================

const SUPABASE_URL = 'https://xisosjmybqmuzveffhdb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc29zam15YnFtdXp2ZWZmaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzg2OTgsImV4cCI6MjA4MzYxNDY5OH0.w6ozzvUv0VG7PVizc0TFpwfYq8x50AqqOkwrlQ1eSLM';

const supabaseClient = window.supabase?.createClient
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// تصدير عام
window.supabase = supabaseClient;

const api = {
    // ---------- المنتجات ----------
    async getProducts() {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*, categories(name)')
            .eq('is_available', true)
            .order('name');
        if (error) throw error;
        return data;
    },

    async getCategories() {
        const { data, error } = await supabaseClient
            .from('categories')
            .select('*')
            .order('sort_order');
        if (error) throw error;
        return data;
    },

    // ---------- الطلبات ----------
    async createOrder(orderData, items) {
        const { data: order, error } = await supabaseClient
            .from('orders')
            .insert(orderData)
            .select()
            .single();
        if (error) throw error;

        const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }));
        const { error: itemError } = await supabaseClient
            .from('order_items')
            .insert(orderItems);
        if (itemError) throw itemError;

        return order;
    },

    async getOrders(branchId) {
        let query = supabaseClient
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false })
            .limit(50);
        if (branchId) query = query.eq('branch_id', branchId);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async updateOrderStatus(orderId, status) {
        const { error } = await supabaseClient
            .from('orders')
            .update({ status })
            .eq('id', orderId);
        if (error) throw error;
    },

    // ---------- المخزون ----------
    async getInventory() {
        const { data, error } = await supabaseClient
            .from('inventory_items')
            .select('*')
            .order('name');
        if (error) throw error;
        return data;
    },

    async addInventoryItem(item) {
        const { data, error } = await supabaseClient
            .from('inventory_items')
            .insert(item)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateInventoryItem(id, updates) {
        const { error } = await supabaseClient
            .from('inventory_items')
            .update(updates)
            .eq('id', id);
        if (error) throw error;
    },

    // ---------- الخصومات ----------
    async getDiscounts(restaurantId) {
        let query = supabaseClient
            .from('discounts')
            .select('*')
            .order('created_at', { ascending: false });
        if (restaurantId) query = query.eq('restaurant_id', restaurantId);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async validateDiscount(code, restaurantId) {
        const { data, error } = await supabaseClient
            .from('discounts')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .eq('restaurant_id', restaurantId)
            .single();
        if (error) return null;
        // تحقق من التاريخ والاستخدامات
        const now = new Date();
        if (data.valid_from && new Date(data.valid_from) > now) return null;
        if (data.valid_until && new Date(data.valid_until) < now) return null;
        if (data.max_uses && data.current_uses >= data.max_uses) return null;
        return data;
    },

    async applyDiscountUsage(discountId) {
        const { error } = await supabaseClient.rpc('increment_discount_usage', { discount_id: discountId });
        if (error) throw error;
    },

    // ---------- المستخدمين والأدوار ----------
    async getUsers(restaurantId) {
        const { data, error } = await supabaseClient
            .from('user_restaurant_roles')
            .select('id, user_id, branch_id, users!inner(full_name, email), roles(name), branches(name)')
            .eq('restaurant_id', restaurantId);
        if (error) throw error;
        return data;
    },

    async addUser(email, password, fullName) {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        return data.user;
    },

    async assignRole(userId, restaurantId, branchId, roleName) {
        // جلب role_id
        const { data: role } = await supabaseClient
            .from('roles')
            .select('id')
            .eq('name', roleName)
            .single();
        if (!role) throw new Error('الدور غير موجود');

        const { error } = await supabaseClient
            .from('user_restaurant_roles')
            .insert({
                user_id: userId,
                restaurant_id: restaurantId,
                branch_id: branchId || null,
                role_id: role.id
            });
        if (error) throw error;
    },

    // ---------- التقارير ----------
    async getSalesReport(branchId, period = 'week') {
        // استدعاء دالة مخزنة أو معالجة مباشرة (مثال)
        const { data, error } = await supabaseClient
            .from('orders')
            .select('total, created_at')
            .eq('branch_id', branchId)
            .gte('created_at', getPeriodStart(period))
            .order('created_at');
        if (error) throw error;
        return data;
    },

    // ---------- الإشعارات والمطبخ (Realtime) ----------
    subscribeToNewOrders(branchId, callback) {
        return supabaseClient
            .channel('new-orders')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders', filter: `branch_id=eq.${branchId}` },
                payload => callback(payload.new)
            )
            .subscribe();
    }
};

// دوال مساعدة
function getPeriodStart(period) {
    const now = new Date();
    switch (period) {
        case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        case 'week': return new Date(now.setDate(now.getDate() - 7)).toISOString();
        case 'month': return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        default: return new Date(now.setDate(now.getDate() - 7)).toISOString();
    }
}

// تصدير api للاستخدام في App
export { api };
