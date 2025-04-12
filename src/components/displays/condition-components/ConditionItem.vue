<template>
  <div class="condition-item">
    <span class="condition-key">{{ formattedKey }}</span>
    <span class="condition-value">
      <!-- 处理仪式条件，添加点击查看详情 -->
      <template v-if="isRiteCondition">
        <!-- 处理数组类型的仪式 -->
        <template v-if="Array.isArray(conditionValue)">
          <div class="rite-array">
            <div v-for="(riteId, index) in conditionValue" :key="index" class="rite-item">
              <span class="clickable" @click="handleRiteClick(riteId)">
                {{ getRiteName(riteId) || 'rite_' + riteId }}
              </span>
            </div>
          </div>
        </template>
        <!-- 处理单个仪式 -->
        <template v-else>
          <span class="clickable" @click="handleRiteClick(getRiteId())">
            {{ getRiteName(getRiteId()) || 'rite_' + getRiteId() }}
          </span>
        </template>
      </template>
      <!-- 处理卡片拥有条件，添加点击查看详情 -->
      <template v-else-if="isCardCondition">
        <span class="clickable" @click="handleCardClick">
          {{ formattedValue }}
        </span>
      </template>
      <!-- 其他条件 -->
      <template v-else>
        {{ formattedValue }}
      </template>
    </span>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { getCommentFromCache, loadEventData } from '@/services/eventService';

export default {
  name: 'ConditionItem',
  props: {
    conditionKey: {
      type: String,
      required: true
    },
    conditionValue: {
      required: true
    }
  },
  setup(props, { emit }) {
    const riteCache = ref({});
    const cardCache = ref({});
    const counterCache = ref({});
    
    // 计算属性
    const isRiteCondition = computed(() => {
      return props.conditionKey.includes('rite') || props.conditionKey.includes('rite_end');
    });
    
    const isCardCondition = computed(() => {
      return props.conditionKey.includes('have') || 
             props.conditionKey.includes('hand_have') || 
             props.conditionKey.includes('table_have');
    });
    
    const formattedKey = computed(() => {
      return formatKey(props.conditionKey);
    });
    
    const formattedValue = computed(() => {
      return formatValue(props.conditionKey, props.conditionValue);
    });
    
    // 方法
    const formatKey = (key) => {
      if (key === 'is') {
        return '需要卡片';
      } else if (key === 'type') {
        return '需要类型';
      } else if (key === 'any') {
        return '任意满足';
      } else if (key === 'round_begin_ba') {
        return '天数限制';
      } else if (key === '杀戮' || key === '纵欲' || key === '奢靡' || key === '征服') {
        return `需要${key}`;
      } else if (key.startsWith('rite_end') || key.startsWith('!rite_end')) {
        // 处理仪式结束条件
        const isNegated = key.startsWith('!');
        return isNegated ? `仪式结束未触发` : `仪式结束已触发`;
      } else if (key.startsWith('rite') || key.startsWith('!rite')) {
        // 处理仪式条件
        const isNegated = key.startsWith('!');
        return isNegated ? `仪式未开启` : `仪式已开启`;
      } else if (key.startsWith('have.') || key.startsWith('!have.')) {
        // 处理拥有卡片条件
        const isNegated = key.startsWith('!');
        const cardInfo = key.replace(/^(!)?have\./, '').split('.');
        const cardDesc = cardInfo.length > 1 ? cardInfo[1] : '';
        return isNegated ? `未拥有卡片${cardDesc ? ` ${cardDesc}` : ''}` : `拥有卡片${cardDesc ? ` ${cardDesc}` : ''}`;
      } else if (key.startsWith('hand_have.') || key.startsWith('!hand_have.')) {
        // 处理手牌中的卡片条件
        const isNegated = key.startsWith('!');
        return isNegated ? `手牌中没有` : `手牌中有`;
      } else if (key.startsWith('table_have.') || key.startsWith('!table_have.')) {
        // 处理牌库中的卡片条件
        const isNegated = key.startsWith('!');
        return isNegated ? `牌库中没有` : `牌库中有`;
      } else if (key.startsWith('counter.')) {
        // 处理counter类型的条件
        const counterMatch = key.match(/counter\.(\d+)([<>=]+)/);
        if (counterMatch) {
          const counterId = counterMatch[1];
          const operator = counterMatch[2];
          
          // 尝试从缓存获取counter的注释文本
          const cachedText = getCounterText(counterId, operator);
          if (cachedText) {
            // 根据操作符添加适当的文本
            let operatorText = '';
            if (operator === '<') operatorText = '小于';
            else if (operator === '>') operatorText = '大于';
            else if (operator === '<=') operatorText = '小于等于';
            else if (operator === '>=') operatorText = '大于等于';
            else if (operator === '=') operatorText = '等于';
            
            return `${cachedText}${operatorText}`;
          }
        }
        
        // 如果没有缓存或匹配失败，返回原始键
        return key;
      } else if (key.startsWith('r') && /^r\d+:.+[<>=]/.test(key)) {
        // 处理卡槽角色属性条件，如 "r1:体魄<"
        const slotMatch = key.match(/r(\d+):(.+?)([<>=]+)$/);
        if (slotMatch) {
          const slotNum = slotMatch[1];
          let attribute = slotMatch[2]; // 体魄、战斗等属性
          const operator = slotMatch[3]; // <, >, >=, <= 等操作符
          
          // 处理复合属性，如 "智慧_PLUS_生存"
          if (attribute.includes('_PLUS_')) {
            attribute = attribute.split('_PLUS_').join(' + ');
          }
          
          let operatorText = '';
          if (operator === '<') operatorText = '小于';
          else if (operator === '>') operatorText = '大于';
          else if (operator === '<=') operatorText = '小于等于';
          else if (operator === '>=') operatorText = '大于等于';
          else if (operator === '=') operatorText = '等于';
          
          return `卡槽 ${slotNum} 的${attribute}${operatorText}`;
        }
        return key;
      } else if (key.startsWith('f:rare-s') && key.includes('.rare')) {
        // 处理卡位稀有度比较
        const slotMatch = key.match(/s(\d+)/);
        if (slotMatch) {
          const slotNum = slotMatch[1];
          if (key.endsWith('<=')) {
            return `稀有度小于等于卡位 ${slotNum} 的稀有度`;
          } else if (key.endsWith('<')) {
            return `稀有度小于卡位 ${slotNum} 的稀有度`;
          } else if (key.endsWith('>=')) {
            return `稀有度大于等于卡位 ${slotNum} 的稀有度`;
          } else if (key.endsWith('>')) {
            return `稀有度大于卡位 ${slotNum} 的稀有度`;
          } else if (key.endsWith('=')) {
            return `稀有度等于卡位 ${slotNum} 的稀有度`;
          }
        }
        return key;
      } else if (key.startsWith('!s') && /^!s\d+$/.test(key)) {
        const slotNum = key.substring(2);
        return `不能与卡位 ${slotNum} 同时填入`;
      } else if (key.startsWith('s') && /^s\d+$/.test(key)) {
        const slotNum = key.substring(1);
        return `卡位 ${slotNum}`;
      } else if (key.endsWith('=')) {
        return key.slice(0, -1) + ' 等于';
      } else if (key.startsWith('!')) {
        return '非 ' + key.slice(1);
      } else if (key.includes('<')) {
        return key.replace('<', ' 小于 ');
      } else if (key.includes('>')) {
        return key.replace('>', ' 大于 ');
      }
      return key;
    };
    
    const getCounterText = (counterId, operator) => {
      // 先尝试获取完整键名的缓存 (例如: "7000420>=")
      const fullKey = `${counterId}${operator}`;
      
      // 检查本地缓存
      if (counterCache.value[fullKey]) {
        return counterCache.value[fullKey];
      }
      
      // 从localStorage获取
      let cachedText = getCommentFromCache(fullKey);
      if (!cachedText) {
        // 如果没有找到完整键名的缓存，尝试获取基础键的缓存
        cachedText = getCommentFromCache(counterId);
      }
      
      // 存储到本地缓存
      if (cachedText) {
        counterCache.value[fullKey] = cachedText;
      }
      
      return cachedText;
    };
    
    const formatValue = (key, value) => {
      if (key.startsWith('rite') || key.startsWith('!rite')) {
        // 处理仪式值，显示仪式名称
        const riteId = getRiteId();
        const riteName = getRiteName(riteId);
        return riteName ? `${riteName} (#${riteId})` : `仪式 #${riteId}`;
      } else if (key.startsWith('have.') || key.startsWith('!have.') || 
                 key.startsWith('hand_have.') || key.startsWith('!hand_have.') ||
                 key.startsWith('table_have.') || key.startsWith('!table_have.')) {
        // 处理卡片值，显示卡片名称
        const cardId = getCardIdFromKey(key);
        const cardName = getCardName(cardId);
        return cardName ? `${cardName} (#${cardId})` : `卡片 #${cardId}`;
      } else if (key === 'round_begin_ba' && Array.isArray(value) && value.length === 2) {
        return `第 ${value[0]} 天到第 ${value[1]} 天`;
      } else if (key.startsWith('r') && /^r\d+:.+[<>=]/.test(key) && Array.isArray(value)) {
        // 处理卡槽角色属性条件的值
        if (value.length === 1) {
          return `${value[0]} 点`;
        } else if (value.length === 2) {
          return `${value[0]} 到 ${value[1]} 点`;
        }
        return value.join(', ');
      } else if (['杀戮', '纵欲', '奢靡', '征服'].includes(key)) {
        return value === 1 ? '是' : '否';
      } else if (typeof value === 'boolean') {
        return value ? '是' : '否';
      }
      return value;
    };
    
    const getCardIdFromKey = (key) => {
      if (key.startsWith('have.') || key.startsWith('!have.')) {
        return key.replace(/^(!)?have\./, '').split('.')[0];
      } else if (key.startsWith('hand_have.') || key.startsWith('!hand_have.')) {
        return key.replace(/^(!)?hand_have\./, '');
      } else if (key.startsWith('table_have.') || key.startsWith('!table_have.')) {
        return key.replace(/^(!)?table_have\./, '');
      }
      return null;
    };
    
    const getCardName = (cardId) => {
      if (!cardId) return null;
      return cardCache.value[cardId] || null;
    };
    
    const getRiteId = () => {
      if (typeof props.conditionValue === 'number') {
        return props.conditionValue;
      } else {
        return props.conditionKey.replace(/^(!)?rite(_end)?/, '').replace(/^\./, '');
      }
    };
    
    const getRiteName = (riteId) => {
      if (!riteId) return null;
      return riteCache.value[riteId] || null;
    };
    
    const handleRiteClick = (riteId) => {
      emit('show-rite-details', riteId);
    };
    
    const handleCardClick = () => {
      const cardId = getCardIdFromKey(props.conditionKey);
      if (cardId) {
        emit('show-card-details', cardId);
      }
    };
    
    // 加载仪式信息
    const loadRiteInfo = async (riteId) => {
      try {
        const eventsData = await loadEventData(riteId, 'rite');
        if (eventsData ) {
          riteCache.value[riteId] = eventsData.name || eventsData.text || `仪式 #${riteId}`;
        }
      } catch (error) {
        console.error('加载仪式信息失败:', error);
        riteCache.value[riteId] = `加载失败 #${riteId}`;
      }
    };
    
    // 初始化加载
    onMounted(() => {
      if (isRiteCondition.value) {
        if (Array.isArray(props.conditionValue)) {
          props.conditionValue.forEach(riteId => {
            loadRiteInfo(riteId);
          });
        } else {
          // 加载单个仪式
          loadRiteInfo(getRiteId());
        }
      }
    });
    
    return {
      isRiteCondition,
      isCardCondition,
      formattedKey,
      formattedValue,
      handleRiteClick,
      handleCardClick,
      getRiteId,
      getRiteName
    };
  }
}
</script>

<style scoped>
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

.clickable {
  cursor: pointer;
  color: #409eff;
  text-decoration: underline;
}

.clickable:hover {
  color: #66b1ff;
}

.rite-array {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rite-item {
  padding: 2px 0;
}
</style>