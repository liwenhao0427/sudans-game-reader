<template>
  <div class="event-details-container">
    <div class="event-header">
      <h2>{{ event.name || event.text || '未命名事件' }} <span class="event-id">(ID: {{ event.id }})</span></h2>
      <button class="json-button" @click="showJsonModal = true">查看JSON</button>
    </div>
    
    <div class="event-info">
      <!-- 基本描述 -->
      <div class="info-card description-card">
        <div class="info-item full-width" v-if="event.text">
          <div class="event-description">{{ event.text }}</div>
        </div>
      </div>


      <!-- 卡片槽位 -->
      <div class="info-card" v-if="event.cards_slot">
        <div class="card-header" @click="toggleSection('cardsSlot')">
          <h3>卡片槽位</h3>
          <span class="toggle-icon">{{ expandedSections.cardsSlot ? '▼' : '►' }}</span>
        </div>
        <div class="card-content" v-if="expandedSections.cardsSlot">
          <div v-for="(slot, key) in event.cards_slot" :key="key" class="card-slot-item">
            <div class="card-slot-header">
              <h4 class="slot-key">{{ key }}</h4>
              <div class="slot-text">{{ slot.text }}</div>
            </div>
            
            <div class="card-slot-grid">
              <div class="card-slot-info">
                <div class="info-badge" :class="{'active': slot.open_adsorb === 1}">
                  <span class="badge-label">开放吸附</span>
                  <span class="badge-value">{{ slot.open_adsorb ? '是' : '否' }}</span>
                </div>
                <div class="info-badge" :class="{'active': slot.is_key === 1}">
                  <span class="badge-label">关键</span>
                  <span class="badge-value">{{ slot.is_key ? '是' : '否' }}</span>
                </div>
                <div class="info-badge" :class="{'active': slot.is_empty === 1}">
                  <span class="badge-label">空</span>
                  <span class="badge-value">{{ slot.is_empty ? '是' : '否' }}</span>
                </div>
                <div class="info-badge" :class="{'active': slot.is_enemy === 1}">
                  <span class="badge-label">敌人</span>
                  <span class="badge-value">{{ slot.is_enemy ? '是' : '否' }}</span>
                </div>
              </div>
              
              <div class="card-slot-condition">
                <!-- 使用统一的条件显示组件 -->
                <condition-display v-if="isNotNullOrEmpty(slot.condition)" :condition="slot.condition"></condition-display>
              </div>
            </div>
            
            <div v-if="slot.pops && slot.pops.length > 0" class="card-slot-pops">
              <div class="pops-header">可能的选择 ({{ slot.pops.length }})</div>
              <div v-for="(pop, index) in slot.pops" :key="index" class="pop-item">
                <div class="pop-header">选择 {{ index + 1 }}</div>
                <div class="pop-content">
                  <div class="pop-condition">
                    <!-- 使用统一的条件显示组件 -->
                    <condition-display v-if="isNotNullOrEmpty(pop.condition)" :condition="pop.condition"></condition-display>
                  </div>
                  <div class="pop-action">
                    <!-- 使用统一的动作显示组件 -->
                    <action-display v-if="isNotNullOrEmpty(pop.action)" :action="pop.action"></action-display>
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
            <!-- 处理选项型事件 -->
            <div v-if="item.action?.option" class="options-container">
              <div class="option-description">{{ item.action.option.text }}</div>
              <div class="options-list">
                <div v-for="(option, optIndex) in item.action.option.items" :key="optIndex" 
                     class="option-item" @click="toggleOptionDetails(index, option.tag)"
                     :class="{'active': isOptionExpanded(index, option.tag)}">
                  <div class="option-header">
                    <span class="option-text">{{ option.text }}</span>
                    <span class="option-toggle">{{ isOptionExpanded(index, option.tag) ? '▼' : '►' }}</span>
                  </div>
                  
                  <div v-if="isOptionExpanded(index, option.tag)" class="option-details">
                    <div v-if="item.action['case:' + option.tag]?.prompt" class="option-result">
                      {{ item.action['case:' + option.tag].prompt.text }}
                    </div>
                    <div class="option-effects">
                      <action-display 
                        v-if="hasEffects(item.action['case:' + option.tag])" 
                        :action="getEffects(item.action['case:' + option.tag])">
                      </action-display>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 处理常规结算 -->
            <div v-else class="settlement-body">
              <div class="settlement-text" v-if="item.result_text" 
                   @click="toggleSettlementDetails(index, 'settlement')" 
                   :class="{'clickable': true}">
                <div class="settlement-title" v-if="item.result_title">{{ item.result_title }}</div>
                {{ item.result_text }}
                <div class="toggle-details-hint">
                  {{ isSettlementExpanded('settlement', index) ? '收起详情 ▲' : '查看详情 ▼' }}
                </div>
              </div>
              
              <div v-if="isSettlementExpanded('settlement', index)">
                <condition-display v-if="isNotNullOrEmpty(item.condition)" :condition="item.condition"></condition-display>                
                <result-display v-if="isNotNullOrEmpty(item.result)" :result="item.result"></result-display>
                <action-display v-if="isNotNullOrEmpty(item.action)" :action="item.action"></action-display>
              </div>
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
      
      <!-- 物品列表 -->
      <div class="info-card" v-if="event.item && event.item.length > 0">
        <item-list-display :items="event.item" />
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
              <condition-display v-if="isNotNullOrEmpty(condition.condition)" :condition="condition.condition"></condition-display>
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
            
            <div class="settlement-body">
              <div class="settlement-text" v-if="item.result_text" @click="toggleSettlementDetails(index, 'settlementPrior')" :class="{'clickable': true}">
                <div class="settlement-title" v-if="item.result_title">{{ item.result_title }}</div>
                {{ item.result_text }}
                <div class="toggle-details-hint">{{ isSettlementExpanded('settlementPrior', index) ? '收起详情 ▲' : '查看详情 ▼' }}</div>
              </div>
              
              <div v-if="isSettlementExpanded('settlementPrior', index)">
                <!-- 使用统一的条件显示组件 -->
                <condition-display v-if="isNotNullOrEmpty(item.condition)" :condition="item.condition"></condition-display>
                
                <!-- 使用统一的结果显示组件 -->
                <result-display v-if="isNotNullOrEmpty(item.result)" :result="item.result"></result-display>
                
                <!-- 使用统一的动作显示组件 -->
                <action-display v-if="isNotNullOrEmpty(item.action)" :action="item.action"></action-display>
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
            <div class="settlement-body">
              <div class="settlement-text" v-if="item.result_text" @click="toggleSettlementDetails(index, 'settlementPrior')" :class="{'clickable': true}">
                <div class="settlement-title" v-if="item.result_title">{{ item.result_title }}</div>
                {{ item.result_text }}
                <div class="toggle-details-hint">{{ isSettlementExpanded('settlementPrior', index) ? '收起详情 ▲' : '查看详情 ▼' }}</div>
              </div>
              
              <div v-if="isSettlementExpanded('settlementPrior', index)">
                <!-- 使用统一的条件显示组件 -->
                <condition-display v-if="item.condition" :condition="item.condition"></condition-display>
                
                <!-- 使用统一的结果显示组件 -->
                <result-display v-if="item.result" :result="item.result"></result-display>
                
                <!-- 使用统一的动作显示组件 -->
                <action-display v-if="item.action" :action="item.action"></action-display>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 其他信息 -->
      <div class="info-card" v-if="event.location || event.tag_tips|| event.is_replay|| event.auto_start">
        <div class="card-header" @click="toggleSection('basicInfo')">
          <h3>其他信息</h3>
          <span class="toggle-icon">{{ expandedSections.basicInfo ? '▼' : '►' }}</span>
        </div>
        <div class="card-content" v-if="expandedSections.basicInfo">
          <div class="info-grid">
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


      <!-- 触发条件 -->
      <div class="info-card" v-if="event.on">
        <div class="card-header" @click="toggleSection('on')">
          <h3>触发条件</h3>
          <span class="toggle-icon">{{ expandedSections.on ? '▼' : '►' }}</span>
        </div>
        <div class="card-content" v-if="expandedSections.on">
          <condition-display v-if="event.on" :condition="event.on"></condition-display>
        </div>
      </div>
      
      <!-- 条件 -->
      <div class="info-card" v-if="event.condition && Object.keys(event.condition).length > 0">
        <div class="card-header" @click="toggleSection('condition')">
          <h3>条件</h3>
          <span class="toggle-icon">{{ expandedSections.condition ? '▼' : '►' }}</span>
        </div>
        <div class="card-content" v-if="expandedSections.condition">
          <!-- 使用统一的条件显示组件 -->
          <condition-display v-if="event.condition" :condition="event.condition"></condition-display>
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
/* eslint-disable */
// 导入统一的显示组件
import ConditionDisplay from './displays/ConditionDisplay.vue';
import ResultDisplay from './displays/ResultDisplay.vue';
import ActionDisplay from './displays/ActionDisplay.vue';
import ItemListDisplay from './displays/ItemListDisplay.vue';
export default {
  name: 'EventDetails',
  components: {
    ConditionDisplay,
    ResultDisplay,
    ActionDisplay,
    ItemListDisplay
  },
  props: {
    event: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      expandedOptions: {},
      expandedSections: {
        basicInfo: true,
        tips: true,
        openConditions: false,
        randomText: true,
        settlementPrior: false,
        settlement: true,
        settlementExtre: false,
        cardsSlot: false,
        on: false,
        condition: false
      },
      expandedSettlements: {
        settlementPrior: {},
        settlement: {},
        settlementExtre: {}
      },
      showJsonModal: false
    }
  },
  methods: {
    isNotNullOrEmpty(obj) {
      return obj !== null && obj !== undefined && Object.keys(obj).length > 0;
    },
    toggleOptionDetails(settlementIndex, optionTag) {
      if (!this.expandedOptions[settlementIndex]) {
        this.expandedOptions[settlementIndex] = {};
      }
      if (!this.expandedOptions[settlementIndex]) {
        this.expandedOptions[settlementIndex] = {};
      }
      this.expandedOptions[settlementIndex][optionTag] =
        !this.expandedOptions[settlementIndex][optionTag];
    },
    
    isOptionExpanded(settlementIndex, optionTag) {
      return this.expandedOptions[settlementIndex]?.[optionTag] || false;
    },
    
    hasEffects(caseData) {
      if (!caseData) return false;
      const { prompt, ...effects } = caseData;
      return Object.keys(effects).length > 0;
    },
    
    getEffects(caseData) {
      if (!caseData) return {};
      const { prompt, ...effects } = caseData;
      return effects;
    },
    toggleSection(section) {
      this.expandedSections[section] = !this.expandedSections[section];
    },
    toggleSettlementDetails(index, section) {
      if (!this.expandedSettlements[section]) {
        this.expandedSettlements[section] = {};
      }
      this.expandedSettlements[section][index] = !this.expandedSettlements[section][index];
    },
    isSettlementExpanded(section, index) {
      return this.expandedSettlements[section] && this.expandedSettlements[section][index];
    }
  }
}
</script>


<style scoped>

.settlement-text {
  margin-bottom: 12px;
  line-height: 1.5;
  white-space: pre-line;
}

.clickable {
  cursor: pointer;
  padding: 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
  position: relative;
}

.clickable:hover {
  background-color: #f0f0f0;
}

.toggle-details-hint {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  text-align: right;
  font-style: italic;
}

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

/* 卡片槽位样式 */
.card-slot-item {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-slot-header {
  margin-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
}

.slot-key {
  font-size: 18px;
  color: #333;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.slot-text {
  color: #555;
  font-size: 14px;
  line-height: 1.5;
  font-style: italic;
}

.card-slot-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 15px;
  margin-bottom: 15px;
}

.card-slot-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.info-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  background-color: #f0f0f0;
  border-radius: 6px;
  min-width: 80px;
  border: 1px solid #ddd;
}

.info-badge.active {
  background-color: #e8f5e9;
  border-color: #81c784;
}

.badge-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.badge-value {
  font-weight: bold;
  color: #333;
}

.condition-header, .pops-header, .pop-header, .action-header {
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
  background-color: #eee;
  padding: 6px 10px;
  border-radius: 4px;
}

.pops-header {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 8px 12px;
  font-size: 16px;
  margin-bottom: 12px;
}

.card-slot-pops {
  margin-top: 20px;
  border-top: 1px dashed #ccc;
  padding-top: 15px;
}

.pop-item {
  margin-bottom: 15px;
  padding: 12px;
  background-color: #fff;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.pop-header {
  background-color: #f5f5f5;
  margin: -12px -12px 12px -12px;
  padding: 10px 15px;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  border-bottom: 1px solid #e0e0e0;
}

.pop-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.pop-condition, .pop-action {
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #eee;
}

/* 添加统一的条件和动作显示样式 */
.condition-container, .result-container, .action-container {
  margin-top: 15px;
  padding: 12px;
  border-radius: 6px;
  background-color: #f8f8f8;
  border: 1px solid #e0e0e0;
}

.condition-container {
  background-color: #f3f8ff;
  border-color: #b3d8ff;
}

.result-container {
  background-color: #f0f9eb;
  border-color: #c2e7b0;
}

.action-container {
  background-color: #fdf6ec;
  border-color: #f5dab1;
}

.container-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.container-icon {
  margin-right: 8px;
  font-size: 16px;
}

.container-title {
  font-weight: bold;
  font-size: 15px;
}


@media (max-width: 768px) {
  .card-slot-grid, .pop-content {
    grid-template-columns: 1fr;
  }
}

.options-container {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.option-description {
  font-size: 16px;
  line-height: 1.6;
  color: #2c3e50;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  background-color: #fff;
  transition: all 0.3s ease;
}

.option-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.option-header {
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.option-text {
  font-weight: 500;
  color: #2c3e50;
}

.option-toggle {
  color: #666;
  font-size: 12px;
}

.option-details {
  padding: 15px;
}

.option-result {
  margin-bottom: 15px;
  line-height: 1.6;
  color: #2c3e50;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #42b983;
}

.option-effects {
  margin-top: 10px;
}

.option-item.active {
  border-color: #42b983;
}

.option-item.active .option-header {
  background-color: #f0faf5;
  border-bottom-color: #42b983;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.description-card {
  margin-bottom: 20px;
  background-color: #f9f9f9;
  border-left: 4px solid #42b983;
}

.event-description {
  padding: 15px;
  font-size: 16px;
  line-height: 1.6;
  color: #2c3e50;
  white-space: pre-line;
  font-weight: 500;
}

</style>