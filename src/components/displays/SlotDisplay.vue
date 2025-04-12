<template>
  <div class="slot-display">
    <!-- 卡位文本 -->
    <div class="slot-text" v-if="slotInfo.text">
      <h4>描述</h4>
      <p>{{ slotInfo.text }}</p>
    </div>
    
    <!-- 卡位条件 -->
    <div class="slot-condition" v-if="slotInfo.condition">
      <h4>条件</h4>
      <div class="condition-details">
        <condition-display :condition="slotInfo.condition"></condition-display>
      </div>
    </div>
    
    <!-- 卡位属性 -->
    <div class="slot-properties">
      <h4>属性</h4>
      <div class="properties-grid">
        <div class="property-item" v-if="slotInfo.is_key !== undefined">
          <span class="property-name">关键卡位:</span>
          <span class="property-value">{{ slotInfo.is_key ? '是' : '否' }}</span>
        </div>
        <div class="property-item" v-if="slotInfo.is_empty !== undefined">
          <span class="property-name">可为空:</span>
          <span class="property-value">{{ slotInfo.is_empty ? '是' : '否' }}</span>
        </div>
        <div class="property-item" v-if="slotInfo.is_enemy !== undefined">
          <span class="property-name">敌对卡位:</span>
          <span class="property-value">{{ slotInfo.is_enemy ? '是' : '否' }}</span>
        </div>
        <div class="property-item" v-if="slotInfo.open_adsorb !== undefined">
          <span class="property-name">开启吸附:</span>
          <span class="property-value">{{ slotInfo.open_adsorb ? '是' : '否' }}</span>
        </div>
      </div>
    </div>
    
    <!-- 卡位弹出选项 -->
    <div v-if="slotInfo.pops && slotInfo.pops.length > 0" class="slot-pops">
      <h4>可能的选择 ({{ slotInfo.pops.length }})</h4>
      <div v-for="(pop, index) in slotInfo.pops" :key="index" class="pop-item">
        <div class="pop-header">选择 {{ index + 1 }}</div>
        <div class="pop-content">
          <div class="pop-condition" v-if="pop.condition">
            <h5>条件</h5>
            <condition-display :condition="pop.condition"></condition-display>
          </div>
          <div class="pop-action" v-if="pop.action">
            <h5>动作</h5>
            <action-display :action="pop.action"></action-display>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 其他信息 -->
    <div class="slot-other-info" v-if="hasOtherInfo">
      <h4>其他信息</h4>
      <div v-for="(value, key) in otherInfo" :key="key" class="other-info-item">
        <span class="info-key">{{ key }}:</span>
        <span class="info-value">{{ formatValue(value) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import ConditionDisplay from './ConditionDisplay.vue';
import ActionDisplay from './ActionDisplay.vue';

export default {
  name: 'SlotDisplay',
  components: {
    ConditionDisplay,
    ActionDisplay
  },
  props: {
    slotInfo: {
      type: Object,
      required: true
    }
  },
  computed: {
    // 过滤出其他信息（不包括已显示的标准属性）
    otherInfo() {
      if (!this.slotInfo) return {};
      
      const standardKeys = ['text', 'condition', 'is_key', 'is_empty', 'is_enemy', 'open_adsorb', 'riteId', 'slotId', 'pops'];
      return Object.entries(this.slotInfo)
        .filter(([key]) => !standardKeys.includes(key))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    },
    hasOtherInfo() {
      return Object.keys(this.otherInfo).length > 0;
    }
  },
  methods: {
    formatValue(value) {
      if (typeof value === 'boolean') {
        return value ? '是' : '否';
      } else if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value;
    }
  }
}
</script>

<style scoped>
.slot-display {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

h4 {
  margin-top: 15px;
  margin-bottom: 10px;
  color: #303133;
  font-size: 16px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
}

h4:first-child {
  margin-top: 0;
}

h5 {
  margin: 10px 0;
  color: #606266;
  font-size: 14px;
}

.slot-text p {
  margin: 0;
  line-height: 1.6;
  color: #606266;
  white-space: pre-line;
}

.condition-details {
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow-x: auto;
}

.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.property-item, .other-info-item {
  margin-bottom: 8px;
  display: flex;
  background-color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.property-name, .info-key {
  font-weight: bold;
  color: #606266;
  width: 120px;
  flex-shrink: 0;
}

.property-value, .info-value {
  color: #303133;
  flex-grow: 1;
}

.slot-pops {
  margin-top: 20px;
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
  font-weight: bold;
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

@media (max-width: 768px) {
  .pop-content {
    grid-template-columns: 1fr;
  }
  
  .properties-grid {
    grid-template-columns: 1fr;
  }
}
</style>