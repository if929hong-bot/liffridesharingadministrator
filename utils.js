/**
 * 全局工具類 - 提升網站穩定性、統一處理通用邏輯
 * 適用於所有車隊管理系統頁面（admin-*.html / manager-login.html）
 */
const Utils = {
  // ========== 基礎工具方法 ==========
  /**
   * 安全解析JSON（避免解析失敗導致頁面崩潰）
   * @param {string} str - 要解析的JSON字串
   * @returns {any|null} 解析後的數據，失敗返回null
   */
  safeParseJSON(str) {
    try {
      return str && str !== 'null' && str !== 'undefined' ? JSON.parse(str) : null;
    } catch (e) {
      console.error('JSON解析失敗:', e, '原始字串:', str);
      return null;
    }
  },

  /**
   * 安全獲取DOM元素（避免操作空元素報錯）
   * @param {string} id - 元素ID
   * @returns {HTMLElement|null} 元素對象或null
   */
  safeGetElement(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`[Utils] 元素#${id}不存在`);
    return el;
  },

  /**
   * 驗證數字輸入（適用價格、金額等表單）
   * @param {string} value - 輸入值
   * @param {boolean} allowZero - 是否允許0（預設不允許）
   * @returns {boolean} 是否有效
   */
  validateNumber(value, allowZero = false) {
    const trimmed = value.trim();
    // 驗證是否為純數字
    if (!/^\d+$/.test(trimmed)) return false;
    // 驗證是否大於0（如果不允許0）
    if (!allowZero && Number(trimmed) <= 0) return false;
    return true;
  },

  // ========== 本地存儲管理（帶過期機制） ==========
  Storage: {
    /**
     * 儲存數據到localStorage（自動序列化+設置過期）
     * @param {string} key - 儲存鍵名
     * @param {any} data - 要儲存的數據
     * @param {number} expireHours - 過期小時（預設24小時）
     */
    set(key, data, expireHours = 24) {
      try {
        const value = JSON.stringify(data);
        localStorage.setItem(key, value);
        // 設置過期時間戳
        if (expireHours) {
          const expireTime = Date.now() + expireHours * 60 * 60 * 1000;
          localStorage.setItem(`${key}_expire`, expireTime);
        }
      } catch (e) {
        console.error('[Storage] 儲存失敗:', e);
        alert('本地存儲空間不足，無法保存數據！');
      }
    },

    /**
     * 從localStorage獲取數據（自動檢查過期）
     * @param {string} key - 儲存鍵名
     * @returns {any|null} 儲存的數據，過期/不存在返回null
     */
    get(key) {
      try {
        const expireTime = localStorage.getItem(`${key}_expire`);
        // 檢查是否過期
        if (expireTime && Date.now() > Number(expireTime)) {
          this.remove(key);
          return null;
        }
        // 解析並返回數據
        return Utils.safeParseJSON(localStorage.getItem(key));
      } catch (e) {
        console.error('[Storage] 讀取失敗:', e);
        return null;
      }
    },

    /**
     * 移除localStorage中的數據（包含過期標記）
     * @param {string} key - 儲存鍵名
     */
    remove(key) {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_expire`);
    },

    /**
     * 清空所有車隊管理系統相關存儲
     */
    clearAllFleetData() {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('fleet') || key.includes('admin') || key.includes('price') || key.includes('finance')) {
          this.remove(key);
        }
      });
    }
  },

  // ========== 登錄狀態管理 ==========
  Auth: {
    // 登錄狀態相關鍵名（與業務代碼統一）
    KEYS: {
      LOGGED_IN: 'loggedInFleetAdmin',
      BACKUP: 'currentFleetAdmin',
      EXPIRE: 'adminExpireTime'
    },

    /**
     * 檢查登錄狀態是否有效（核心穩定性方法）
     * @returns {boolean} 是否登錄有效
     */
    checkLoginStatus() {
      // 1. 獲取登錄數據（優先主鍵，後備份鍵）
      let adminData = Utils.Storage.get(Utils.Auth.KEYS.LOGGED_IN);
      if (!adminData) {
        adminData = Utils.Storage.get(Utils.Auth.KEYS.BACKUP);
      }

      // 2. 驗證登錄數據是否有效
      const hasValidAccount = adminData && (
        adminData.帳號 || adminData.username || adminData.account || adminData.phone
      );

      if (!hasValidAccount) {
        // 登錄無效：清除殘留數據
        Utils.Storage.clearAllFleetData();
        return false;
      }

      // 3. 自動續期（每次檢查都延長24小時過期）
      Utils.Storage.set(Utils.Auth.KEYS.LOGGED_IN, adminData, 24);
      return true;
    },

    /**
     * 強制跳轉到登入頁（登錄無效時調用）
     */
    redirectToLogin() {
      alert('登錄已過期或未登錄，請重新登入！');
      window.location.href = 'manager-login.html';
    },

    /**
     * 退出登錄（清除所有登錄狀態）
     */
    logout() {
      Utils.Storage.clearAllFleetData();
      window.location.href = 'manager-login.html';
    }
  },

  // ========== UI增強方法 ==========
  /**
   * 顯示加載狀態（適用表格/按鈕等加載場景）
   * @param {HTMLElement} el - 要顯示加載狀態的元素
   * @param {string} text - 加載提示文字（預設：加載中...）
   */
  showLoading(el, text = '加載中...') {
    if (!el) return;
    el.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #666;">
        <i class="fa fa-spinner fa-spin mr-2"></i>${text}
      </div>
    `;
  },

  /**
   * 顯示空數據提示（適用表格）
   * @param {HTMLElement} el - 要顯示提示的元素
   * @param {string} text - 空數據提示文字
   * @param {number} colspan - 表格列數（適用td colspan）
   */
  showEmptyData(el, text = '暫無數據', colspan = 1) {
    if (!el) return;
    if (el.tagName === 'TBODY') {
      el.innerHTML = `
        <tr>
          <td colspan="${colspan}" style="padding: 30px; text-align: center; color: #666;">
            ${text}
          </td>
        </tr>
      `;
    } else {
      el.innerHTML = `
        <div style="padding: 30px; text-align: center; color: #666;">
          ${text}
        </div>
      `;
    }
  },

  /**
   * 表單數字驗證（批量驗證輸入框）
   * @param {NodeList} inputs - 要驗證的輸入框集合
   * @returns {boolean} 是否全部驗證通過
   */
  validateFormNumbers(inputs) {
    let isValid = true;
    inputs.forEach(input => {
      const label = input.previousElementSibling?.textContent || input.name || '該項';
      const value = input.value;

      if (!Utils.validateNumber(value)) {
        alert(`${label}只能填大於0的數字！`);
        input.focus();
        isValid = false;
        return false; // 中斷forEach
      }
    });
    return isValid;
  }
};

// ========== 全局初始化（頁面加載後自動執行基礎檢查） ==========
document.addEventListener('DOMContentLoaded', function() {
  // 1. 對所有管理頁面自動檢查登錄狀態
  const isAdminPage = window.location.pathname.includes('admin-');
  if (isAdminPage && !Utils.Auth.checkLoginStatus()) {
    Utils.Auth.redirectToLogin();
  }

  // 2. 統一處理退出登錄按鈕（所有頁面通用）
  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('確定要退出登入嗎？')) {
        Utils.Auth.logout();
      }
    });
  }
});