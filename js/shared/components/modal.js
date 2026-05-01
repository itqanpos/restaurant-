// =============================================
// نظام المطاعم - Restaurant SaaS
// مكون النافذة المنبثقة (Modal)
// =============================================

import { createEl } from '../utils.js';

/**
 * إنشاء وإدارة نافذة منبثقة
 */
export class Modal {
  /**
   * @param {Object} options
   * @param {string} options.title - عنوان النافذة
   * @param {string} options.content - محتوى HTML
   * @param {Array} options.buttons - أزرار (مثل [{ text: 'حفظ', class: 'btn-primary', onClick: fn }])
   * @param {boolean} options.closeOnOverlay - إغلاق بالنقر خارج النافذة (افتراضي true)
   * @param {string} options.size - sm | md | lg | xl (افتراضي md)
   */
  constructor(options = {}) {
    this.options = {
      closeOnOverlay: true,
      size: 'md',
      ...options
    };
    this.overlay = null;
    this.content = null;
    this.render();
  }

  render() {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
    };

    // إنشاء الطبقة الخلفية
    this.overlay = createEl('div', {
      className: 'modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4',
      onclick: (e) => {
        if (this.options.closeOnOverlay && e.target === this.overlay) {
          this.close();
        }
      }
    });

    // إنشاء محتوى النافذة
    this.content = createEl('div', {
      className: `modal-content bg-white rounded-2xl shadow-xl w-full ${sizeClasses[this.options.size]} transform transition-all duration-300`
    });

    // الهيدر
    if (this.options.title) {
      const header = createEl('div', {
        className: 'flex items-center justify-between p-4 border-b'
      }, [
        createEl('h3', { className: 'text-lg font-bold' }, this.options.title),
        createEl('button', {
          className: 'text-gray-400 hover:text-gray-600 p-1',
          onclick: () => this.close()
        }, '<i class="fas fa-times"></i>')
      ]);
      this.content.appendChild(header);
    }

    // جسم النافذة
    const body = createEl('div', {
      className: 'p-4'
    }, this.options.content);
    this.content.appendChild(body);

    // الأزرار
    if (this.options.buttons && this.options.buttons.length > 0) {
      const footer = createEl('div', {
        className: 'flex justify-end gap-2 p-4 border-t'
      });

      this.options.buttons.forEach(btn => {
        const button = createEl('button', {
          className: `px-4 py-2 rounded-lg font-medium transition ${btn.class || 'bg-gray-200 hover:bg-gray-300'}`,
          onclick: (e) => {
            if (btn.onClick) btn.onClick(e, this);
            if (btn.closeOnClick !== false) this.close();
          }
        }, btn.text);
        footer.appendChild(button);
      });

      this.content.appendChild(footer);
    }

    this.overlay.appendChild(this.content);
  }

  open() {
    document.body.appendChild(this.overlay);
    // تأثير ظهور
    setTimeout(() => {
      this.content.style.opacity = '1';
      this.content.style.transform = 'scale(1)';
    }, 10);
    return this;
  }

  close() {
    this.content.style.opacity = '0';
    this.content.style.transform = 'scale(0.95)';
    setTimeout(() => {
      if (this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
    }, 200);
    return this;
  }
}

/**
 * عرض نافذة تأكيد سريعة
 * @param {string} message 
 * @param {Function} onConfirm 
 * @param {string} title 
 * @returns {Modal}
 */
export function confirmModal(message, onConfirm, title = 'تأكيد') {
  return new Modal({
    title,
    content: `<p class="text-gray-600">${message}</p>`,
    buttons: [
      { text: 'إلغاء', class: 'bg-gray-200 hover:bg-gray-300 text-gray-700', onClick: () => {} },
      { text: 'تأكيد', class: 'bg-indigo-600 hover:bg-indigo-700 text-white', onClick: onConfirm }
    ]
  }).open();
}

/**
 * عرض نافذة تنبيه
 * @param {string} message 
 * @param {string} type - success | error | warning
 * @returns {Modal}
 */
export function alertModal(message, type = 'info') {
  const icons = { success: 'fa-check-circle text-green-500', error: 'fa-times-circle text-red-500', warning: 'fa-exclamation-triangle text-yellow-500', info: 'fa-info-circle text-blue-500' };
  const colors = { success: 'green', error: 'red', warning: 'yellow', info: 'blue' };

  return new Modal({
    title: '',
    content: `
      <div class="text-center">
        <i class="fas ${icons[type]} text-5xl mb-4"></i>
        <p class="text-lg">${message}</p>
      </div>
    `,
    buttons: [
      { text: 'موافق', class: `bg-${colors[type]}-600 hover:bg-${colors[type]}-700 text-white`, onClick: () => {} }
    ]
  }).open();
}
