<template>
    <div class="after-story-details">
      <div class="after-story-header">
        <h2 class="after-story-name">{{ afterStory.name }}</h2>
        <div class="after-story-sub-name" v-if="afterStory.sub_name">{{ afterStory.sub_name }}</div>
        
        <!-- 添加JSON显示切换按钮 -->
        <button class="json-toggle-btn" @click="toggleJsonView">
          {{ showJson ? '显示详情' : '显示JSON' }}
        </button>
      </div>
      
      <!-- JSON视图 -->
      <div v-if="showJson" class="json-view">
        <pre>{{ JSON.stringify(afterStory, null, 2) }}</pre>
      </div>
      
      <!-- 详情视图 -->
      <div v-else class="after-story-content">
        <!-- 主要内容 -->
        <div class="after-story-main">
          <div class="after-story-text" v-if="afterStory.text" v-html="formatExtraText(afterStory.text)"></div>
          
          <!-- 额外内容列表 -->
          <div class="extra-items" v-if="afterStory.extra && afterStory.extra.length > 0">
            <h3 class="extra-title">后日谈内容</h3>
            <div v-for="(item, index) in afterStory.extra" :key="item.key || index" class="extra-item">
              <div class="extra-header" v-if="item.result_title">{{ item.result_title }}</div>
              <div class="extra-text" v-if="item.result_text" v-html="formatExtraText(item.result_text)"></div>
              
              <!-- 使用 ConditionDisplay 组件显示条件 -->
              <condition-display 
                v-if="item.condition" 
                :condition="item.condition" 
                :riteId="afterStoryRiteId"
              />
            </div>
          </div>
        </div>
        
        <!-- 元数据 -->
        <div class="after-story-meta">
          <div class="meta-item" v-if="afterStory.id">
            <span class="meta-label">ID:</span> {{ afterStory.id }}
          </div>
          <div class="meta-item" v-if="afterStory.prior && afterStory.prior.length > 0">
            <span class="meta-label">优先级:</span> {{ afterStory.prior.join(', ') }}
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import ConditionDisplay from '@/components/displays/ConditionDisplay.vue';
  
  export default {
    name: 'AfterStoryDetails',
    components: {
      ConditionDisplay
    },
    props: {
      afterStory: {
        type: Object,
        required: true
      }
    },
    data() {
      return {
        showJson: false,
        afterStoryRiteId: 0 // 默认值，因为后日谈不一定关联仪式
      };
    },
    created() {
      // 尝试从后日谈数据中提取关联的仪式ID
      if (this.afterStory && this.afterStory.id) {
        this.afterStoryRiteId = parseInt(this.afterStory.id);
      }
    },
    methods: {
      toggleJsonView() {
        this.showJson = !this.showJson;
      },
      // 格式化额外文本
      formatExtraText(text) {
        if (!text) return '';
        return text.replace(/\n/g, '<br>');
      }
    }
  }
  </script>
  
  <style scoped>
  .after-story-details {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .after-story-header {
    margin-bottom: 20px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 15px;
    position: relative;
  }
  
  .after-story-name {
    margin-top: 0;
    margin-bottom: 10px;
    color: #2c3e50;
    font-size: 1.8em;
  }
  
  .after-story-sub-name {
    color: #666;
    font-size: 1.2em;
    margin-bottom: 10px;
  }
  
  .json-toggle-btn {
    position: absolute;
    top: 0;
    right: 0;
    padding: 5px 10px;
    background-color: #f8f9fa;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
  }
  
  .json-toggle-btn:hover {
    background-color: #e9ecef;
  }
  
  .json-view {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 5px;
    overflow-x: auto;
    font-family: monospace;
    white-space: pre-wrap;
  }
  
  .after-story-text {
    margin-bottom: 20px;
    line-height: 1.6;
    font-size: 1.1em;
  }
  
  .extra-title {
    margin-top: 30px;
    margin-bottom: 15px;
    color: #2c3e50;
    font-size: 1.5em;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  }
  
  .extra-item {
    margin-bottom: 25px;
    padding: 15px;
    background-color: #f9f9f9;
    border-radius: 5px;
    border-left: 4px solid #42b983;
  }
  
  .extra-header {
    font-weight: bold;
    font-size: 1.2em;
    margin-bottom: 10px;
    color: #2c3e50;
  }
  
  .extra-text {
    line-height: 1.6;
    margin-bottom: 15px;
  }
  
  .after-story-meta {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .meta-item {
    background-color: #f8f9fa;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 0.9em;
  }
  
  .meta-label {
    font-weight: bold;
    color: #666;
  }
  </style>