<template>
  <div class="container">
    <div class="header-container">
      <h1 class="app-title">苏丹的游戏剧情阅读器</h1>
      <a href="https://liwenhao0427.github.io/sultans-game-mod-manager/" target="_blank" class="mod-manager-link">
        <i class="fas fa-tools"></i> Mod管理
      </a>
    </div>

    <!-- 事件列表和分页 -->
    <div class="event-list-container" v-if="!rootEvent">
      <div class="list-header">
        <div class="list-stats">共 {{ filteredEvents.length }} 条记录</div>
        <div class="list-filter">
          <input 
            type="text" 
            v-model="listFilter" 
            placeholder="在结果中筛选..." 
            class="filter-input"
          />
          <!-- 添加类型筛选按钮 -->
          <div class="type-filter-buttons">
            <button 
              @click="filterByType('event')" 
              class="type-filter-button" 
              :class="{'active': activeTypeFilter === 'event'}"
            >
              事件
            </button>
            <button 
              @click="filterByType('rite')" 
              class="type-filter-button" 
              :class="{'active': activeTypeFilter === 'rite'}"
            >
              仪式
            </button>
            <button 
              @click="filterByType('loot')" 
              class="type-filter-button" 
              :class="{'active': activeTypeFilter === 'loot'}"
            >
              战利品
            </button>
            <button 
              @click="filterByType('all')" 
              class="type-filter-button" 
              :class="{'active': activeTypeFilter === 'all'}"
            >
              全部
            </button>
          </div>
        </div>
      </div>
      
      <div class="event-list">
        <div 
          v-for="event in currentPageEvents" 
          :key="event.id" 
          class="event-list-item"
          @click="loadEventAsRoot(event.id, event.type)"
        >
          <div class="event-list-id">{{ event.id }}</div>
          <div class="event-list-type" :class="'type-' + event.type">{{ getTypeLabel(event.type) }}</div>
          <div class="event-list-name">{{ event.name || event.text || '未命名事件' }}</div>
        </div>
        <div v-if="currentPageEvents.length === 0" class="no-events">
          <i class="fas fa-info-circle"></i> 没有找到事件，请尝试其他筛选条件
        </div>
      </div>
      
      
      <div class="pagination">
        <button 
          @click="goToFirstPage" 
          :disabled="currentPage <= 1"
          class="page-button"
          title="第一页"
        >
          <i class="fas fa-angle-double-left"></i>
        </button>
        <button 
          @click="prevPage" 
          :disabled="currentPage <= 1"
          class="page-button"
          title="上一页"
        >
          <i class="fas fa-angle-left"></i>
        </button>
        
        <div class="page-jump">
          <input 
            type="number" 
            v-model.number="jumpToPage" 
            min="1" 
            :max="totalPages"
            class="page-input"
            @keyup.enter="goToPage"
          />
          <span class="page-total">/ {{ totalPages }}</span>
        </div>
        
        <button 
          @click="nextPage" 
          :disabled="currentPage >= totalPages"
          class="page-button"
          title="下一页"
        >
          <i class="fas fa-angle-right"></i>
        </button>
        <button 
          @click="goToLastPage" 
          :disabled="currentPage >= totalPages"
          class="page-button"
          title="最后一页"
        >
          <i class="fas fa-angle-double-right"></i>
        </button>
      </div>
    </div>
    
    <!-- 返回按钮 -->
    <div class="back-button-container" v-if="rootEvent">
      <button @click="backToList" class="back-button">
        <i class="fas fa-arrow-left"></i> 返回列表
      </button>
    </div>
    
    <!-- 事件树和详情 -->
    <div class="event-tree-container" v-if="rootEvent">
      <div class="tree-view">
        <event-tree-node 
          v-if="rootEvent" 
          :event="rootEvent" 
          :selected="selectedEventId === rootEvent.id"
          :auto-expand="true"
          @select="selectEvent"
        />
        <div v-else class="loading">
          <i class="fas fa-spinner fa-spin"></i> 加载中...
        </div>
      </div>
      <div class="event-details">
        <event-details v-if="selectedEvent" :event="selectedEvent" />
        <div v-else class="no-selection">
          <i class="fas fa-info-circle"></i> 请选择一个事件节点查看详情
        </div>
      </div>
    </div>

    <card-details-modal />
    <div class="footer">
      <p>苏丹的游戏剧情阅读器 &copy; 2025 by <a href="https://github.com/liwenhao0427/sudans-game-reader" target="_blank">liwenhao0427</a></p>
    </div>

    <!-- 添加事件和仪式详情弹窗 -->
    <event-details-modal />
    <rite-details-modal />
    <loot-details-modal />

  </div>
</template>

<script>
import EventTreeNode from './components/EventTreeNode.vue';
import EventDetails from './components/EventDetails.vue';
// 导入卡片详情模态框组件
import CardDetailsModal from '@/components/CardDetailsModal.vue';
import { ref, onMounted, reactive, computed, watch } from 'vue';
// 导入现有组件
import EventDetailsModal from '@/components/EventDetailsModal.vue';
import RiteDetailsModal from '@/components/RiteDetailsModal.vue';
import LootDetailsModal from '@/components/LootDetailsModal.vue';


import { 
  handleDuplicateKeys, 
  loadEventData, 
  loadGameDataIndex,
  getEventsByType
} from './services/eventService';

export default {
  name: 'App',
  components: {
    // 现有组件
    EventDetailsModal,
    RiteDetailsModal,
    CardDetailsModal,
    EventTreeNode,
    LootDetailsModal,
    EventDetails
  },
  setup() {
    const getTypeLabel = (type) => {
      const typeMap = {
        'event': '事件',
        'rite': '仪式',
        'loot': '战利品'
      };
      return typeMap[type] || type;
    };

    const rootEvent = ref(null);
    const selectedEventId = ref(null);
    const selectedEvent = ref(null);
    const loadedEvents = reactive(new Map());
    
    // 搜索和分页相关
    const allEvents = ref([]);
    const allEventsCache = ref({}); // 缓存所有类型的数据
    const currentPage = ref(1);
    const jumpToPage = ref(1);
    const pageSize = 20;
    const isLoading = ref(false);
    const listFilter = ref(''); // 列表内筛选
    const activeTypeFilter = ref('all'); // 当前激活的类型筛选
    
    // 根据筛选条件过滤事件
    const filteredEvents = computed(() => {
      let events = allEvents.value;
      
      // 应用类型筛选
      if (activeTypeFilter.value !== 'all') {
        events = events.filter(event => event.type === activeTypeFilter.value);
      }
      
      // 应用文本筛选
      if (listFilter.value.trim()) {
        const filter = listFilter.value.toLowerCase();
        events = events.filter(event => {
          const name = (event.name || '').toLowerCase();
          const text = (event.text || '').toLowerCase();
          const id = String(event.id);
          return name.includes(filter) || text.includes(filter) || id.includes(filter);
        });
      }
      
      return events;
    });
    
    // 计算当前页的事件
    const currentPageEvents = computed(() => {
      const start = (currentPage.value - 1) * pageSize;
      const end = start + pageSize;
      return filteredEvents.value.slice(start, end);
    });
    
    // 计算总页数
    const totalPages = computed(() => {
      return Math.ceil(filteredEvents.value.length / pageSize) || 1;
    });
    
    // 监听当前页变化，更新跳转页码
    watch(currentPage, (newPage) => {
      jumpToPage.value = newPage;
    });
    
    // 监听总页数变化，确保当前页在有效范围内
    watch(totalPages, (newTotalPages) => {
      if (currentPage.value > newTotalPages) {
        currentPage.value = newTotalPages;
      }
    });
    
    // 按类型筛选
    const filterByType = (type) => {
      activeTypeFilter.value = type;
      currentPage.value = 1;
      jumpToPage.value = 1;
    };
    
    // 跳转到指定页
    const goToPage = () => {
      const page = parseInt(jumpToPage.value);
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
      } else {
        // 如果输入的页码无效，重置为当前页
        jumpToPage.value = currentPage.value;
      }
    };
    
    // 跳转到第一页
    const goToFirstPage = () => {
      currentPage.value = 1;
    };
    
    // 跳转到最后一页
    const goToLastPage = () => {
      currentPage.value = totalPages.value;
    };
    
    // 下一页
    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    };
    
    // 上一页
    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };
    
    // 一次性加载所有事件数据
    const loadAllEvents = async () => {
      if (isLoading.value) return;
      
      isLoading.value = true;
      try {
        // 加载所有类型的数据
        const types = ['event', 'rite', 'loot'];
        let combinedEvents = [];
        
        // 对每种类型加载数据（使用缓存）
        for (const type of types) {
          if (!allEventsCache.value[type]) {
            // 如果缓存中没有该类型的数据，则加载
            const countResult = await getEventsByType(type, 1, 1);
            const allResult = await getEventsByType(type, 1, countResult.total);
            allEventsCache.value[type] = allResult.items;
          }
          
          // 从缓存中获取数据
          combinedEvents = [...combinedEvents, ...allEventsCache.value[type]];
        }
        
        // 更新事件列表
        allEvents.value = combinedEvents;
        
        // 重置到第一页
        currentPage.value = 1;
        jumpToPage.value = 1;
      } catch (e) {
        console.error('加载事件数据失败:', e);
      } finally {
        isLoading.value = false;
      }
    };
    
    // 加载事件作为根节点
    const loadEventAsRoot = async (eventId, type) => {
      try {
        const eventData = await loadEventData(eventId, type);
        if (eventData) {
          const processedData = handleDuplicateKeys(eventData);
          rootEvent.value = processedData;
          
          // 检查是否所有 settlement 都没有文本
          const hasSettlementText = processedData.settlement && 
            Object.values(processedData.settlement).some(s => s.text && s.text.trim() !== '');
          
          // 如果没有文本，尝试选择第一个仪式
          if (!hasSettlementText && processedData.rite && processedData.rite.length > 0) {
            const firstRite = processedData.rite[0];
            selectedEventId.value = firstRite.id;
            selectedEvent.value = firstRite;
            loadedEvents.set(firstRite.id, firstRite);
          } else {
            // 否则选择当前事件
            selectedEventId.value = processedData.id;
            selectedEvent.value = processedData;
          }
          
          loadedEvents.set(processedData.id, processedData);
        }
      } catch (e) {
        console.error(`加载事件 ${eventId} 失败:`, e);
        alert(`加载事件 ${eventId} 失败，请查看控制台获取详细信息`);
      }
    };
    
    // 返回列表
    const backToList = () => {
      rootEvent.value = null;
      selectedEventId.value = null;
      selectedEvent.value = null;
    };

    // 选择事件节点
    const selectEvent = async (eventId) => {
      selectedEventId.value = eventId;
      
      // 如果已经加载过该事件，直接使用缓存
      if (loadedEvents.has(eventId)) {
        selectedEvent.value = loadedEvents.get(eventId);
        return;
      }
      
      // 否则加载事件详情
      try {
        const eventData = await loadEventData(eventId);
        if (eventData) {
          loadedEvents.set(eventId, eventData);
          selectedEvent.value = eventData;
        }
      } catch (e) {
        console.error(`加载事件 ${eventId} 详情失败:`, e);
      }
    };
    
    // 查找并选择第一个仪式节点
    const selectFirstRiteNode = () => {
      if (!rootEvent.value || !rootEvent.value.rite || !rootEvent.value.rite.length) {
        return;
      }
      
      // 获取第一个仪式节点
      const firstRite = rootEvent.value.rite[0];
      if (firstRite && firstRite.id) {
        // 选择该节点
        selectEvent(firstRite.id);
      }
    };

    onMounted(async () => {
      try {
        // 预加载索引文件
        await loadGameDataIndex();
        
        // 加载所有数据
        await loadAllEvents();
      } catch (e) {
        console.error('初始化数据失败:', e);
      }
    });

    return {
      getTypeLabel,
      rootEvent,
      selectedEventId,
      selectedEvent,
      selectEvent,
      allEvents,
      currentPage,
      jumpToPage,
      totalPages,
      nextPage,
      prevPage,
      goToPage,
      goToFirstPage,
      goToLastPage,
      currentPageEvents,
      loadEventAsRoot,
      backToList,
      listFilter,
      filteredEvents,
      activeTypeFilter,
      filterByType,
      selectFirstRiteNode, // 添加新方法到返回值中
    };
  }
}
</script>

<style>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

/* 添加类型筛选按钮样式 */
.type-filter-buttons {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.type-filter-button {
  padding: 5px 10px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.type-filter-button:hover {
  background-color: #e9ecef;
}

.type-filter-button.active {
  background-color: #42b983;
  color: white;
  border-color: #42b983;
}

.list-filter {
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1500px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
  background-color: #fafafa;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

/* 优化标题样式 */
.app-title {
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
  font-size: 1.5rem;
}

.search-container {
  margin-bottom: 25px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.search-box {
  display: flex;
  flex: 1;
  min-width: 300px;
}

.search-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #42b983;
}

.search-button {
  padding: 10px 20px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-button:hover {
  background-color: #3aa876;
}

.type-selector, .content-type-selector {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.radio-label, .checkbox-label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.radio-label:hover, .checkbox-label:hover {
  background-color: #f0f0f0;
}

.clear-button {
  padding: 5px 10px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-button:hover {
  background-color: #e9ecef;
  border-color: #ced4da;
}

.event-list-container {
  margin-top: 25px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.list-stats {
  font-size: 14px;
  color: #666;
}

.filter-input {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 200px;
  transition: border-color 0.3s;
}

.filter-input:focus {
  outline: none;
  border-color: #42b983;
}

.event-list {
  max-height: 600px;
  overflow-y: auto;
}

.event-list-item {
  display: flex;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: all 0.2s;
}

.event-list-item:last-child {
  border-bottom: none;
}

.event-list-item:hover {
  background-color: #f5f5f5;
  transform: translateX(5px);
}

.event-list-id {
  width: 80px;
  font-weight: bold;
  color: #555;
}

.event-list-type {
  width: 70px;
  color: white;
  font-size: 0.85em;
  padding: 3px 8px;
  border-radius: 4px;
  text-align: center;
  margin-right: 15px;
  font-weight: 500;
}

.type-event {
  background-color: #42b983;
}

.type-rite {
  background-color: #e67e22;
}

.type-loot {
  background-color: #3498db;
}

.event-list-name {
  flex: 1;
  font-size: 15px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px;
  gap: 10px;
  border-top: 1px solid #eee;
}

.page-button {
  padding: 8px 12px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-button:hover:not(:disabled) {
  background-color: #e9ecef;
  border-color: #ced4da;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-input {
  width: 50px;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}

.page-total {
  color: #666;
}

.back-button-container {
  margin-bottom: 20px;
}

.back-button {
  padding: 10px 15px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.back-button:hover {
  background-color: #e9ecef;
  border-color: #ced4da;
}

.event-tree-container {
  display: flex;
  margin-top: 20px;
  gap: 25px;
}

.tree-view {
  flex: 1;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  max-width: 40%;
  overflow: auto;
  max-height: 80vh;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.event-details {
  flex: 2;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  max-height: 80vh;
  overflow: auto;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.loading, .no-selection, .no-events {
  text-align: center;
  padding: 30px;
  color: #666;
  font-style: italic;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .event-tree-container {
    flex-direction: column;
  }
  
  .tree-view {
    max-width: 100%;
  }
}


.footer {
  margin-top: 30px;
  text-align: center;
  color: #606266;
  padding: 20px 0;
  border-top: 1px solid #eaeaea;
}

.footer a {
  color: #409EFF;
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}

/* 添加头部容器样式 */
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
  border-bottom: 2px solid #42b983;
  padding-bottom: 10px;
}

/* 优化标题样式 */
.app-title {
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
  font-size: 1.5rem;
}

/* 优化Mod管理链接样式 */
.mod-manager-link {
  font-size: 0.85rem;
  color: #606266;
  text-decoration: none;
  border: 1px solid #eaeaea;
  border-radius: 4px;
  padding: 4px 8px;
  background-color: #f8f9fa;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mod-manager-link:hover {
  background-color: #f0f0f0;
  color: #409EFF;
  border-color: #d0d0d0;
}

/* 其他现有样式保持不变 */

</style>
