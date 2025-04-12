<template>
  <div class="modal-overlay" v-if="visible" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h3>{{ lootData.name || '战利品详情' }}</h3>
        <button class="close-button" @click="closeModal">×</button>
      </div>
      <div class="modal-content">
        <div v-if="loading" class="loading">
          <p>加载中...</p>
        </div>
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
        </div>
        <div v-else class="loot-details">
          <!-- 使用 EventDetails 组件显示战利品数据 -->
          <event-details :event="lootData"></event-details>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="closeModal">关闭</button>
      </div>
    </div>
  </div>
</template>

<script>
import { loadEventData } from '@/services/eventService';
import EventDetails from '@/components/EventDetails.vue';
import eventBus from '@/utils/eventBus';

export default {
  name: 'LootDetailsModal',
  components: {
    EventDetails
  },
  data() {
    return {
      visible: false,
      lootId: null,
      lootData: {},
      loading: false,
      error: null,
      showRaw: false
    };
  },
  methods: {
    async showModal(lootId) {
      this.lootId = lootId;
      this.visible = true;
      this.loading = true;
      this.error = null;
      this.lootData = {};
      
      try {
        const data = await loadEventData(`${lootId}`, 'loot');
        this.lootData = data || {};
        if (!data) {
          this.error = `无法加载战利品 #${lootId} 的数据`;
        }
      } catch (err) {
        console.error('加载战利品数据失败:', err);
        this.error = `加载战利品数据失败: ${err.message}`;
      } finally {
        this.loading = false;
      }
    },
    closeModal() {
      this.visible = false;
    },
    toggleRawData() {
      this.showRaw = !this.showRaw;
    }
  },
  created() {
    // 使用 mitt 监听事件
    eventBus.on('show-loot-details', this.showModal);
  },
  beforeUnmount() {
    // 移除事件监听
    eventBus.off('show-loot-details', this.showModal);
  }
};
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
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close-button:hover {
  color: #333;
}

.modal-content {
  padding: 0;
  overflow-y: auto;
  flex-grow: 1;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-footer button {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.modal-footer button:hover {
  background-color: #e0e0e0;
}

.loading, .error {
  text-align: center;
  padding: 20px;
}
</style>