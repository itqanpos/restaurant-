// =============================================
// نظام المطاعم - الإضافات (دوال السلة والطلب)
// =============================================
(function() {
  const waitForApp = () => {
    if (!window.App) {
      setTimeout(waitForApp, 50);
      return;
    }

    // خصائص جديدة
    App.orderType = 'dine_in';
    App.table = null;
    App.customer = {};
    App.appliedDiscount = null;

    // دوال السلة
    App.addToCart = function(id, name, price, addons = [], notes = '') {
      const existing = this.cart.find(item =>
        item.id === id &&
        JSON.stringify(item.addons || []) === JSON.stringify(addons) &&
        (item.notes || '') === notes
      );
      if (existing) existing.qty++;
      else this.cart.push({ id, name, price, qty: 1, addons, notes });

      // استدعاء تحديث واجهة السلة (ستُعرِّفها pos.js)
      if (typeof updateCartDisplay === 'function') updateCartDisplay();
    };

    App.changeQty = function(id, delta) {
      const item = this.cart.find(i => i.id === id);
      if (!item) return;
      item.qty += delta;
      if (item.qty <= 0) this.cart = this.cart.filter(i => i.id !== id);
      if (typeof updateCartDisplay === 'function') updateCartDisplay();
    };

    App.clearCart = function() {
      this.cart = [];
      this.appliedDiscount = null;
      if (typeof updateCartDisplay === 'function') updateCartDisplay();
    };

    App.getCartTotals = function() {
      const subtotal = this.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
      let discount = 0;
      if (this.appliedDiscount) {
        discount = this.appliedDiscount.type === 'percentage'
          ? subtotal * (this.appliedDiscount.value / 100)
          : this.appliedDiscount.value;
      }
      const total = Math.max(0, subtotal - discount);
      return { subtotal, discount, total };
    };

    // دالة الطلب
    App.placeOrder = async function(paymentMethod = 'cash') {
      if (!this.cart.length) return;
      const { subtotal, discount, total } = this.getCartTotals();
      const tax = total * (this.taxRate / 100);

      const order = {
        restaurant_id: this.restaurant?.id,
        branch_id: this.branch?.id,
        type: this.orderType,
        status: 'new',
        table_number: this.table,
        customer_name: this.customer.name || null,
        customer_phone: this.customer.phone || null,
        delivery_address: this.customer.address || null,
        notes: this.customer.notes || null,
        subtotal,
        discount_amount: discount,
        tax_amount: tax,
        total: total + tax,
        source: 'pos',
        created_by: this.user?.id
      };

      try {
        const newOrder = await window.Api.orders.create(order, this.cart.map(i => ({
          product_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.qty,
          notes: [i.addons?.join(', '), i.notes].filter(Boolean).join(' | ')
        })));
        alert(`✅ تم الطلب #${newOrder.order_number} - الدفع ${paymentMethod}`);
        this.clearCart();
      } catch (e) {
        alert('فشل الطلب: ' + e.message);
      }
    };

    console.log('✅ الإضافات جاهزة');
  };
  waitForApp();
})();
