<template>
  <div class="modal-overlay" v-if="visible" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h3>{{ overData.name || '结局详情' }}</h3>
        <button class="close-button" @click="closeModal">×</button>
      </div>
      <div class="modal-content">
        <div v-if="loading" class="loading">
          <p>加载中...</p>
        </div>
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
        </div>
        <div v-else class="over-details">
          <!-- 使用 OverDetails 组件显示结局数据 -->
          <over-details :over="overData"></over-details>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getOverById } from '@/services/eventService';
import OverDetails from '@/components/OverDetails.vue';
import eventBus from '@/utils/eventBus';

export default {
  name: 'OverDetailsModal',
  components: {
    OverDetails
  },
  data() {
    return {
      visible: false,
      overData: {},
      loading: false,
      error: null,
      overId: null
    };
  },
  methods: {
    async showModal(overId) {
      this.visible = true;
      this.loading = true;
      this.error = null;
      this.overId = overId;
      
      try {
        const overData = await getOverById(overId);
        if (overData) {
          this.overData = overData;
          this.overData.id = overId;
        } else {
          this.error = `未找到ID为 ${overId} 的结局`;
        }
      } catch (error) {
        this.error = `加载结局数据失败: ${error.message}`;
        console.error('加载结局数据失败:', error);
      } finally {
        this.loading = false;
      }
    },
    closeModal() {
      this.visible = false;
    }
  },
  created() {
    // 使用 mitt 监听事件
    eventBus.on('show-over-details', this.showModal);
  },
  beforeUnmount() {
    // 移除事件监听
    eventBus.off('show-over-details', this.showModal);
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-content {
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
}

.loading, .error {
  text-align: center;
  padding: 20px;
}

.error {
  color: #721c24;
  background-color: #f8d7da;
  border-radius: 4px;
  padding: 10px;
}
</style>