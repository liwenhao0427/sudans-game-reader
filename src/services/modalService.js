// 弹窗管理服务
const BASE_Z_INDEX = 1000; // 基础z-index值
let currentHighestIndex = BASE_Z_INDEX;
let activeModals = [];

export const modalService = {
  /**
   * 注册一个新打开的弹窗并获取其z-index值
   * @returns {number} 分配给弹窗的z-index值
   */
  registerModal() {
    currentHighestIndex += 10; // 每个新弹窗增加10，留出空间给可能的子元素
    activeModals.push(currentHighestIndex);
    return currentHighestIndex;
  },

  /**
   * 注销一个关闭的弹窗
   * @param {number} zIndex 弹窗的z-index值
   */
  unregisterModal(zIndex) {
    const index = activeModals.indexOf(zIndex);
    if (index !== -1) {
      activeModals.splice(index, 1);
    }
    
    // 如果没有活动弹窗，重置计数器
    if (activeModals.length === 0) {
      currentHighestIndex = BASE_Z_INDEX;
    }
  },

  /**
   * 将指定弹窗提升到最前面
   * @param {number} zIndex 当前弹窗的z-index值
   * @returns {number} 新的z-index值
   */
  bringToFront(zIndex) {
    this.unregisterModal(zIndex);
    return this.registerModal();
  }
};