<template>
  <div class="container">
    <h1>游戏分支树展示</h1>
    
    <!-- 搜索和类型选择区域 -->
    <div class="search-container">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="输入ID或事件名称搜索" 
          @keyup.enter="handleSearch"
        />
        <button @click="handleSearch" class="search-button">搜索</button>
      </div>
      
      <div class="type-selector">
        <label>
          <input type="radio" v-model="searchType" value="id" /> 按ID
        </label>
        <label>
          <input type="radio" v-model="searchType" value="name" /> 按名称
        </label>
      </div>
      
      <div class="content-type-selector">
        <label>
          <input type="checkbox" v-model="contentTypes.event" /> 事件(event)
        </label>
        <label>
          <input type="checkbox" v-model="contentTypes.rite" /> 仪式(rite)
        </label>
        <label>
          <input type="checkbox" v-model="contentTypes.loot" /> 战利品(loot)
        </label>
      </div>
    </div>
    
    <!-- 事件列表和分页 -->
    <div class="event-list-container" v-if="!rootEvent">
      <div class="event-list">
        <div 
          v-for="event in currentPageEvents" 
          :key="event.id" 
          class="event-list-item"
          @click="loadEventAsRoot(event.id, event.type)"
        >
          <div class="event-list-id">{{ event.id }}</div>
          <div class="event-list-type">{{ getTypeLabel(event.type) }}</div>
          <div class="event-list-name">{{ event.name || event.text || '未命名事件' }}</div>
        </div>
        <div v-if="currentPageEvents.length === 0" class="no-events">
          没有找到事件，请尝试其他搜索条件
        </div>
      </div>
      
      <div class="pagination">
        <button 
          @click="prevPage" 
          :disabled="currentPage <= 1"
          class="page-button"
        >
          上一页
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          @click="nextPage" 
          :disabled="currentPage >= totalPages"
          class="page-button"
        >
          下一页
        </button>
      </div>
    </div>
    
    <!-- 返回按钮 -->
    <div class="back-button-container" v-if="rootEvent">
      <button @click="backToList" class="back-button">返回列表</button>
    </div>
    
    <!-- 事件树和详情 -->
    <div class="event-tree-container" v-if="rootEvent">
      <div class="tree-view">
        <event-tree-node 
          v-if="rootEvent" 
          :event="rootEvent" 
          :selected="selectedEventId === rootEvent.id"
          @select="selectEvent"
        />
        <div v-else class="loading">加载中...</div>
      </div>
      <div class="event-details">
        <event-details v-if="selectedEvent" :event="selectedEvent" />
        <div v-else class="no-selection">请选择一个事件节点查看详情</div>
      </div>
    </div>
  </div>
</template>

<script>
import EventTreeNode from './components/EventTreeNode.vue';
import EventDetails from './components/EventDetails.vue';
import { ref, onMounted, reactive, computed } from 'vue';
import { 
  handleDuplicateKeys, 
  loadEventData, 
  searchEventsByName, 
  loadGameDataIndex,
  getEventsByType
} from './services/eventService';

export default {
  name: 'App',
  components: {
    EventTreeNode,
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
    const currentPage = ref(1);
    const pageSize = 10;
    const searchQuery = ref('');
    const searchType = ref('id');
    const contentTypes = reactive({
      event: true,
      rite: false,
      loot: false
    });
    const isLoading = ref(false);
    const searchResults = ref([]);
    const totalEventsCount = ref(0);
    
    // 计算当前页的事件
    const currentPageEvents = computed(() => {
      const list = searchQuery.value ? searchResults.value : allEvents.value;
      const start = (currentPage.value - 1) * pageSize;
      const end = start + pageSize;
      return list.slice(start, end);
    });
    
    // 计算总页数
    const totalPages = computed(() => {
      const count = searchQuery.value ? searchResults.value.length : totalEventsCount.value;
      return Math.ceil(count / pageSize) || 1;
    });
    
    // 下一页
    const nextPage = async () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
        if (!searchQuery.value) {
          await loadEventsForCurrentPage();
        }
      }
    };
    
    // 上一页
    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };
    
    // 加载当前页的事件
    const loadEventsForCurrentPage = async () => {
      if (isLoading.value) return;
      
      isLoading.value = true;
      try {
        // 获取选中的内容类型
        const types = [];
        if (contentTypes.event) types.push('event');
        if (contentTypes.rite) types.push('rite');
        if (contentTypes.loot) types.push('loot');
        
        // 如果没有选择任何类型，默认使用event
        if (types.length === 0) {
          types.push('event');
        }
        
        // 对每种类型加载数据
        allEvents.value = [];
        let totalCount = 0;
        
        for (const type of types) {
          const result = await getEventsByType(type, currentPage.value, pageSize);
          allEvents.value = [...allEvents.value, ...result.items];
          totalCount += result.total;
        }
        
        totalEventsCount.value = totalCount;
      } catch (e) {
        console.error('加载事件数据失败:', e);
      } finally {
        isLoading.value = false;
      }
    };
    
    
    // 处理搜索
    const handleSearch = async () => {
      if (!searchQuery.value.trim()) {
        searchResults.value = [];
        return;
      }
      
      isLoading.value = true;
      currentPage.value = 1;
      searchResults.value = [];
      
      try {
        if (searchType.value === 'id') {
          // 按ID搜索
          const id = parseInt(searchQuery.value);
          if (isNaN(id)) {
            alert('请输入有效的数字ID');
            return;
          }
          
          // 获取选中的内容类型
          const types = [];
          if (contentTypes.event) types.push('');
          if (contentTypes.rite) types.push('rite_');
          if (contentTypes.loot) types.push('loot_');
          
          // 如果没有选择任何类型，默认尝试所有类型
          if (types.length === 0) {
            types.push('', 'rite_', 'loot_');
          }
          
          let found = false;
          for (const type of types) {
            try {
              const eventData = await loadEventData(type + id);
              if (eventData) {
                searchResults.value.push(eventData);
                found = true;
                break;
              }
            } catch (e) {
              console.warn(`在 ${type} 类型中未找到ID为 ${id} 的内容`);
            }
          }
          
          if (!found) {
            alert(`未找到ID为 ${id} 的内容`);
          }
        } else {
          // 按名称搜索
          const name = searchQuery.value.trim();
          
          // 获取选中的内容类型
          const types = [];
          if (contentTypes.event) types.push('event');
          if (contentTypes.rite) types.push('rite');
          if (contentTypes.loot) types.push('loot');
          
          // 如果没有选择任何类型，默认尝试所有类型
          if (types.length === 0) {
            types.push('event', 'rite', 'loot');
          }
          
          const results = await searchEventsByName(name, types);
          searchResults.value = results;
          
          if (results.length === 0) {
            alert(`未找到名称包含 "${name}" 的内容`);
          }
        }
      } catch (e) {
        console.error('搜索失败:', e);
        alert('搜索过程中发生错误，请查看控制台获取详细信息');
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
          selectedEventId.value = processedData.id;
          selectedEvent.value = processedData;
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

    onMounted(async () => {
      try {
        // 预加载索引文件
        await loadGameDataIndex();
        
        // 加载第一页数据
        await loadEventsForCurrentPage();
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
      totalPages,
      nextPage,
      prevPage,
      searchQuery,
      searchType,
      contentTypes,
      handleSearch,
      currentPageEvents,
      loadEventAsRoot,
      backToList
    };
  }
}
</script>

<style>
.container {
  max-width: 1500px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.search-container {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.search-box {
  display: flex;
  flex: 1;
  min-width: 300px;
}

.search-box input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 14px;
}

.search-button {
  padding: 8px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.search-button:hover {
  background-color: #45a049;
}

.type-selector, .content-type-selector {
  display: flex;
  gap: 10px;
  align-items: center;
}

.event-list-container {
  margin-top: 20px;
}

.event-list {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.event-list-item {
  display: flex;
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.event-list-item:last-child {
  border-bottom: none;
}

.event-list-item:hover {
  background-color: #f5f5f5;
}

.event-list-id {
  width: 80px;
  font-weight: bold;
  color: #666;
}

.event-list-name {
  flex: 1;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 15px;
  gap: 10px;
}

.page-button {
  padding: 6px 12px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.back-button-container {
  margin-bottom: 15px;
}

.back-button {
  padding: 8px 15px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.back-button:hover {
  background-color: #e0e0e0;
}

.event-tree-container {
  display: flex;
  margin-top: 20px;
  gap: 20px;
}

.tree-view {
  flex: 1;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  max-width: 40%;
  overflow: auto;
  max-height: 80vh;
}

.event-details {
  flex: 2;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  max-height: 80vh;
  overflow: auto;
}

.loading, .no-selection, .no-events {
  text-align: center;
  padding: 20px;
  color: #666;
}

.event-list-item {
  display: flex;
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.event-list-item:last-child {
  border-bottom: none;
}

.event-list-item:hover {
  background-color: #f5f5f5;
}

.event-list-id {
  width: 80px;
  font-weight: bold;
  color: #666;
}

.event-list-type {
  width: 60px;
  color: #42b983;
  font-size: 0.9em;
  padding: 2px 6px;
  background-color: #f0faf5;
  border-radius: 4px;
  text-align: center;
  margin-right: 10px;
}

.event-list-name {
  flex: 1;
}
</style>