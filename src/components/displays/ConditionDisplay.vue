<template>
  <div class="condition-container" v-if="Object.keys(condition).length > 0">
    <div class="container-header">
      <span class="container-icon">🔍</span>
      <span class="container-title">条件</span>
    </div>
    <div class="condition-content">
      <!-- 简单条件显示 -->
      <div v-if="isSimpleCondition" class="simple-condition">
        <condition-item 
          v-for="(value, key) in condition" 
          :key="key" 
          :conditionKey="key" 
          :conditionValue="value"
          @show-rite-details="showRiteDetails"
          @show-card-details="showCardDetails"
        />
      </div>
      
      <!-- 递归条件显示 -->
      <div v-else-if="hasRecursiveConditions" class="recursive-condition">
        <!-- 处理all条件 -->
        <div v-if="condition.all" class="all-condition">
          <div class="condition-header">全部满足：</div>
          <div class="nested-conditions">
            <condition-display :condition="condition.all" />
          </div>
        </div>
        
        <!-- 处理any条件 -->
        <div v-if="condition.any" class="any-condition">
          <div class="condition-header">任意满足：</div>
          <div class="nested-conditions">
            <condition-display :condition="condition.any" />
          </div>
        </div>
        
        <!-- 处理其他条件 -->
        <div v-if="Object.keys(otherConditions).length > 0" class="other-conditions">
          <condition-item 
            v-for="(value, key) in otherConditions" 
            :key="key" 
            :conditionKey="key" 
            :conditionValue="value"
            @show-rite-details="showRiteDetails"
            @show-card-details="showCardDetails"
          />
        </div>
      </div>
      
      <!-- 特殊条件显示 -->
      <div v-else-if="hasSpecialCondition" class="special-condition">
        <!-- 卡片条件 -->
        <card-condition 
          v-if="condition.is" 
          :cardId="condition.is" 
          @show-card-details="showCardDetails"
        />
        
        <!-- 类型条件 -->
        <div v-if="condition.type" class="condition-item">
          <span class="condition-key">需要类型</span>
          <span class="condition-value">{{ formatCardType(condition.type) }}</span>
        </div>
        
        <!-- 任意满足条件 -->
        <any-condition 
          v-if="condition.any" 
          :anyCondition="condition.any"
          @show-card-details="showCardDetails"
        />
        
        <!-- 卡槽限制条件 -->
        <slot-restriction 
          v-for="(value, key) in slotRestrictions" 
          :key="key" 
          :slotKey="key" 
          :slotValue="value"
        />
        
        <!-- 其他条件 -->
        <condition-item 
          v-for="(value, key) in otherConditions" 
          :key="key" 
          :conditionKey="key" 
          :conditionValue="value"
          @show-rite-details="showRiteDetails"
          @show-card-details="showCardDetails"
        />
      </div>
      
      <!-- 复杂条件显示为JSON -->
      <div v-if="shouldShowJson" class="complex-condition">
        <pre>{{ JSON.stringify(condition, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import {  computed } from 'vue';
import { eventBus } from '@/components/CardDetailsModal.vue';
import eventBus2 from '@/utils/eventBus';
import ConditionItem from './condition-components/ConditionItem.vue';
import CardCondition from './condition-components/CardCondition.vue';
import AnyCondition from './condition-components/AnyCondition.vue';
import SlotRestriction from './condition-components/SlotRestriction.vue';

export default {
  name: 'ConditionDisplay',
  components: {
    ConditionDisplay: () => import('./ConditionDisplay.vue'),
    ConditionItem,
    CardCondition,
    AnyCondition,
    SlotRestriction
  },
  props: {
    condition: {
      type: Object,
      required: true,
      default: () => ({})
    }
  },
  setup(props) {
    // 计算属性
    const isSimpleCondition = computed(() => {
      // 判断是否为简单条件（没有嵌套对象且没有特殊条件）
      return !Object.values(props.condition).some(value => typeof value === 'object' && value !== null) 
        && !hasSpecialKeys.value;
    });
    
    const hasSpecialKeys = computed(() => {
      // 检查是否包含特殊键
      const specialKeys = ['is', 'type', 'any'];
      return specialKeys.some(key => key in props.condition) || 
        Object.keys(props.condition).some(key => 
          key.startsWith('!s') || 
          key.startsWith('s') || 
          key.startsWith('r') || 
          key === 'round_begin_ba'
        );
    });
    
    const hasSpecialCondition = computed(() => {
      // 判断是否包含特殊条件
      return hasSpecialKeys.value && !isComplexCondition.value;
    });
    
    const isComplexCondition = computed(() => {
      // 判断是否为复杂条件（包含深层嵌套）
      return Object.values(props.condition).some(value => {
        return typeof value === 'object' && value !== null && 
          !(value instanceof Array) && 
          Object.keys(value).length > 3; // 如果对象属性超过3个，视为复杂对象
      });
    });
    
    const hasRecursiveConditions = computed(() => {
      // 检测递归条件
      return props.condition && (props.condition.all || props.condition.any);
    });
    
    const shouldShowJson = computed(() => {
      // 检测是否应该显示JSON
      return !isSimpleCondition.value && 
              !props.condition.all &&
              !props.condition.is &&
              !props.condition.type &&
              !props.condition.any &&
              Object.keys(otherConditions.value).length === 0 &&
              Object.keys(slotRestrictions.value).length === 0 &&
              !hasRecursiveConditions.value &&
              !isComplexCondition.value ||
              Object.keys(props.condition).length === 0;
    });
    
    const otherConditions = computed(() => {
      // 获取其他非特殊条件
      const specialKeys = ['is', 'type', 'any', 'all'];
      const others = {};
      Object.entries(props.condition).forEach(([key, value]) => {
        if (!specialKeys.includes(key) && 
            !key.startsWith('!s') && 
            !key.startsWith('s') && 
            typeof value !== 'object' || 
            // 特殊处理r开头的属性条件和天数限制
            key.startsWith('r') || 
            key === 'round_begin_ba') {
          others[key] = value;
        }
      });
      return others;
    });
    
    const slotRestrictions = computed(() => {
      // 获取所有卡槽限制条件
      const restrictions = {};
      Object.entries(props.condition).forEach(([key, value]) => {
        if ((key.startsWith('!s') || key.startsWith('s')) && /^(!)?s\d+$/.test(key)) {
          restrictions[key] = value;
        }
      });
      return restrictions;
    });
    
    // 方法
    const formatCardType = (type) => {
      // 格式化卡片类型
      const typeMap = {
        'char': '角色',
        'item': '物品',
        'skill': '技能',
        'event': '事件',
        'enemy': '敌人',
        'npc': 'NPC',
        'sudan': '苏丹卡'
      };
      return typeMap[type] || type;
    };
    
    const showRiteDetails = (riteId) => {
      console.log(`显示仪式详情:`, riteId);
      // 使用事件总线触发显示仪式详情事件
      eventBus2.emit('show-rite-details', riteId);
    };
    
    const showCardDetails = (cardId) => {
      console.log(`显示卡片详情:`, cardId);
      eventBus.emit('show-card-details', cardId);
    };
    
    return {
      isSimpleCondition,
      hasSpecialKeys,
      hasSpecialCondition,
      isComplexCondition,
      hasRecursiveConditions,
      shouldShowJson,
      otherConditions,
      slotRestrictions,
      formatCardType,
      showRiteDetails,
      showCardDetails
    };
  }
}
</script>

<style scoped>
.condition-container {
  margin-top: 15px;
  padding: 12px;
  border-radius: 6px;
  background-color: #f3f8ff;
  border: 1px solid #b3d8ff;
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
  color: #409eff;
}

.simple-condition, .special-condition {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.condition-item {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.condition-key {
  font-weight: bold;
  margin-bottom: 4px;
  color: #606266;
}

.condition-value {
  color: #333;
}

.complex-condition pre {
  margin: 0;
  background-color: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  overflow-x: auto;
}

.recursive-condition {
  margin-bottom: 10px;
}

.all-condition, .any-condition {
  margin-bottom: 15px;
}

.condition-header {
  font-weight: bold;
  margin-bottom: 8px;
  color: #409eff;
}

.nested-conditions {
  margin-left: 15px;
  padding-left: 10px;
  border-left: 2px solid #b3d8ff;
}
</style>