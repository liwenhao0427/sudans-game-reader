<template>
  <div class="modal-overlay" v-if="visible" @click.self="closeModal" :style="{ zIndex: modalZIndex }" @mousedown="bringToFront">
    <div class="modal-container">
      <div class="modal-header">
        <h3>卡位详情: {{ slotId }}</h3>
        <button class="close-button" @click="closeModal">×</button>
      </div>
      <div class="modal-content">
        <div v-if="slotInfo">
          <!-- 使用通用卡片槽位显示组件 -->
          <slot-display :slotInfo="slotInfo"></slot-display>
        </div>
        <div v-else class="loading-info">
          加载卡位信息中...
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SlotDisplay from './displays/SlotDisplay.vue';
import eventBus from '@/utils/eventBus';
import { modalService } from '@/services/modalService';

export default {
  name: 'SlotDetailsModal',
  components: {
    SlotDisplay
  },
  data() {
    return {
      visible: false,
      slotId: '',
      riteId: null,
      slotInfo: null,
      modalZIndex: 1000 // 默认z-index
    };
  },
  methods: {
    showModal(data) {
      this.visible = true;
      this.riteId = data.riteId;
      this.slotInfo = data.slotInfo;
      this.slotId = data.id || '';
      
      // 获取新的z-index值
      this.modalZIndex = modalService.registerModal();
    },
    closeModal() {
      this.visible = false;
      // 注销弹窗
      modalService.unregisterModal(this.modalZIndex);
    },
    bringToFront() {
      // 将当前弹窗提升到最前面
      this.modalZIndex = modalService.bringToFront(this.modalZIndex);
    }
  },
  mounted() {
    // 监听显示卡位详情的事件
    eventBus.on('show-slot-details', this.showModal);
  },
  beforeUnmount() {
    // 移除事件监听
    eventBus.off('show-slot-details', this.showModal);
    // 确保在组件卸载时注销弹窗
    if (this.visible) {
      modalService.unregisterModal(this.modalZIndex);
    }
  }
}
</script>

<style scoped>
/* 移除固定的z-index值，改为动态绑定 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  /* z-index 现在通过动态绑定设置 */
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  width: 80%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.close-button {
  background: none;
  border: none;
  font-size: 22px;
  color: #909399;
  cursor: pointer;
}

.close-button:hover {
  color: #409eff;
}

.modal-content {
  padding: 20px;
}

.loading-info {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-style: italic;
}
</style>
