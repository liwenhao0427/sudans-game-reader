<template>
    <div class="modal-overlay" v-if="visible" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ riteData.name || '仪式详情' }}</h3>
          <button class="close-button" @click="closeModal">×</button>
        </div>
        <div class="modal-content">
          <div v-if="loading" class="loading">
            <p>加载中...</p>
          </div>
          <div v-else-if="error" class="error">
            <p>{{ error }}</p>
          </div>
          <div v-else class="rite-details">
            <!-- 使用 EventDetails 组件显示仪式数据 -->
            <event-details :event="riteData"></event-details>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { loadEventData } from '@/services/eventService';
  import EventDetails from '@/components/EventDetails.vue';
  import eventBus from '@/utils/eventBus';
  
  export default {
    name: 'RiteDetailsModal',
    components: {
      EventDetails
    },
    data() {
      return {
        visible: false,
        riteId: null,
        riteData: {},
        loading: false,
        error: null
      };
    },
    methods: {
      async showModal(riteId) {
        this.riteId = riteId;
        this.visible = true;
        this.loading = true;
        this.error = null;
        this.riteData = {};
        
        try {
          const data = await loadEventData(riteId, 'rite');
          this.riteData = data || {};
          if (!data) {
            this.error = `无法加载仪式 #${riteId} 的数据`;
          }
        } catch (err) {
          console.error('加载仪式数据失败:', err);
          this.error = `加载仪式数据失败: ${err.message}`;
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
      eventBus.on('show-rite-details', this.showModal);
    },
    beforeUnmount() {  // Vue 3 中使用 beforeUnmount 替代 beforeDestroy
      // 移除事件监听
      eventBus.off('show-rite-details', this.showModal);
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
    width: 90%;
    max-width: 1000px;
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
  
  .loading, .error {
    text-align: center;
    padding: 20px;
  }
  </style>