// =============================================
// نظام المطاعم - Restaurant SaaS
// دوال مساعدة عامة (Utilities)
// =============================================

import { CONFIG } from '../core/config.js';
import { appState } from '../core/state.js';
import { t } from '../core/i18n.js';

// ========== تنسيق العملات ==========

/**
 * تنسيق مبلغ نقدي حسب العملة الحالية
 * @param {number} amount - المبلغ
 * @returns {string} المبلغ منسقاً
 */
export function formatCurrency(amount) {
  const currency = appState.get('currency') || CONFIG.DEFAULT_CURRENCY;
  const symbol = CONFIG.CURRENCIES[currency]?.symbol || currency;
  const lang = appState.get('language') || 'ar';
  
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ' + symbol;
}

// ========== تنسيق التواريخ ==========

/**
 * تنسيق تاريخ
 * @param {Date|string} date 
 * @param {Object} options 
 * @returns {string}
 */
export function formatDate(date, options = {}) {
  const lang = appState.get('language') || 'ar';
  const d = new Date(date);
  
  const defaults = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', defaults);
}

/**
 * تنسيق وقت
 * @param {Date|string} date 
 * @returns {string}
 */
export function formatTime(date) {
  const lang = appState.get('language') || 'ar';
  const d = new Date(date);
  return d.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * حساب الوقت المنقضي منذ تاريخ معين (للنص)
 * @param {Date|string} date 
 * @returns {string}
 */
export function timeAgo(date) {
  const lang = appState.get('language') || 'ar';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (lang === 'ar') {
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  } else {
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }
}

// ========== التعامل مع DOM ==========

/**
 * إنشاء عنصر HTML بسرعة
 * @param {string} tag 
 * @param {Object} attributes 
 * @param {string|HTMLElement|Array} children 
 * @returns {HTMLElement}
 */
export function createEl(tag, attributes = {}, children = null) {
  const el = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dk, dv]) => {
        el.dataset[dk] = dv;
      });
    } else if (key.startsWith('on')) {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, value);
    } else {
      el.setAttribute(key, value);
    }
  });

  if (children) {
    if (typeof children === 'string') {
      el.innerHTML = children;
    } else if (Array.isArray(children)) {
      children.forEach(child => el.appendChild(child));
    } else {
      el.appendChild(children);
    }
  }

  return el;
}

/**
 * عرض إشعار مؤقت (Toast)
 * @param {string} message 
 * @param {string} type - success | error | warning | info
 */
export function showToast(message, type = 'info') {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  const toast = createEl('div', {
    className: `fixed bottom-4 left-4 z-50 px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 transform translate-y-0 ${colors[type]}`,
  }, message);

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========== التحقق من الصلاحيات ==========

/**
 * التحقق من صلاحية المستخدم الحالي
 * @param {string|Array} allowedRoles 
 * @returns {boolean}
 */
export function hasPermission(allowedRoles) {
  const user = appState.get('user');
  if (!user) return false;
  if (user.role === 'admin') return true; // المدير لديه كل الصلاحيات
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(user.role);
}

// ========== التعامل مع التخزين المحلي ==========

/**
 * حفظ قيمة في localStorage
 * @param {string} key 
 * @param {*} value 
 */
export function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage غير متوفر');
  }
}

/**
 * استرجاع قيمة من localStorage
 * @param {string} key 
 * @param {*} defaultValue 
 * @returns {*}
 */
export function storageGet(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

// ========== توليد المعرفات ==========

/**
 * توليد معرف فريد (UUID v4 مبسط)
 * @returns {string}
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ========== عمليات حسابية ==========

/**
 * حساب الضريبة
 * @param {number} amount 
 * @param {number} taxRate 
 * @returns {number}
 */
export function calculateTax(amount, taxRate = null) {
  const rate = taxRate || appState.get('taxRate') || CONFIG.DEFAULT_TAX_RATE;
  return amount * (rate / 100);
}

/**
 * تقريب رقم لعدد معين من الخانات العشرية
 * @param {number} value 
 * @param {number} decimals 
 * @returns {number}
 */
export function round(value, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
