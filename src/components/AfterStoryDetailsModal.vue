<template>
  <div class="modal-overlay" v-if="visible" @click.self="closeModal" :style="{ zIndex: modalZIndex }" @mousedown="bringToFront">
    <div class="modal-container">
      <div class="modal-header">
        <h3>{{ afterStoryData.name || '后日谈详情' }}</h3>
        <button class="close-button" @click="closeModal">×</button>
      </div>
      <div class="modal-content">
        <div v-if="loading" class="loading">
          <p>加载中...</p>
        </div>
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
        </div>
        <div v-else class="after-story-details">
          <!-- 使用 AfterStoryDetails 组件显示后日谈数据 -->
          <after-story-details :afterStory="afterStoryData"></after-story-details>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { loadAfterStoryById } from '@/services/eventService';
import AfterStoryDetails from '@/components/AfterStoryDetails.vue';
import eventBus from '@/utils/eventBus';
import { modalService } from '@/services/modalService';

export default {
  name: 'AfterStoryDetailsModal',
  components: {
    AfterStoryDetails
  },
  data() {
    return {
      visible: false,
      afterStoryData: {},
      loading: false,
      error: null,
      afterStoryId: null,
      modalZIndex: 1000 // 默认z-index
    };
  },
  methods: {
    async showModal(afterStoryId) {
      this.visible = true;
      this.loading = true;
      this.error = null;
      this.afterStoryId = afterStoryId;
      
      // 获取新的z-index值
      this.modalZIndex = modalService.registerModal();
      
      try {
        const afterStoryData = await loadAfterStoryById(afterStoryId);
        if (afterStoryData) {
          this.afterStoryData = afterStoryData;
        } else {
          this.error = `未找到ID为 ${afterStoryId} 的后日谈`;
        }
      } catch (error) {
        this.error = `加载后日谈数据失败: ${error.message}`;
        console.error('加载后日谈数据失败:', error);
      } finally {
        this.loading = false;
      }
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
  created() {
    // 使用 mitt 监听事件
    eventBus.on('show-after-story-details', this.showModal);
  },
  beforeUnmount() {
    // 移除事件监听
    eventBus.off('show-after-story-details', this.showModal);
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

/* 其他样式保持不变 */
.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
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
  font-size: 20px;
  cursor: pointer;
  color: #909399;
}

.modal-content {
  padding: 20px;
}

.loading, .error {
  text-align: center;
  padding: 30px;
}

.error {
  color: #f56c6c;
}
</style>