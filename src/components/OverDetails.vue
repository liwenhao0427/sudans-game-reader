<template>
    <div class="over-details">
      <div class="over-header">
        <h2 class="over-name">{{ over.name }}</h2>
        <div class="over-sub-name">{{ over.sub_name }}</div>
        <div class="over-success" :class="successClass">
          {{ successText }}
        </div>
        <!-- 添加JSON显示切换按钮 -->
        <button class="json-toggle-btn" @click="toggleJsonView">
          {{ showJson ? '显示详情' : '显示JSON' }}
        </button>
      </div>
      
      <!-- 根据状态显示不同内容 -->
      <div v-if="!showJson" class="over-content">
        <div class="over-text" v-html="formattedText"></div>
        
        <!-- 添加额外文本显示 -->
        <div v-if="hasTextExtra" class="over-text-extra">
          <div class="text-extra-header">额外文本:</div>
          <div v-for="(extra, index) in over.text_extra" :key="index" class="text-extra-item">
            <div v-if="Object.keys(extra.condition).length > 0" class="text-extra-condition">
              条件: {{ JSON.stringify(extra.condition) }}
            </div>
            <div class="text-extra-text" v-html="formatExtraText(extra.result_text)"></div>
          </div>
        </div>
      </div>
      
      <!-- JSON显示区域 -->
      <div v-else class="json-content">
        <pre>{{ prettyJson }}</pre>
      </div>
      
      <div class="over-meta" v-if="!showJson">
        <!-- 基本元数据 -->
        <div class="meta-item" v-if="over.bg">
          <span class="meta-label">背景:</span> {{ over.bg }}
        </div>
        <div class="meta-item" v-if="over.icon">
          <span class="meta-label">图标:</span> {{ over.icon }}
        </div>
        
        <!-- 添加额外元数据 -->
        <div class="meta-item" v-if="over.title">
          <span class="meta-label">标题图标:</span> {{ over.title }}
        </div>
        <div class="meta-item" v-if="over.open_after_story !== undefined">
          <span class="meta-label">故事后开启:</span> {{ over.open_after_story ? '是' : '否' }}
        </div>
        <div class="meta-item" v-if="over.manual_prompt !== undefined">
          <span class="meta-label">手动提示:</span> {{ over.manual_prompt ? '是' : '否' }}
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'OverDetails',
    props: {
      over: {
        type: Object,
        required: true
      }
    },
    data() {
      return {
        showJson: false
      };
    },
    computed: {
      formattedText() {
        if (!this.over.text) return '';
        return this.over.text.replace(/\n/g, '<br>');
      },
      successClass() {
        const success = this.over.success;
        if (success === 2) return 'success-good';
        if (success === 1) return 'success-neutral';
        return 'success-bad';
      },
      successText() {
        const success = this.over.success;
        if (success === 2) return '好结局';
        if (success === 1) return '中性结局';
        return '坏结局';
      },
      // 添加格式化JSON的计算属性
      prettyJson() {
        return JSON.stringify(this.over, null, 2);
      },
      // 检查是否有额外文本
      hasTextExtra() {
        return this.over.text_extra && this.over.text_extra.length > 0;
      }
    },
    methods: {
      // 切换JSON显示状态
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
  .over-details {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .over-header {
    margin-bottom: 20px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 15px;
    position: relative;
  }
  
  .over-name {
    margin: 0 0 10px 0;
    font-size: 24px;
    color: #333;
  }
  
  /* 添加JSON切换按钮样式 */
  .json-toggle-btn {
    position: absolute;
    right: 0;
    top: 0;
    padding: 5px 10px;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }
  
  .json-toggle-btn:hover {
    background-color: #e0e0e0;
  }
  
  /* JSON内容区域样式 */
  .json-content {
    background-color: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 20px;
    overflow: auto;
    max-height: 500px;
  }
  
  .json-content pre {
    margin: 0;
    white-space: pre-wrap;
    font-family: monospace;
    font-size: 14px;
    color: #333;
  }
  
  .over-sub-name {
    font-style: italic;
    color: #666;
    margin-bottom: 10px;
  }
  
  .over-success {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
  }
  
  .success-good {
    background-color: #d4edda;
    color: #155724;
  }
  
  .success-neutral {
    background-color: #fff3cd;
    color: #856404;
  }
  
  .success-bad {
    background-color: #f8d7da;
    color: #721c24;
  }
  
  .over-content {
    margin-bottom: 20px;
    line-height: 1.6;
  }
  
  .over-text {
    white-space: pre-line;
    margin-bottom: 20px;
  }
  
  /* 添加额外文本样式 */
  .over-text-extra {
    margin-top: 20px;
    border-top: 1px dashed #ddd;
    padding-top: 15px;
  }
  
  .text-extra-header {
    font-weight: bold;
    margin-bottom: 10px;
    color: #555;
  }
  
  .text-extra-item {
    margin-bottom: 15px;
    padding: 10px;
    background-color: #f9f9f9;
    border-radius: 4px;
    border-left: 3px solid #9b59b6;
  }
  
  .text-extra-condition {
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
    padding: 3px 6px;
    background-color: #eee;
    border-radius: 3px;
    display: inline-block;
  }
  
  .text-extra-text {
    white-space: pre-line;
  }
  
  .over-meta {
    font-size: 14px;
    color: #666;
    border-top: 1px solid #eee;
    padding-top: 15px;
  }
  
  .meta-item {
    margin-bottom: 5px;
  }
  
  .meta-label {
    font-weight: bold;
  }
  </style>