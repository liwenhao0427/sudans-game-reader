<template>
  <div class="container">
    <h1>游戏分支树展示</h1>
    <div class="event-tree-container">
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
import { ref, onMounted, reactive } from 'vue';
import { parseJsonWithComments, handleDuplicateKeys, loadEventData } from './services/eventService';

export default {
  name: 'App',
  components: {
    EventTreeNode,
    EventDetails
  },
  setup() {
    const rootEvent = ref(null);
    const selectedEventId = ref(null);
    const selectedEvent = ref(null);
    const loadedEvents = reactive(new Map());

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
        // 使用require加载JSON文件
        const eventJsonText = require('raw-loader!@/assets/config/event/5300000.json').default;
        
        // 提取JSON内容 - 处理module.exports包装
        let jsonContent = eventJsonText;
        if (jsonContent.startsWith('module.exports = ')) {
          // 移除 module.exports = 和首尾的引号
          jsonContent = jsonContent.substring(16);
        }
        
        // 移除字符串首尾的引号和分号
        jsonContent = jsonContent.trim();
        if (jsonContent.startsWith('"') && jsonContent.endsWith('";')) {
          jsonContent = jsonContent.substring(1, jsonContent.length - 2);
        } else if (jsonContent.startsWith('"') && jsonContent.endsWith('"')) {
          jsonContent = jsonContent.substring(1, jsonContent.length - 1);
        }
        
        // 处理转义的引号和换行符
        jsonContent = jsonContent.replace(/\\"/g, '"').replace(/\\r\\n/g, '\n');
        const eventData = parseJsonWithComments(jsonContent);
        
        if (eventData) {
          const processedData = handleDuplicateKeys(eventData);
          rootEvent.value = processedData;
          loadedEvents.set(processedData.id, processedData);
        }
      } catch (e) {
        console.error('加载事件数据失败:', e);
      }
    });

    return {
      rootEvent,
      selectedEventId,
      selectedEvent,
      selectEvent
    };
  }
}
</script>

<style>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
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

.loading, .no-selection {
  text-align: center;
  padding: 20px;
  color: #666;
}
</style>