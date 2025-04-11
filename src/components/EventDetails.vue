<template>
  <div class="event-details-container">
    <h2>{{ event.text || '未命名事件' }} <span class="event-id">(ID: {{ event.id }})</span></h2>
    
    <div class="event-info">
      <div class="info-section" v-if="event.is_replay !== undefined">
        <h3>可重复触发:</h3>
        <div>{{ event.is_replay ? '是' : '否' }}</div>
      </div>
      
      <div class="info-section" v-if="event.auto_start !== undefined">
        <h3>自动启动:</h3>
        <div>{{ event.auto_start ? '是' : '否' }}</div>
      </div>
      
      <div class="info-section" v-if="event.on">
        <h3>触发条件:</h3>
        <pre>{{ JSON.stringify(event.on, null, 2) }}</pre>
      </div>
      
      <div class="info-section" v-if="event.condition && Object.keys(event.condition).length > 0">
        <h3>条件:</h3>
        <pre>{{ JSON.stringify(event.condition, null, 2) }}</pre>
      </div>
      
      <div class="info-section" v-if="event.settlement && event.settlement.length > 0">
        <h3>效果:</h3>
        <div v-for="(item, index) in event.settlement" :key="index" class="settlement-item">
          <div v-if="item.tips_text" class="tips">
            <strong>提示文本:</strong> {{ item.tips_text }}
          </div>
          
          <div v-if="item.tips_resource" class="tips">
            <strong>提示资源:</strong> {{ item.tips_resource }}
          </div>
          
          <div v-if="item.action" class="action">
            <div v-if="item.action.prompt" class="prompt-action">
              <strong>提示:</strong> {{ item.action.prompt }}
            </div>
            
            <div v-if="item.action.confirm" class="confirm-action">
              <strong>确认对话框:</strong>
              <div v-if="typeof item.action.confirm === 'string'">
                {{ item.action.confirm }}
              </div>
              <div v-else class="confirm-details">
                <div v-if="item.action.confirm.id"><strong>ID:</strong> {{ item.action.confirm.id }}</div>
                <div v-if="item.action.confirm.text"><strong>文本:</strong> {{ item.action.confirm.text }}</div>
                <div v-if="item.action.confirm.confirm_text"><strong>确认按钮:</strong> {{ item.action.confirm.confirm_text }}</div>
                <div v-if="item.action.confirm.cancel_text"><strong>取消按钮:</strong> {{ item.action.confirm.cancel_text }}</div>
                <div v-if="item.action.confirm.icon">
                  <strong>图标:</strong> 
                  <span v-if="Array.isArray(item.action.confirm.icon)">
                    {{ item.action.confirm.icon.join(', ') }}
                  </span>
                  <span v-else>{{ item.action.confirm.icon }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="item.action.success" class="success-action">
              <strong>成功效果:</strong>
              <pre>{{ JSON.stringify(item.action.success, null, 2) }}</pre>
            </div>
            
            <div v-if="item.action.failed" class="failed-action">
              <strong>失败效果:</strong>
              <pre>{{ JSON.stringify(item.action.failed, null, 2) }}</pre>
            </div>
            
            <div v-if="item.action.option" class="option-action">
              <strong>选项:</strong>
              <div class="option-details">
                <div><strong>文本:</strong> {{ item.action.option.text }}</div>
                <div v-if="item.action.option.icon"><strong>图标:</strong> {{ item.action.option.icon }}</div>
                <div v-if="item.action.option.items && item.action.option.items.length > 0">
                  <strong>选项列表:</strong>
                  <div v-for="(option, optIndex) in item.action.option.items" :key="optIndex" class="option-item">
                    <div><strong>{{ option.text }}</strong> ({{ option.tag }})</div>
                    <div v-if="option.icon"><strong>图标:</strong> {{ option.icon }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="item.action.slide" class="slide-action">
              <strong>幻灯片:</strong>
              <div v-if="Array.isArray(item.action.slide)">
                {{ item.action.slide.join(', ') }}
              </div>
              <div v-else>{{ item.action.slide }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="info-section" v-if="event.rite">
        <h3>仪式:</h3>
        <pre>{{ JSON.stringify(event.rite, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EventDetails',
  props: {
    event: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.event-details-container {
  padding: 10px;
}

h2 {
  margin-top: 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.event-id {
  font-size: 0.8em;
  color: #666;
}

.event-info {
  margin-top: 15px;
}

.info-section {
  margin-bottom: 20px;
}

.info-section h3 {
  margin-bottom: 8px;
  color: #333;
  font-size: 16px;
}

pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 13px;
}

.settlement-item {
  margin-bottom: 15px;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #eee;
}

.tips, .action, .prompt-action, .confirm-action, .success-action, .failed-action, .option-action, .slide-action {
  margin-bottom: 10px;
}

.confirm-details, .option-details {
  margin-left: 15px;
  margin-top: 5px;
  padding: 8px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #eee;
}

.option-item {
  margin-top: 8px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style>