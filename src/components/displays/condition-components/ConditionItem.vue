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
          {{ displayValue }}
        </span>
      </template>
      <!-- 处理卡位卡片条件，添加点击查看详情 -->
      <template v-else-if="isSlotCardCondition">
        <span class="clickable" @click="handleSlotCardClick">
          {{ displayValue }}
        </span>
      </template>
      <!-- 其他条件 -->
      <template v-else>
        {{ displayValue }}
      </template>
    </span>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { getCommentFromCache, loadEventData, getCardById, getRiteSlotInfo } from '@/services/eventService';

export default {
  name: 'ConditionItem',
  props: {
    riteId: {
      type: Number,
      required: true
    },
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
    // const cardCache = ref({});
    const counterCache = ref({});
    const displayValue = ref(''); // 新增：用于显示的值
    
    // 计算属性
    const isRiteCondition = computed(() => {
      return props.conditionKey.includes('rite') || props.conditionKey.includes('rite_end');
    });
    
    const isCardCondition = computed(() => {
      return props.conditionKey.includes('have') || 
             props.conditionKey.includes('hand_have') || 
             props.conditionKey.includes('table_have');
    });
    
    // 新增：检测是否为卡位卡片条件
    const isSlotCardCondition = computed(() => {
      // 匹配形如 s3.is 或 !s3.纵欲的痕迹 的模式
      return /^(非)?s\d+\.(is|[^.]+)/.test(props.conditionKey);
    });
    
    const formattedKey = computed(() => {
      return formatKey(props.conditionKey);
    });
    
    // 方法
    const formatKey = (key) => {
      // 处理卡位相关条件
      if (/^(非)?s\d+\.is$/.test(key)) {
        const isNegated = key.startsWith('非');
        const slotMatch = key.match(/s(\d+)/);
        const slotNum = slotMatch ? slotMatch[1] : '';
        return isNegated ? `卡位 ${slotNum} 不是` : `卡位 ${slotNum} 是`;
      } else if (/^(非)?s\d+\.[^.]+$/.test(key)) {
        const isNegated = key.startsWith('非');
        const slotMatch = key.match(/s(\d+)\.([^.]+)/);
        if (slotMatch) {
          const slotNum = slotMatch[1];
          const attribute = slotMatch[2];
          return isNegated ? `卡位 ${slotNum} 没有${attribute}` : `卡位 ${slotNum} 有${attribute}`;
        }
      }
      
      if (key === 'is') {
        return '需要卡片';
      } else if (key === 'type') {
        return '需要类型';
      } else if (key === 'any') {
        return '任意满足';
      } else if (key === 'round_begin_ba') {
        return '天数';
      } else if (key === '杀戮' || key === '纵欲' || key === '奢靡' || key === '征服') {
        return `需要${key}`;
      } else if (key.startsWith('rite_end') || key.startsWith('非rite_end')) {
        // 处理仪式结束条件
        const isNegated = key.startsWith('非');
        return isNegated ? `仪式结束未触发` : `仪式结束已触发`;
      } else if (key.startsWith('rite') || key.startsWith('非rite')) {
        // 处理仪式条件
        const isNegated = key.startsWith('非');
        return isNegated ? `仪式未开启` : `仪式已开启`;
      } else if (key.startsWith('have.') || key.startsWith('非have.')) {
        // 处理拥有卡片条件
        const isNegated = key.startsWith('非');
        const cardInfo = key.replace(/^(非)?have\./, '').split('.');
        const cardDesc = cardInfo.length > 1 ? cardInfo[1] : '';
        return isNegated ? `未拥有卡片${cardDesc ? ` ${cardDesc}` : ''}` : `拥有卡片${cardDesc ? ` ${cardDesc}` : ''}`;
      } else if (key.startsWith('hand_have.') || key.startsWith('非hand_have.')) {
        // 处理手牌中的卡片条件
        const isNegated = key.startsWith('非');
        return isNegated ? `手牌中没有` : `手牌中有`;
      } else if (key.startsWith('table_have.') || key.startsWith('非table_have.')) {
        // 处理牌库中的卡片条件
        const isNegated = key.startsWith('非');
        return isNegated ? `牌库中没有` : `牌库中有`;
      } else if (key.startsWith('counter.')) {
        // 处理counter类型的条件
        const counterMatch = key.match(/counter\.(\d+)([大小等于]+)/);
        if (counterMatch) {
          const counterId = counterMatch[1];
          const operator = counterMatch[2];
          
          // 尝试从缓存获取counter的注释文本
          const cachedText = getCounterText(counterId, operator);
          if (cachedText) {
            // 根据操作符添加适当的文本
            let operatorText = operator;
            
            return `${cachedText}${operatorText}`;
          }
        }
        
        // 如果没有缓存或匹配失败，返回原始键
        return key;
      } else if (key.startsWith('r') && /^r\d+:.+[大小等于]/.test(key)) {
        // 处理卡槽角色属性条件，如 "r1:体魄<"
        const slotMatch = key.match(/r(\d+):(.+?)([大小等于]+)$/);
        if (slotMatch) {
          const slotNum = slotMatch[1];
          let attribute = slotMatch[2]; // 体魄、战斗等属性
          const operator = slotMatch[3]; // <, >, >=, <= 等操作符
          
          // 处理复合属性，如 "智慧加生存"
          if (attribute.includes('加')) {
            attribute = attribute.split('加').join(' + ');
          }
          
          let operatorText = operator;
          
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
      } else if (key.startsWith('非s') && /^非s\d+$/.test(key)) {
        const slotNum = key.substring(2);
        return `不能与卡位 ${slotNum} 同时填入`;
      } else if (key.startsWith('s') && /^s\d+$/.test(key)) {
        const slotNum = key.substring(1);
        return `卡位 ${slotNum}`;
      } else if (key.endsWith('=')) {
        return key.slice(0, -1) + ' 等于';
      } else if (key.startsWith('非')) {
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
      // 处理卡位卡片条件
      if (/^(非)?s\d+\.is$/.test(key) && typeof value === 'number') {
        return `卡片 #${value}`;
      }
      
      // 处理卡位属性条件
      if (/^(非)?s\d+\.[^.]+$/.test(key)) {
        const slotMatch = key.match(/s(\d+)/);
        if (slotMatch) {
          return `卡位 ${slotMatch[1]}`;
        }
      }
      
      if (key.startsWith('rite') || key.startsWith('非rite')) {
        // 处理仪式值，显示仪式名称
        const riteId = getRiteId();
        const riteName = getRiteName(riteId);
        return riteName ? `${riteName} (#${riteId})` : `仪式 #${riteId}`;
      } else if (key.startsWith('have.') || key.startsWith('非have.') || 
                 key.startsWith('hand_have.') || key.startsWith('非hand_have.') ||
                 key.startsWith('table_have.') || key.startsWith('非table_have.')) {
        // 处理卡片值，显示卡片名称
        const cardId = getCardIdFromKey(key);
        return `卡片 #${cardId}`;
      } else if (key === 'round_begin_ba' && Array.isArray(value) && value.length === 2) {
        return `每 ${value[0]} 天检查一次是否满足触发条件`;
      } else if (key === 'round_begin_ba' && !Array.isArray(value) ) {
        return `每 ${value} 天检查一次是否满足触发条件`;
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
    
    // 新增：异步加载卡片和卡位信息
    const loadCardAndSlotInfo = async () => {
      if (/^(非)?s\d+\.is$/.test(props.conditionKey) && typeof props.conditionValue === 'number') {
        // 加载卡片信息
        try {
          const cardData = await getCardById(props.conditionValue);
          if (cardData && cardData.name) {
            displayValue.value = `${cardData.name} (#${props.conditionValue})`;
          } else {
            displayValue.value = `卡片 #${props.conditionValue}`;
          }
        } catch (e) {
          console.error(`获取卡片 ${props.conditionValue} 名称失败:`, e);
          displayValue.value = `卡片 #${props.conditionValue}`;
        }
      } else if (/^(非)?s\d+\.[^.]+$/.test(props.conditionKey)) {
        // 加载卡位信息
        const slotMatch = props.conditionKey.match(/s(\d+)/);
        if (slotMatch) {
          try {
            const slotData = await getRiteSlotInfo(props.riteId, 's'+slotMatch[1]);
            if (slotData && slotData.text) {
              displayValue.value = slotData.text;
            } else {
              displayValue.value = `卡位 ${slotMatch[1]}`;
            }
          } catch (e) {
            console.error(`获取卡位 s${slotMatch[1]} 名称失败:`, e);
            displayValue.value = `卡位 ${slotMatch[1]}`;
          }
        }
      } else if (isCardCondition.value) {
        // 处理卡片条件
        const cardId = getCardIdFromKey(props.conditionKey);
        if (cardId) {
          try {
            const cardData = await getCardById(cardId);
            if (cardData && cardData.name) {
              displayValue.value = `${cardData.name} (#${cardId})`;
            } else {
              displayValue.value = `卡片 #${cardId}`;
            }
          } catch (e) {
            console.error(`获取卡片 ${cardId} 名称失败:`, e);
            displayValue.value = `卡片 #${cardId}`;
          }
        } else {
          displayValue.value = formatValue(props.conditionKey, props.conditionValue);
        }
      } else {
        // 其他条件使用同步格式化
        displayValue.value = formatValue(props.conditionKey, props.conditionValue);
      }
    };
    
    
    const getRiteId = () => {
      if (typeof props.conditionValue === 'number') {
        return props.conditionValue;
      } else {
        return props.conditionKey.replace(/^(非)?rite(_end)?/, '').replace(/^\./, '');
      }
    };
    
    const getRiteName = (riteId) => {
      if (!riteId) return null;
      return riteCache.value[riteId] || null;
    };
    
    // 获取卡位信息
    const getSlotInfo = () => {
      const slotMatch = props.conditionKey.match(/s(\d+)/);
      if (slotMatch) {
        return {
          slotNumber: slotMatch[1],
          // 如果是 s3.is 类型，值就是卡片ID
          cardId: /^(非)?s\d+\.is$/.test(props.conditionKey) ? props.conditionValue : null,
          // 提取属性名，如 "纵欲的痕迹"
          attribute: props.conditionKey.match(/\.([^.]+)$/)?.[1]
        };
      }
      return null;
    };
    
    const handleRiteClick = (riteId) => {
      emit('show-rite-details', riteId);
    };
    
    // 修复 getCardIdFromKey 函数中未使用的 key 参数
    const getCardIdFromKey = (key) => {
      // 处理卡位卡片条件
      if (/^(非)?s\d+\.is$/.test(props.conditionKey)) {
        return props.conditionValue;
      }
      
      if (key.startsWith('have.') || key.startsWith('非have.')) {
        return key.replace(/^(非)?have\./, '').split('.')[0];
      } else if (key.startsWith('hand_have.') || key.startsWith('非hand_have.')) {
        return key.replace(/^(非)?hand_have\./, '');
      } else if (key.startsWith('table_have.') || key.startsWith('非table_have.')) {
        return key.replace(/^(非)?table_have\./, '');
      }
      return null;
    };

    const handleCardClick = () => {
      const cardId = getCardIdFromKey(props.conditionKey);
      if (cardId) {
        emit('show-card-details', cardId);
      }
    };
    
    // 新增：处理卡位卡片点击
    const handleSlotCardClick = () => {
      const slotInfo = getSlotInfo();
      if (slotInfo) {
        if (slotInfo.cardId) {
          // 如果有卡片ID，显示卡片详情
          emit('show-card-details', slotInfo.cardId);
        } else {
          // 否则显示卡位详情
          emit('show-slot-details', slotInfo.slotNumber);
        }
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
    
    // 监听属性变化，重新加载数据
    watch([() => props.conditionKey, () => props.conditionValue, () => props.riteId], () => {
      loadCardAndSlotInfo();
    });

    // 初始化加载
    onMounted(() => {
      // 加载仪式信息
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
      
      // 加载卡片和卡位信息
      loadCardAndSlotInfo();
    });
    
    return {
      isRiteCondition,
      isCardCondition,
      isSlotCardCondition,
      formattedKey,
      displayValue, // 替换 formattedValue
      handleRiteClick,
      handleCardClick,
      handleSlotCardClick,
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