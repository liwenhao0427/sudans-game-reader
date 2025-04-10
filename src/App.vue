<template>
  <div class="container">
    <h1>游戏分支树展示</h1>
    <div class="event-tree">
      <event-node v-if="rootEvent" :event="rootEvent" />
      <div v-else class="loading">加载中...</div>
    </div>
  </div>
</template>

<script>
import EventNode from './components/EventNode.vue';
import { ref, onMounted } from 'vue';
import { parseJsonWithComments, handleDuplicateKeys } from './services/eventService';

export default {
  name: 'App',
  components: {
    EventNode
  },
  setup() {
    const rootEvent = ref(null);

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
        
        console.log("处理后的JSON内容:", jsonContent);
        const eventData = parseJsonWithComments(jsonContent);
        
        if (eventData) {
          rootEvent.value = handleDuplicateKeys(eventData);
        }
      } catch (e) {
        console.error('加载事件数据失败:', e);
      }
    });

    return {
      rootEvent
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

.event-tree {
  margin-top: 20px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}
</style>