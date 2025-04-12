<template>
  <div class="modal-overlay" v-if="visible" @click.self="closeModal">
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
import eventBus from '@/utils/eventBus';
import SlotDisplay from './displays/SlotDisplay.vue';

export default {
  name: 'SlotDetailsModal',
  components: {
    SlotDisplay
  },
  data() {
    return {
      visible: false,
      slotId: null,
      riteId: null,
      slotInfo: null
    };
  },
  methods: {
    showModal(data) {
      this.slotId = data.slotId;
      this.riteId = data.riteId;
      this.slotInfo = data.slotInfo;
      this.visible = true;
    },
    closeModal() {
      this.visible = false;
    }
  },
  mounted() {
    // 监听显示卡位详情的事件
    eventBus.on('show-slot-details', this.showModal);
  },
  beforeUnmount() {
    // 移除事件监听
    eventBus.off('show-slot-details', this.showModal);
  }
}
</script>

<style scoped>
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
  z-index: 1000;
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