<template>
  <div class="event-node">
    <div class="event-card">
      <h3>{{ event.text || '未命名事件' }} (ID: {{ event.id }})</h3>
      
      <div class="event-details">
        <div v-if="event.on" class="event-section">
          <h4>触发条件:</h4>
          <pre>{{ JSON.stringify(event.on, null, 2) }}</pre>
        </div>
        
        <div v-if="event.condition && Object.keys(event.condition).length > 0" class="event-section">
          <h4>条件:</h4>
          <pre>{{ JSON.stringify(event.condition, null, 2) }}</pre>
        </div>
        
        <div v-if="event.settlement && event.settlement.length > 0" class="event-section">
          <h4>效果:</h4>
          <div v-for="(item, index) in event.settlement" :key="index" class="settlement-item">
            <div v-if="item.tips_text" class="tips">
              <strong>提示:</strong> {{ item.tips_text }}
            </div>
            
            <div v-if="item.action" class="action">
              <div v-if="item.action.confirm" class="confirm-action">
                <strong>确认对话框:</strong>
                <div v-if="typeof item.action.confirm === 'string'">
                  {{ item.action.confirm }}
                </div>
                <div v-else>
                  <div>文本: {{ item.action.confirm.text }}</div>
                  <div v-if="item.action.confirm.confirm_text">确认按钮: {{ item.action.confirm.confirm_text }}</div>
                  <div v-if="item.action.confirm.cancel_text">取消按钮: {{ item.action.confirm.cancel_text }}</div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 这里可以添加子节点的展示 -->
  </div>
</template>

<script>
export default {
  name: 'EventNode',
  props: {
    event: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.event-node {
  margin-bottom: 20px;
}

.event-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.event-card h3 {
  margin-top: 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  color: #333;
}

.event-details {
  font-size: 14px;
}

.event-section {
  margin-bottom: 15px;
}

.event-section h4 {
  margin-bottom: 5px;
  color: #555;
}

pre {
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}

.settlement-item {
  margin-bottom: 10px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #eee;
}

.tips, .action, .confirm-action, .success-action, .failed-action {
  margin-bottom: 8px;
}
</style>