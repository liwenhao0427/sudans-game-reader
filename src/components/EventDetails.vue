<template>
  <div class="event-details-container">
    <div class="event-header">
      <h2>{{ event.name || event.text || '未命名事件' }} <span class="event-id">(ID: {{ event.id }})</span></h2>
      <button class="json-button" @click="showJsonModal = true">查看JSON</button>
    </div>
    
    <div class="event-info">
      <!-- 基本信息 -->
      <div class="info-card">
        <div class="card-header" @click="toggleSection('basicInfo')">
          <h3>基本信息</h3>
          <span class="toggle-icon">{{ expandedSections.basicInfo ? '▼' : '►' }}</span>
        </div>
        <div class="card-content" v-if="expandedSections.basicInfo">
          <div class="info-grid">
            <div class="info-item" v-if="event.text">
              <div class="info-label">描述:</div>
              <div class="info-value">{{ event.text }}</div>
            </div>
            <div class="info-item" v-if="event.location">
              <div class="info-label">位置:</div>
              <div class="info-value">{{ event.location }}</div>
            </div>
            <div class="info-item" v-if="event.tag_tips">
              <div class="info-label">标签:</div>
              <div class="info-value tags-container">
                <span v-for="(tag, index) in event.tag_tips" :key="index" class="tag">{{ tag }}</span>
              </div>
            </div>
            <div class="info-item" v-if="event.icon">
              <div class="info-label">图标:</div>
              <div class="info-value">{{ event.icon }}</div>
            </div>
            <div class="info-item" v-if="event.is_replay !== undefined">
              <div class="info-label">可重复触发:</div>
              <div class="info-value">{{ event.is_replay ? '是' : '否' }}</div>
            </div>
            <div class="info-item" v-if="event.auto_start !== undefined">
              <div class="info-label">自动启动:</div>
              <div class="info-value">{{ event.auto_start ? '是' : '否' }}</div>
            </div>
            <div class="info-item" v-if="event.auto_begin !== undefined">
              <div class="info-label">自动开始:</div>
              <div class="info-value">{{ event.auto_begin ? '是' : '否' }}</div>
            </div>
            <div class="info-item" v-if="event.auto_result !== undefined">
              <div class="info-label">自动结果:</div>
              <div class="info-value">{{ event.auto_result ? '是' : '否' }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 提示信息 -->
      <div class="info-card" v-if="event.tips_text && event.tips_text.length > 0">
        <div class="card-header" @click="toggleSection('tips')">
          <h3>提示信息</h3>
          <span class="toggle-icon">{{ expandedSections.tips ? '▼' : '►' }}</span>
        </div>
        <div class="card-content" v-if="expandedSections.tips">
          <div class="tips-list">
            <div v-for="(tip, index) in event.tips_text" :key="index" class="tip-item">
              {{ tip }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 开启条件 -->
      <div class="info-card" v-if="event.open_conditions && event.open_conditions.length > 0">
        <div class="card-header" @click="toggleSection('openConditions')">
          <h3>开启条件</h3>
          <span class="toggle-icon">{{ expandedSections.openConditions ? '▼' : '►' }}</span>
        </div>
        <div class="card-content" v-if="expandedSections.openConditions">
          <div v-for="(condition, index) in event.open_conditions" :key="index" class="condition-item">
            <div class="condition-tips" v-if="condition.tips">{{ condition.tips }}</div>
            <div class="condition-code">
              <pre>{{ JSON.stringify(condition.condition, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 随机文本 -->
      <div class="info-card" v-if="event.random_text_up">
        <div class="card-header" @click="toggleSection('randomText')">
          <h3>随机文本</h3>
          <span class="toggle-icon">{{ expandedSections.randomText ? '▼' : '►' }}</span>
        </div>
        <div class="card-content" v-if="expandedSections.randomText">
          <div v-for="(text, key) in event.random_text_up" :key="key" class="random-text-item">
            <div class="random-text-key">{{ key }}:</div>
            <div class="random-text-content">
              <div>{{ text.text }}</div>
              <div class="random-text-details" v-if="text.type || text.type_tips">
                <div v-if="text.type">类型: {{ text.type }}</div>
                <div v-if="text.type_tips">提示: {{ text.type_tips }}</div>
                <div v-if="text.low_target">最低目标: {{ text.low_target }}</div>
                <div v-if="text.low_target_tips">目标提示: {{ text.low_target_tips }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 优先结算 -->
      <div class="info-card" v-if="event.settlement_prior && event.settlement_prior.length > 0">
        <div class="card-header" @click="toggleSection('settlementPrior')">
          <h3>优先结算</h3>
          <span class="toggle-icon">{{ expandedSections.settlementPrior ? '▼' : '►' }}</span>
        </div>
        <div class="card-content" v-if="expandedSections.settlementPrior">
          <div v-for="(item, index) in event.settlement_prior" :key="index" class="settlement-item">
            <div class="settlement-header">
              <div class="settlement-title" v-if="item.result_title">{{ item.result_title }}</div>
              <div class="settlement-condition" v-if="item.condition">
                <strong>条件:</strong>
                <pre>{{ JSON.stringify(item.condition, null, 2) }}</pre>
              </div>
            </div>
            
            <div class="settlement-body">
              <div class="settlement-text" v-if="item.result_text">{{ item.result_text }}</div>
              
              <div class="settlement-result" v-if="item.result && Object.keys(item.result).length > 0">
                <strong>结果:</strong>
                <div class="result-effects">
                  <div v-for="(value, key) in item.result" :key="key" class="effect-item">
                    {{ key }}: {{ value }}
                  </div>
                </div>
              </div>
              
              <div class="settlement-action" v-if="item.action && Object.keys(item.action).length > 0">
                <strong>动作:</strong>
                <div class="action-effects">
                  <div v-for="(value, key) in item.action" :key="key" class="effect-item">
                    {{ key }}: {{ Array.isArray(value) ? value.join(', ') : value }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 主要结算 -->
      <div class="info-card" v-if="event.settlement && event.settlement.length > 0">
        <div class="card-header" @click="toggleSection('settlement')">
          <h3>主要结算</h3>
          <span class="toggle-icon">{{ expandedSections.settlement ? '▼' : '►' }}</span>
        </div>
        <div class="card-content" v-if="expandedSections.settlement">
          <div v-for="(item, index) in event.settlement" :key="index" class="settlement-item">
            <div class="settlement-header">
              <div class="settlement-title" v-if="item.result_title">{{ item.result_title }}</div>
              <div class="settlement-condition" v-if="item.condition">
                <strong>条件:</strong>
                <pre>{{ JSON.stringify(item.condition, null, 2) }}</pre>
              </div>
            </div>
            
            <div class="settlement-body">
              <div class="settlement-text" v-if="item.result_text">{{ item.result_text }}</div>
              
              <div class="settlement-result" v-if="item.result && Object.keys(item.result).length > 0">
                <strong>结果:</strong>
                <div class="result-effects">
                  <div v-for="(value, key) in item.result" :key="key" class="effect-item">
                    {{ key }}: {{ value }}
                  </div>
                </div>
              </div>
              
              <div class="settlement-action" v-if="item.action && Object.keys(item.action).length > 0">
                <strong>动作:</strong>
                <div class="action-effects">
                  <div v-for="(value, key) in item.action" :key="key" class="effect-item">
                    {{ key }}: {{ Array.isArray(value) ? value.join(', ') : value }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 额外结算 -->
      <div class="info-card" v-if="event.settlement_extre && event.settlement_extre.length > 0">
        <div class="card-header" @click="toggleSection('settlementExtre')">
          <h3>额外结算</h3>
          <span class="toggle-icon">{{ expandedSections.settlementExtre ? '▼' : '►' }}</span>
        </div>
        <div class="card-content" v-if="expandedSections.settlementExtre">
          <div v-for="(item, index) in event.settlement_extre" :key="index" class="settlement-item">
            <div class="settlement-header">
              <div class="settlement-title" v-if="item.result_title">{{ item.result_title }}</div>
              <div class="settlement-condition" v-if="item.condition">
                <strong>条件:</strong>
                <pre>{{ JSON.stringify(item.condition, null, 2) }}</pre>
              </div>
            </div>
            
            <div class="settlement-body">
              <div class="settlement-text" v-if="item.result_text">{{ item.result_text }}</div>
              
              <div class="settlement-result" v-if="item.result && Object.keys(item.result).length > 0">
                <strong>结果:</strong>
                <div class="result-effects">
                  <div v-for="(value, key) in item.result" :key="key" class="effect-item">
                    {{ key }}: {{ value }}
                  </div>
                </div>
              </div>
              
              <div class="settlement-action" v-if="item.action && Object.keys(item.action).length > 0">
                <strong>动作:</strong>
                <div class="action-effects">
                  <div v-for="(value, key) in item.action" :key="key" class="effect-item">
                    {{ key }}: {{ Array.isArray(value) ? value.join(', ') : value }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 卡片槽位 -->
      <div class="info-card" v-if="event.cards_slot">
        <div class="card-header" @click="toggleSection('cardsSlot')">
          <h3>卡片槽位</h3>
          <span class="toggle-icon">{{ expandedSections.cardsSlot ? '▼' : '►' }}</span>
        </div>
        <div class="card-content" v-if="expandedSections.cardsSlot">
          <div class="cards-slot-container">
            <pre>{{ JSON.stringify(event.cards_slot, null, 2) }}</pre>
          </div>
        </div>
      </div>
      
      <!-- 触发条件 -->
      <div class="info-card" v-if="event.on">
        <div class="card-header" @click="toggleSection('on')">
          <h3>触发条件</h3>
          <span class="toggle-icon">{{ expandedSections.on ? '▼' : '►' }}</span>
        </div>
        <div class="card-content" v-if="expandedSections.on">
          <pre>{{ JSON.stringify(event.on, null, 2) }}</pre>
        </div>
      </div>
      
      <!-- 条件 -->
      <div class="info-card" v-if="event.condition && Object.keys(event.condition).length > 0">
        <div class="card-header" @click="toggleSection('condition')">
          <h3>条件</h3>
          <span class="toggle-icon">{{ expandedSections.condition ? '▼' : '►' }}</span>
        </div>
        <div class="card-content" v-if="expandedSections.condition">
          <pre>{{ JSON.stringify(event.condition, null, 2) }}</pre>
        </div>
      </div>
    </div>
    
    <!-- JSON 查看模态框 -->
    <div class="modal" v-if="showJsonModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>事件 JSON 数据</h3>
          <button class="close-button" @click="showJsonModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <pre>{{ JSON.stringify(event, null, 2) }}</pre>
        </div>
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
  },
  data() {
    return {
      expandedSections: {
        basicInfo: true,
        tips: false,
        openConditions: false,
        randomText: false,
        settlementPrior: false,
        settlement: false,
        settlementExtre: false,
        cardsSlot: false,
        on: false,
        condition: false
      },
      showJsonModal: false
    }
  },
  methods: {
    toggleSection(section) {
      this.expandedSections[section] = !this.expandedSections[section];
    }
  }
}
</script>

<style scoped>
.event-details-container {
  padding: 15px;
  max-height: 100%;
  overflow-y: auto;
  position: relative;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

h2 {
  margin: 0;
  display: flex;
  align-items: center;
}

.event-id {
  font-size: 0.8em;
  color: #666;
  font-weight: normal;
  margin-left: 8px;
}

.json-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.json-button:hover {
  background-color: #45a049;
}

.event-info {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #eaeaea;
  overflow: hidden;
}

.card-header {
  padding: 12px 15px;
  background-color: #f9f9f9;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.card-header:hover {
  background-color: #f0f0f0;
}

.card-header h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.toggle-icon {
  font-size: 12px;
  color: #666;
}

.card-content {
  padding: 15px;
  border-top: 1px solid #eee;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-weight: bold;
  color: #555;
  font-size: 14px;
}

.info-value {
  color: #333;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  background-color: #e0f7fa;
  color: #00838f;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

pre {
  background-color: #f8f8f8;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 13px;
  margin: 0;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  background-color: #fff8e1;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #ffc107;
}

.condition-item {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #eee;
}

.condition-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.condition-tips {
  margin-bottom: 8px;
  font-style: italic;
  color: #666;
}

.random-text-item {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #eee;
}

.random-text-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.random-text-key {
  font-weight: bold;
  margin-bottom: 4px;
  color: #555;
}

.random-text-details {
  margin-top: 8px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 13px;
}

.settlement-item {
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #eee;
}

.settlement-item:last-child {
  margin-bottom: 0;
}

.settlement-header {
  margin-bottom: 12px;
}

.settlement-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
  color: #333;
}

.settlement-condition {
  margin-bottom: 10px;
}

.settlement-text {
  margin-bottom: 12px;
  line-height: 1.5;
  white-space: pre-line;
}

.settlement-result, .settlement-action {
  margin-top: 10px;
}

.result-effects, .action-effects {
  margin-top: 6px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.effect-item {
  background-color: #f0f0f0;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 13px;
}

.cards-slot-container {
  max-height: 300px;
  overflow-y: auto;
}

/* 模态框样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 15px;
  overflow-y: auto;
  max-height: calc(80vh - 60px);
}

.modal-body pre {
  margin: 0;
  white-space: pre-wrap;
}
</style>