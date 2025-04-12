<template>
  <div class="action-container" v-if="Object.keys(this.action).length > 0">
    <div class="container-header">
      <span class="container-icon">⚡</span>
      <span class="container-title">动作</span>
    </div>
    <div class="action-content">
      <div v-if="hasSimpleActions" class="simple-actions">
        <div v-for="(value, key) in simpleActions" :key="key" class="action-item">
          <span class="action-key">{{ formatKey(key) }}</span>
          <span class="action-value">{{ formatValue(key, value) }}</span>
        </div>
      </div>
      
      <!-- 卡片引用显示 -->
      <div v-if="hasCardReferences" class="card-references">
        <div v-for="(cardRef, key) in cardReferences" :key="key" class="card-reference-item">
          <div class="card-reference-header">{{ formatKey(key) }}</div>
          <div v-if="Array.isArray(cardRef)" class="card-reference-array">
            <div v-for="(item, index) in cardRef" :key="`${key}-${index}`" class="card-reference">
              <template v-if="typeof item === 'number'">
                <span class="card-id">#{{ item }}</span>
                <span v-if="cardNames[item]" class="card-name clickable" @click="showCardDetails(item)">
                  {{ cardNames[item] }}
                </span>
                <span v-else class="card-loading">加载中...</span>
              </template>
              <template v-else>
                <span class="card-value">{{ item }}</span>
              </template>
            </div>
          </div>
          <div v-else class="card-reference">
            <span class="card-id">#{{ cardRef }}</span>
            <span v-if="cardNames[cardRef]" class="card-name clickable" @click="showCardDetails(cardRef)">
              {{ cardNames[cardRef] }}
            </span>
            <span v-else class="card-loading">加载中...</span>
          </div>
        </div>
      </div>
      
      <!-- 事件引用显示 -->
      <div v-if="hasEventReferences" class="event-references">
        <div v-for="(eventRef, key) in eventReferences" :key="key" class="event-reference-item">
          <div class="event-reference-header">{{ formatKey(key) }}</div>
          <div v-if="Array.isArray(eventRef)" class="event-reference-array">
            <div v-for="(event, index) in eventRef" :key="`${key}-${index}`" class="event-reference">
              <span class="event-id">#{{ event }}</span>
              <span v-if="eventNames[event]" class="event-name clickable" @click="showEventDetails(event)">
                {{ eventNames[event] }}
              </span>
              <span v-else class="event-loading">加载中...</span>
            </div>
          </div>
          <div v-else class="event-reference">
            <span class="event-id">#{{ eventRef }}</span>
            <span v-if="eventNames[eventRef]" class="event-name clickable" @click="showEventDetails(eventRef)">
              {{ eventNames[eventRef] }}
            </span>
            <span v-else class="event-loading">加载中...</span>
          </div>
        </div>
      </div>
      
      <!-- 仪式引用显示 -->
      <div v-if="hasRiteReferences" class="rite-references">
        <div v-for="(riteRef, key) in riteReferences" :key="key" class="rite-reference-item">
          <div class="rite-reference-header">{{ formatKey(key) }}</div>
          <div v-if="Array.isArray(riteRef)" class="rite-reference-array">
            <div v-for="(rite, index) in riteRef" :key="`${key}-${index}`" class="rite-reference">
              <span class="rite-id">#{{ rite }}</span>
              <span v-if="riteNames['rite_'+rite]" class="rite-name clickable" @click="showRiteDetails(rite)">
                {{ riteNames['rite_'+rite] }}
              </span>
              <span v-else class="rite-loading">加载中...</span>
            </div>
          </div>
          <div v-else class="rite-reference">
            <span class="rite-id">#{{ riteRef }}</span>
            <span v-if="riteNames['rite_'+riteRef]" class="rite-name clickable" @click="showRiteDetails(riteRef)">
              {{ riteNames['rite_'+riteRef] }}
            </span>
            <span v-else class="rite-loading">加载中...</span>
          </div>
        </div>
      </div>
      
      <!-- 战利品引用显示 -->
      <div v-if="hasLootReferences" class="loot-references">
        <div v-for="(lootRef, key) in lootReferences" :key="key" class="loot-reference-item">
          <div class="loot-reference-header">{{ formatKey(key) }}</div>
          <div v-if="Array.isArray(lootRef)" class="loot-reference-array">
            <div v-for="(loot, index) in lootRef" :key="`${key}-${index}`" class="loot-reference">
              <span class="loot-id">#{{ loot }}</span>
              <span v-if="lootNames['loot_'+loot]" class="loot-name clickable" @click="showLootDetails(loot)">
                {{ lootNames['loot_'+loot] }}
              </span>
              <span v-else class="loot-loading">加载中...</span>
            </div>
          </div>
          <div v-else class="loot-reference">
            <span class="loot-id">#{{ lootRef }}</span>
            <span v-if="lootNames['loot_'+lootRef]" class="loot-name clickable" @click="showLootDetails(lootRef)">
              {{ lootNames['loot_'+lootRef] }}
            </span>
            <span v-else class="loot-loading">加载中...</span>
          </div>
        </div>
      </div>
      
      <!-- 提示文本显示 -->
      <div v-if="hasPrompts" class="prompts">
        <div v-for="(prompt, key) in prompts" :key="key" class="prompt-item">
          <div class="prompt-header">{{ formatKey(key) }}</div>
          <div class="prompt-content">
            <div v-if="prompt.id" class="prompt-id">ID: {{ prompt.id }}</div>
            <div v-if="prompt.text" class="prompt-text">{{ prompt.text }}</div>
            <div v-if="prompt.icon" class="prompt-icon">图标: {{ Array.isArray(prompt.icon) ? prompt.icon.join(', ') : prompt.icon }}</div>
            <!-- 添加确认提示的特殊字段 -->
            <div v-if="prompt.confirm_text" class="prompt-confirm-text">确认按钮: {{ prompt.confirm_text }}</div>
            <div v-if="prompt.cancel_text" class="prompt-cancel-text">取消按钮: {{ prompt.cancel_text }}</div>
          </div>
        </div>
      </div>
      
      <!-- 选项显示 -->
      <div v-if="hasOptions" class="options">
        <div v-for="(option, key) in options" :key="key" class="option-item">
          <div class="option-header">{{ formatKey(key) }}</div>
          <!-- 选项内容 -->
        </div>
      </div>
      
      <!-- 表格引用显示 -->
      <div v-if="hasTableReferences" class="table-references">
        <div v-for="(tableRef, key) in tableReferences" :key="key" class="table-reference-item">
          <div class="table-reference-header">{{ formatKey(key) }}</div>
          <div class="table-reference">
            <span v-if="isCardReference(key)" class="card-id">#{{ extractCardId(key) }}</span>
            <span v-if="isCardReference(key) && cardNames[extractCardId(key)]" 
                  class="card-name clickable" 
                  @click="showCardDetails(extractCardId(key))">
              {{ cardNames[extractCardId(key)] }}
            </span>
            <span v-else-if="isCardReference(key)" class="card-loading">加载中...</span>
            <span v-else class="table-value">{{ tableRef }}</span>
          </div>
        </div>
      </div>
      
      <!-- 手牌引用显示 -->
      <div v-if="hasHandReferences" class="hand-references">
        <div v-for="(handRef, key) in handReferences" :key="key" class="hand-reference-item">
          <div class="hand-reference-header">{{ formatKey(key) }}</div>
          <div class="hand-reference">
            <span v-if="isCardReference(key)" class="card-id">#{{ extractCardId(key) }}</span>
            <span v-if="isCardReference(key) && cardNames[extractCardId(key)]" 
                  class="card-name clickable" 
                  @click="showCardDetails(extractCardId(key))">
              {{ cardNames[extractCardId(key)] }}
            </span>
            <span v-else-if="isCardReference(key)" class="card-loading">加载中...</span>
            <span v-else class="hand-value">{{ handRef }}</span>
          </div>
        </div>
      </div>
      
      <!-- 计数器引用显示 -->
      <div v-if="hasCounterReferences" class="counter-references">
        <div v-for="(counterRef, key) in counterReferences" :key="key" class="counter-reference-item">
          <div class="counter-reference-header">{{ formatKey(key) }}</div>
          <div class="counter-reference">
            <span class="counter-id">#{{ extractCounterId(key) }}</span>
            <span v-if="counterNames[extractCounterId(key)]" class="counter-name">
              {{ counterNames[extractCounterId(key)] }}
            </span>
            <span v-else class="counter-value">{{ counterRef }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { getCardById, loadEventData, getCommentFromCache } from '@/services/eventService';
import { eventBus } from '@/components/CardDetailsModal.vue';
import eventBus2 from '@/utils/eventBus';

export default {
  name: 'ActionDisplay',
  props: {
    action: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const cardNames = ref({});
    const eventNames = ref({});
    const riteNames = ref({});
    const lootNames = ref({});
    const counterNames = ref({});
    
    // 分类处理不同类型的动作
    const simpleActions = computed(() => {
      const result = {};
      for (const [key, value] of Object.entries(props.action)) {
        if (
          typeof value !== 'object' && 
          !key.startsWith('card') && 
          !key.startsWith('event') && 
          !key.startsWith('rite') && 
          !key.startsWith('prompt') && 
          !key.startsWith('option') &&
          !key.startsWith('loot') &&
          !key.startsWith('table.') &&
          !key.startsWith('hand_pop.') &&
          !key.includes('counter_PLUS_')
        ) {
          result[key] = value;
        }
      }
      return result;
    });
    
    // 卡片引用
    const cardReferences = computed(() => {
      const result = {};
      for (const [key, value] of Object.entries(props.action)) {
        if (key === 'card') {
          result[key] = value;
        }
      }
      return result;
    });
    
    // 战利品引用
    const lootReferences = computed(() => {
      const result = {};
      for (const [key, value] of Object.entries(props.action)) {
        if (key === 'loot') {
          result[key] = value;
        }
      }
      return result;
    });
    
    // 事件引用
    const eventReferences = computed(() => {
      const result = {};
      for (const [key, value] of Object.entries(props.action)) {
        if (key === 'event' || key === 'event_on' || key === 'event_off') {
          result[key] = value;
        }
      }
      return result;
    });
    
    // 仪式引用
    const riteReferences = computed(() => {
      const result = {};
      for (const [key, value] of Object.entries(props.action)) {
        if (key === 'rite' || key.endsWith('.rite')) {
          result[key] = value;
        }
      }
      return result;
    });
    
    // 提示文本
    const prompts = computed(() => {
      const result = {};
      for (const [key, value] of Object.entries(props.action)) {
        if (key.startsWith('prompt') || key === 'confirm') {
          result[key] = value;
        }
      }
      return result;
    });
    
    // 选项
    const options = computed(() => {
      const result = {};
      for (const [key, value] of Object.entries(props.action)) {
        if (key.startsWith('option')) {
          result[key] = value;
        }
      }
      return result;
    });
    
    // 表格引用
    const tableReferences = computed(() => {
      const result = {};
      for (const [key, value] of Object.entries(props.action)) {
        if (key.startsWith('table.')) {
          result[key] = value;
        }
      }
      return result;
    });
    
    // 手牌引用
    const handReferences = computed(() => {
      const result = {};
      for (const [key, value] of Object.entries(props.action)) {
        if (key.startsWith('hand_pop.')) {
          result[key] = value;
        }
      }
      return result;
    });
    
    // 计数器引用
    const counterReferences = computed(() => {
      const result = {};
      for (const [key, value] of Object.entries(props.action)) {
        if (key.includes('counter_PLUS_')) {
          result[key] = value;
        }
      }
      return result;
    });
    
    // 判断是否有各类引用
    const hasSimpleActions = computed(() => Object.keys(simpleActions.value).length > 0);
    const hasCardReferences = computed(() => Object.keys(cardReferences.value).length > 0);
    const hasLootReferences = computed(() => Object.keys(lootReferences.value).length > 0);
    const hasEventReferences = computed(() => Object.keys(eventReferences.value).length > 0);
    const hasRiteReferences = computed(() => Object.keys(riteReferences.value).length > 0);
    const hasPrompts = computed(() => Object.keys(prompts.value).length > 0);
    const hasOptions = computed(() => Object.keys(options.value).length > 0);
    const hasTableReferences = computed(() => Object.keys(tableReferences.value).length > 0);
    const hasHandReferences = computed(() => Object.keys(handReferences.value).length > 0);
    const hasCounterReferences = computed(() => Object.keys(counterReferences.value).length > 0);
    
    // 格式化键名
    const formatKey = (key) => {
      if (key.startsWith('table.')) {
        return '牌库';
      } else if (key.startsWith('hand_pop.')) {
        return '手牌提示';
      } else if (key.includes('counter_PLUS_')) {
        return '计数器';
      } else if (key === 'card') {
        return '获得卡片';
      } else if (key === 'loot') {
        return '获得战利品';
      } else if (key === 'rite') {
        return '仪式';
      } else if (key.endsWith('.rite')) {
        // 处理带前缀的仪式引用
        const prefix = key.split('.')[0];
        return `${prefix}仪式`;
      } else if (key === 'event') {
        return '事件';
      } else if (key === 'event_on') {
        return '触发事件';
      } else if (key === 'event_off') {
        return '关闭事件';
      } else if (key === 'confirm') {
        return '确认提示';
      }
      return key;
    };
    
    // 格式化值
    const formatValue = (key, value) => {
      return value;
    };
    
    // 判断是否为卡片引用
    const isCardReference = (key) => {
      if (key.startsWith('table.')) {
        const parts = key.split('.');
        return parts.length >= 2 && !isNaN(parseInt(parts[parts.length - 1]));
      } else if (key.startsWith('hand_pop.')) {
        const parts = key.split('.');
        for (const part of parts) {
          const match = part.match(/\d{7}/);
          if (match) return true;
        }
      }
      return false;
    };
    
    // 提取卡片ID
    const extractCardId = (key) => {
      if (key.startsWith('table.')) {
        const parts = key.split('.');
        const lastPart = parts[parts.length - 1];
        const idMatch = lastPart.match(/\d+/);
        return idMatch ? parseInt(idMatch[0]) : null;
      } else if (key.startsWith('hand_pop.')) {
        const match = key.match(/\d{7}/);
        return match ? parseInt(match[0]) : null;
      }
      return null;
    };
    
    // 提取计数器ID
    const extractCounterId = (key) => {
      const match = key.match(/counter_PLUS_(\d+)/);
      return match ? match[1] : null;
    };
    
    // 加载卡片名称
    const loadCardName = async (cardId) => {
      if (!cardNames.value[cardId]) {
        try {
          const cardData = await getCardById(cardId);
          if (cardData) {
            cardNames.value[cardId] = cardData.name || cardData.text || `卡片 #${cardId}`;
          }
        } catch (error) {
          console.error(`加载卡片 ${cardId} 失败:`, error);
          cardNames.value[cardId] = `卡片 #${cardId}`;
        }
      }
    };
    
    // 加载事件或仪式名称
    const loadEventName = async (eventId, type) => {
      let key;
      let namesRef;
      
      if (type === 'rite') {
        key = `rite_${eventId}`;
        namesRef = riteNames;
      } else if (type === 'loot') {
        key = `loot_${eventId}`;
        namesRef = lootNames;
      } else {
        key = eventId;
        namesRef = eventNames;
      }
      
      if (!namesRef.value[key]) {
        try {
          const eventData = await loadEventData(key);
          if (eventData) {
            let prefix = '事件';
            if (type === 'rite') prefix = '仪式: ';
            else if (type === 'loot') prefix = '战利品: ';
            
            namesRef.value[key] = prefix + (eventData.name || eventData.text || `${type} #${eventId}`);
          }
        } catch (error) {
          console.error(`加载${type} ${eventId} 失败:`, error);
          namesRef.value[key] = `${type} #${eventId}`;
        }
      }
    };
    
    // 加载计数器名称
    const loadCounterName = async (counterId) => {
      if (!counterNames.value[counterId]) {
        try {
          const name = await getCommentFromCache(counterId);
          if (name) {
            counterNames.value[counterId] = name;
          } else {
            counterNames.value[counterId] = `计数器 #${counterId}`;
          }
        } catch (error) {
          console.error(`加载计数器 ${counterId} 失败:`, error);
          counterNames.value[counterId] = `计数器 #${counterId}`;
        }
      }
    };
    
    // 显示卡片详情
    const showCardDetails = (cardId) => {
      console.log(`显示卡片详情:`, cardId);
      eventBus.emit('show-card-details', cardId);
    };
    
    // 显示事件详情
    const showEventDetails = (eventId) => {
      console.log(`显示事件详情:`, eventId);
      eventBus2.emit('show-event-details', eventId);
    };
    
    // 显示仪式详情
    const showRiteDetails = (riteId) => {
      console.log(`显示仪式详情:`, riteId);
      eventBus2.emit('show-rite-details', riteId);
    };
    
    // 显示战利品详情
    const showLootDetails = (lootId) => {
      console.log(`显示战利品详情:`, lootId);
      eventBus2.emit('show-loot-details', lootId);
    };
    
    // 加载所有引用的名称
    const loadAllReferences = () => {
      // 加载卡片引用
      for (const [key, value] of Object.entries(cardReferences.value)) {
        if (key && Array.isArray(value)) {
          value.forEach(item => {
            if (typeof item === 'number') {
              loadCardName(item);
            }
          });
        } else if (typeof value === 'number') {
          loadCardName(value);
        }
      }
      
      // 加载表格引用中的卡片
      for (const key of Object.keys(tableReferences.value)) {
        if (isCardReference(key)) {
          const cardId = extractCardId(key);
          if (cardId) {
            loadCardName(cardId);
          }
        }
      }
      
      // 加载手牌引用中的卡片
      for (const key of Object.keys(handReferences.value)) {
        if (isCardReference(key)) {
          const cardId = extractCardId(key);
          if (cardId) {
            loadCardName(cardId);
          }
        }
      }
      
      // 加载事件引用
      for (const [key, value] of Object.entries(eventReferences.value)) {
        if (key && Array.isArray(value)) {
          value.forEach(eventId => {
            loadEventName(eventId, 'event');
          });
        } else if (typeof value === 'number') {
          loadEventName(value, 'event');
        }
      }
      
      // 加载仪式引用
      for (const [key, value] of Object.entries(riteReferences.value)) {
        if (key && Array.isArray(value)) {
          value.forEach(riteId => {
            loadEventName(riteId, 'rite');
          });
        } else if (typeof value === 'number') {
          loadEventName(value, 'rite');
        }
      }
      // 加载战利品引用
      for (const [key, value] of Object.entries(lootReferences.value)) {
        if (key && Array.isArray(value)) {
          value.forEach(lootId => {
            loadEventName(lootId, 'loot');
          });
        } else if (typeof value === 'number') {
          loadEventName(value, 'loot');
        }
      }
      // 加载计数器引用
      for (const key of Object.keys(counterReferences.value)) {
        const counterId = extractCounterId(key);
        if (counterId) {
          loadCounterName(counterId);
        }
      }
    };
    
    // 监听action变化，重新加载引用
    watch(() => props.action, () => {
      loadAllReferences();
    }, { deep: true });
    
    // 组件挂载时加载所有引用
    onMounted(() => {
      loadAllReferences();
    });
    
    return {
      cardNames,
      eventNames,
      riteNames,
      lootNames,
      counterNames,
      simpleActions,
      cardReferences,
      lootReferences,
      eventReferences,
      riteReferences,
      prompts,
      options,
      tableReferences,
      handReferences,
      counterReferences,
      hasSimpleActions,
      hasCardReferences,
      hasLootReferences,
      hasEventReferences,
      hasRiteReferences,
      hasPrompts,
      hasOptions,
      hasTableReferences,
      hasHandReferences,
      hasCounterReferences,
      formatKey,
      formatValue,
      isCardReference,
      extractCardId,
      extractCounterId,
      showCardDetails,
      showEventDetails,
      showRiteDetails,
      showLootDetails
    };
  }
}
</script>

<style scoped>
.action-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.container-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.container-icon {
  font-size: 18px;
  margin-right: 8px;
  color: #ff9800;
}

.container-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.action-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-item, 
.event-reference-item, 
.rite-reference-item,
.card-reference-item,
.loot-reference-item,
.prompt-item,
.option-item,
.table-reference-item,
.hand-reference-item,
.counter-reference-item {
  background-color: #fff;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e0e0e0;
}

.action-key,
.event-reference-header,
.rite-reference-header,
.card-reference-header,
.loot-reference-header,
.prompt-header,
.option-header,
.table-reference-header,
.hand-reference-header,
.counter-reference-header {
  font-weight: 500;
  color: #555;
  margin-bottom: 8px;
  display: block;
}

.action-value {
  color: #333;
}

.event-reference,
.rite-reference,
.card-reference,
.loot-reference,
.table-reference,
.hand-reference,
.counter-reference {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.event-id,
.rite-id,
.card-id,
.loot-id,
.counter-id {
  color: #666;
  font-size: 12px;
}

.event-name,
.rite-name,
.card-name,
.loot-name,
.counter-name {
  color: #333;
}

.event-name.clickable,
.rite-name.clickable,
.card-name.clickable,
.loot-name.clickable {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}

.event-name.clickable:hover,
.rite-name.clickable:hover,
.card-name.clickable:hover,
.loot-name.clickable:hover {
  color: #0d47a1;
}

.event-loading,
.rite-loading,
.card-loading,
.loot-loading {
  font-style: italic;
  color: #666;
  font-size: 12px;
}

.prompt-content,
.option-content {
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.prompt-id,
.prompt-text,
.prompt-icon {
  margin-bottom: 4px;
}

.rite-name {
  color: #7b1fa2;
}

.card-name {
  color: #1976d2;
}

.loot-name {
  color: #ff9800;
}

.counter-name {
  color: #4caf50;
}

.card-reference-array,
.rite-reference-array,
.event-reference-array,
.loot-reference-array {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prompt-confirm-text,
.prompt-cancel-text {
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.prompt-confirm-text {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.prompt-cancel-text {
  background-color: #ffebee;
  color: #c62828;
}
</style>