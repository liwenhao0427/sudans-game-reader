<template>
  <div class="result-container" v-if="Object.keys(this.result).length > 0">
    <div class="container-header">
      <span class="container-icon">✅</span>
      <span class="container-title">结果</span>
    </div>
    <div class="result-content">
      <!-- 卡片结果 -->
      <div v-if="hasCards" class="result-section">
        <div class="section-title">获得卡片</div>
        <div class="cards-grid">
          <div v-for="(cardId, index) in cards" :key="index" class="card-item">
            <span class="card-id">#{{ cardId }}</span>
            <span v-if="cardNames[cardId]" class="card-name clickable" @click="showCardDetails(cardId)">
              {{ cardNames[cardId] }}
            </span>
            <span v-else class="card-loading">加载中...</span>
          </div>
        </div>
      </div>
      
      <!-- 战利品结果 -->
      <div v-if="hasLoots" class="result-section">
        <div class="section-title">获得战利品</div>
        <div class="loots-grid">
          <div v-for="(lootId, index) in loots" :key="index" class="loot-item">
            <span class="loot-id">#{{ lootId }}</span>
            <span v-if="lootNames[lootId]" class="loot-name clickable" @click="showLootDetails(lootId)">
              {{ lootNames[lootId] }}
            </span>
            <span v-else class="loot-loading">加载中...</span>
          </div>
        </div>
      </div>
      
      <!-- 计数器操作 -->
      <div v-if="hasCounters" class="result-section">
        <div class="section-title">计数器操作</div>
        <div class="counters-grid">
          <div v-for="(counter, index) in counters" :key="index" class="counter-item">
            <span class="counter-operation">{{ counter.operation }}</span>
            <span class="counter-id">{{ getCounterText(counter.id) }}</span>
            <span class="counter-value">{{ counter.value }}</span>
          </div>
        </div>
      </div>
      
      <!-- 卡位属性操作 -->
      <div v-if="hasSlotAttributes" class="result-section">
        <div class="section-title">卡位属性变化</div>
        <div class="slot-attributes-grid">
          <div v-for="(attr, index) in slotAttributes" :key="index" class="slot-attribute-item clickable" @click="showSlotDetails(attr.slot)">
            <span class="slot-number">卡位 {{ attr.slot }}</span>
            <span v-if="slotInfoCache[`s${attr.slot}`] && slotInfoCache[`s${attr.slot}`].text" class="slot-description">
              {{ slotInfoCache[`s${attr.slot}`].text }}
            </span>
            <div class="attribute-details">
              <span class="attribute-name">{{ attr.attribute }}</span>
              <span class="attribute-operation">{{ attr.operation === 'PLUS' ? '增加' : attr.operation === 'EQUALS' ? '设置为' : attr.operation }}</span>
              <span class="attribute-value">{{ attr.value }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 卡位操作 -->
      <div v-if="hasSlotOperations" class="result-section">
        <div class="section-title">卡位操作</div>
        <div class="slots-grid">
          <div v-for="(slot, index) in slotOperations" :key="index" class="slot-item clickable" @click="showSlotDetails(slot.slot)">
            <span class="slot-id">{{ slot.slot }}</span>
            <span v-if="slotInfoCache[slot.slot] && slotInfoCache[slot.slot].text" class="slot-description">
              {{ slotInfoCache[slot.slot].text }}
            </span>
            <div class="operation-details">
              <span class="slot-operation">{{ slot.operation }}</span>
              <span v-if="slot.card" class="slot-card">{{ slot.card }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 资源操作 -->
      <div v-if="hasResources" class="result-section">
        <div class="section-title">资源变化</div>
        <div class="resources-grid">
          <div v-for="(resource, key) in resources" :key="key" class="resource-item">
            <span class="resource-name">{{ formatResourceName(key) }}</span>
            <span class="resource-value">{{ resource > 0 ? '+' : '' }}{{ resource }}</span>
          </div>
        </div>
      </div>
      
      <!-- 选项 -->
      <div v-if="hasChoices" class="result-section">
        <div class="section-title">选项</div>
        <div class="choices-container">
          <div v-for="(choice, key) in choices" :key="key" class="choice-item">
            <span class="choice-key">{{ key }}</span>
            <span class="choice-value">{{ choice }}</span>
          </div>
        </div>
      </div>
      
      <!-- 其他结果 -->
      <div v-if="hasOthers" class="result-section">
        <div class="section-title">其他结果</div>
        <div class="others-grid">
          <div v-for="(value, key) in others" :key="key" class="other-item">
            <span class="other-key">{{ formatKey(key) }}</span>
            <span class="other-value">{{ formatValue(value) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 修改导入语句
import { getCardById, loadEventData, getCommentFromCache, getRiteSlotInfo } from '@/services/eventService';
import eventBus from '@/utils/eventBus';

export default {
  name: 'ResultDisplay',
  props: {
    result: {
      type: Object,
      required: true
    },
    riteId: {
      type: [String, Number],
      default: null
    }
  },
  data() {
    return {
      cardNames: {},
      lootNames: {},
      counterCache: {}, // 添加counter缓存对象
      slotInfoCache: {} // 添加卡位信息缓存
    };
  },
  computed: {
    // 提取卡片
    cards() {
      const cards = [];
      if (this.result.card) {
        if (Array.isArray(this.result.card)) {
          cards.push(...this.result.card.filter(c => typeof c === 'number'));
        } else if (typeof this.result.card === 'number') {
          cards.push(this.result.card);
        }
      }
      return cards;
    },
    hasCards() {
      return this.cards.length > 0;
    },
    
    // 提取战利品
    loots() {
      const loots = [];
      if (this.result.loot) {
        if (Array.isArray(this.result.loot)) {
          loots.push(...this.result.loot.filter(l => typeof l === 'number'));
        } else if (typeof this.result.loot === 'number') {
          loots.push(this.result.loot);
        }
      }
      return loots;
    },
    hasLoots() {
      return this.loots.length > 0;
    },
    
    // 提取计数器操作
    counters() {
      const counters = [];
      
      Object.entries(this.result).forEach(([key, value]) => {
        // 处理 counter_PLUS_7000467 和 counter_EQUALS_7000465 格式
        const plusMatch = key.match(/counter_PLUS_(\d+)/);
        const equalsMatch = key.match(/counter_EQUALS_(\d+)/);
        
        if (plusMatch) {
          counters.push({
            operation: '增加',
            id: plusMatch[1],
            value: value
          });
        } else if (equalsMatch) {
          counters.push({
            operation: '设置为',
            id: equalsMatch[1],
            value: value
          });
        } else if (key.startsWith('counter+')) {
          counters.push({
            operation: '增加',
            id: key.slice(8),
            value: value
          });
        } else if (key.startsWith('counter-')) {
          counters.push({
            operation: '减少',
            id: key.slice(8),
            value: value
          });
        } else if (key.startsWith('counter=')) {
          counters.push({
            operation: '设置为',
            id: key.slice(8),
            value: value
          });
        } else if (key.startsWith('global_counter+')) {
          counters.push({
            operation: '增加全局',
            id: key.slice(15),
            value: value
          });
        } else if (key.startsWith('global_counter-')) {
          counters.push({
            operation: '减少全局',
            id: key.slice(15),
            value: value
          });
        } else if (key.startsWith('global_counter=')) {
          counters.push({
            operation: '设置全局为',
            id: key.slice(15),
            value: value
          });
        }
      });
      
      return counters;
    },
    hasCounters() {
      return this.counters.length > 0;
    },
    
    // 提取卡位属性操作 (s1_PLUS_体魄 等)
    slotAttributes() {
      const attributes = [];
      
      Object.entries(this.result).forEach(([key, value]) => {
        // 匹配 s1_PLUS_体魄 格式
        const slotAttrMatch = key.match(/s(\d+)_([A-Z]+)_(.+)/);
        if (slotAttrMatch) {
          attributes.push({
            slot: slotAttrMatch[1],
            operation: slotAttrMatch[2],
            attribute: slotAttrMatch[3],
            value: value
          });
        }
      });
      
      return attributes;
    },
    hasSlotAttributes() {
      return this.slotAttributes.length > 0;
    },
    
    // 提取卡位操作
    slotOperations() {
      const operations = [];
      
      Object.entries(this.result).forEach(([key, value]) => {
        if (key.startsWith('s') && key.includes('+') && !key.includes('_PLUS_')) {
          const [slot, card] = key.split('+');
          operations.push({
            operation: '添加',
            slot: slot,
            card: card,
            value: value
          });
        } else if (key.startsWith('s') && key.includes('-') && !key.includes('_')) {
          const [slot, card] = key.split('-');
          operations.push({
            operation: '移除',
            slot: slot,
            card: card,
            value: value
          });
        } else if (key.startsWith('clean.s')) {
          operations.push({
            operation: '清空',
            slot: key.slice(6),
            value: value
          });
        }
      });
      
      return operations;
    },
    hasSlotOperations() {
      return this.slotOperations.length > 0;
    },
    
    // 提取资源变化
    resources() {
      const resourceKeys = ['coin', 'gold', 'food', 'water', 'energy', 'health', 'sanity'];
      return Object.entries(this.result)
        .filter(([key]) => resourceKeys.includes(key))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    },
    hasResources() {
      return Object.keys(this.resources).length > 0;
    },
    
    // 提取选项
    choices() {
      if (this.result.choose && typeof this.result.choose === 'object') {
        return this.result.choose;
      }
      return {};
    },
    hasChoices() {
      return Object.keys(this.choices).length > 0;
    },
    
    // 其他结果
    others() {
      const excludeKeys = [
        'card', 'loot', 'choose', 
        ...Object.keys(this.resources),
        ...this.counters.map(c => {
          if (c.operation === '增加') return `counter+${c.id}`;
          if (c.operation === '减少') return `counter-${c.id}`;
          if (c.operation === '设置为') return `counter=${c.id}`;
          if (c.operation === '增加全局') return `global_counter+${c.id}`;
          if (c.operation === '减少全局') return `global_counter-${c.id}`;
          if (c.operation === '设置全局为') return `global_counter=${c.id}`;
          return `counter_${c.operation === '增加' ? 'PLUS' : 'EQUALS'}_${c.id}`;
        }),
        ...this.slotAttributes.map(a => `s${a.slot}_${a.operation}_${a.attribute}`),
        ...this.slotOperations.map(s => s.operation === '清空' ? `clean.${s.slot}` : `${s.slot}${s.operation === '添加' ? '+' : '-'}${s.card}`)
      ];
      
      return Object.entries(this.result)
        .filter(([key]) => !excludeKeys.includes(key) && 
                          !key.match(/counter_PLUS_\d+/) && 
                          !key.match(/counter_EQUALS_\d+/) && 
                          !key.match(/s\d+_[A-Z]+_.+/) && 
                          !key.startsWith('counter') && 
                          !key.startsWith('global_counter') && 
                          !key.startsWith('s') && 
                          !key.startsWith('clean.s'))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    },
    hasOthers() {
      return Object.keys(this.others).length > 0;
    }
  },
  methods: {
    // 添加获取counter缓存文本的方法
    getCounterText(counterId) {
      // 检查本地缓存
      if (this.counterCache[counterId]) {
        return this.counterCache[counterId];
      }
      
      // 从localStorage获取
      const cachedText = getCommentFromCache(counterId);
      
      // 存储到本地缓存
      if (cachedText) {
        this.counterCache[counterId] = cachedText;
      }
      
      return cachedText || `计数器 #${counterId}`;
    },
    formatKey(key) {
      // 格式化结果键
      const keyMap = {
        'failed': '失败结果',
        'success': '成功结果',
        'think_pop': '思考选项',
        'table': '表格',
        'table.clean': '清除表格'
      };
      
      if (keyMap[key]) {
        return keyMap[key];
      }
      
      return key;
    },
    formatValue(value) {
      // 格式化结果值
      if (typeof value === 'boolean') {
        return value ? '是' : '否';
      } else if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value;
    },
    formatResourceName(key) {
      const resourceMap = {
        'coin': '金币',
        'gold': '金币',
      };
      
      return resourceMap[key] || key;
    },
    async loadCardInfo(cardId) {
      try {
        const cardData = await getCardById(cardId);
        if (cardData) {
          this.cardNames[cardId] = cardData.name || `卡片 #${cardId}`;
        } else {
          this.cardNames[cardId] = `未知卡片 #${cardId}`;
        }
      } catch (error) {
        console.error('加载卡片信息失败:',cardId, error);
        this.cardNames[cardId] = `加载失败 #${cardId}`;
      }
    },
    async loadLootInfo(lootId) {
      try {
        const lootData = await loadEventData(lootId, 'loot');
        if (lootData) {
          this.lootNames[lootId] = lootData.name || `战利品 #${lootId}`;
        } else {
          this.lootNames[lootId] = `未知战利品 #${lootId}`;
        }
      } catch (error) {
        console.error('加载战利品信息失败:', error);
        this.lootNames[lootId] = `加载失败 #${lootId}`;
      }
    },
    showCardDetails(cardId) {
      eventBus.emit('show-card-details', cardId);
    },
    showLootDetails(lootId) {
      eventBus.emit('show-loot-details', lootId);
    },
    // 显示卡位详情
    async showSlotDetails(slotId) {
      // 如果没有仪式ID，无法显示卡位详情
      if (!this.riteId) {
        console.warn('无法显示卡位详情：未提供仪式ID');
        return;
      }
      
      try {
        // 尝试获取卡位信息
        let slotInfo = this.slotInfoCache[slotId];
        console.log('显示卡位详情:', slotInfo);
        
        if (!slotInfo) {
          slotInfo = await getRiteSlotInfo(this.riteId, slotId);
          console.log('显示卡位详情:', slotInfo);
          
          if (slotInfo) {
            // 缓存卡位信息
            this.slotInfoCache[slotId] = slotInfo;
          } else {
            console.error(`无法获取卡位 ${slotId} 的信息`);
            return;
          }
        }
        
        // 使用eventBus触发显示卡位详情的事件
        eventBus.emit('show-slot-details', {
          slotId: slotId,
          riteId: this.riteId,
          slotInfo: slotInfo
        });
      } catch (error) {
        console.error(`显示卡位 ${slotId} 详情失败:`, error);
      }
    },
    
    loadAllReferences() {
      // 加载所有卡片和战利品引用
      this.cards.forEach(cardId => {
        if (!this.cardNames[cardId]) {
          this.loadCardInfo(cardId);
        }
      });
      
      this.loots.forEach(lootId => {
        if (!this.lootNames[lootId]) {
          this.loadLootInfo(lootId);
        }
      });
      
      // 预加载卡位信息
      if (this.riteId) {
        // 预加载卡位属性操作中的卡位
        this.slotAttributes.forEach(attr => {
          const slotId = `s${attr.slot}`;
          if (!this.slotInfoCache[slotId]) {
            this.preloadSlotInfo(slotId);
          }
        });
        
        // 预加载卡位操作中的卡位
        this.slotOperations.forEach(op => {
          if (!this.slotInfoCache[op.slot]) {
            this.preloadSlotInfo(op.slot);
          }
        });
      }
    },
    
    // 预加载卡位信息
    async preloadSlotInfo(slotId) {
      try {
        const slotInfo = await getRiteSlotInfo(this.riteId, slotId);
        if (slotInfo) {
          this.slotInfoCache[slotId] = slotInfo;
        }
      } catch (error) {
        console.error(`预加载卡位 ${slotId} 信息失败:`, error);
      }
    }
  },
  mounted() {
    this.loadAllReferences();
  },
  watch: {
    result: {
      handler() {
        this.loadAllReferences();
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.result-container {
  margin-top: 15px;
  padding: 12px;
  border-radius: 6px;
  background-color: #f0f9eb;
  border: 1px solid #c2e7b0;
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
  color: #67c23a;
}

.result-section {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #c2e7b0;
}

.result-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #67c23a;
  font-size: 14px;
}

.cards-grid, .loots-grid, .counters-grid, .slots-grid, .resources-grid, .others-grid, .slot-attributes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.card-item, .loot-item, .counter-item, .slot-item, .resource-item, .other-item, .choice-item, .slot-attribute-item {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.card-id, .loot-id, .counter-id {
  color: #909399;
  font-size: 0.9em;
  margin-bottom: 4px;
}

.card-name, .loot-name {
  font-weight: 500;
  color: #409eff;
}

.card-name.clickable, .loot-name.clickable {
  cursor: pointer;
  text-decoration: underline;
}

.card-name.clickable:hover, .loot-name.clickable:hover {
  color: #66b1ff;
}

.card-loading, .loot-loading {
  font-style: italic;
  color: #909399;
}

.counter-operation, .slot-operation {
  font-weight: bold;
  color: #606266;
  margin-bottom: 4px;
}

.counter-value, .slot-card {
  color: #333;
}

.resource-name, .other-key, .choice-key {
  font-weight: bold;
  margin-bottom: 4px;
  color: #606266;
}

.resource-value, .other-value, .choice-value {
  color: #333;
}

.resource-value {
  font-weight: bold;
}

.choices-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.choice-item {
  padding: 10px;
}

.choice-value {
  white-space: pre-line;
  line-height: 1.5;
}

/* 新增卡位属性样式 */
.slot-number {
  font-weight: bold;
  color: #606266;
  margin-bottom: 4px;
}

.slot-description {
  color: #606266;
  font-size: 0.9em;
  margin-bottom: 8px;
  font-style: italic;
  line-height: 1.4;
  max-height: 60px;
  overflow-y: auto;
  padding-right: 5px;
}

.attribute-details, .operation-details {
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  margin-top: 4px;
}

.attribute-name {
  color: #409eff;
  margin-bottom: 4px;
}

.attribute-operation {
  color: #67c23a;
  margin-bottom: 4px;
}

.attribute-value {
  font-weight: bold;
  color: #333;
}

.card-name.clickable, .loot-name.clickable, .slot-attribute-item.clickable, .slot-item.clickable {
  cursor: pointer;
}

.card-name.clickable:hover, .loot-name.clickable:hover {
  color: #66b1ff;
}

.slot-attribute-item.clickable:hover, .slot-item.clickable:hover {
  background-color: #f5f7fa;
  border-color: #c6e2ff;
}

.card-loading, .loot-loading {
  font-style: italic;
  color: #909399;
}

.counter-operation, .slot-operation {
  font-weight: bold;
  color: #606266;
  margin-bottom: 4px;
}

.counter-value, .slot-card {
  color: #333;
}

.resource-name, .other-key, .choice-key {
  font-weight: bold;
  margin-bottom: 4px;
  color: #606266;
}

.resource-value, .other-value, .choice-value {
  color: #333;
}

.resource-value {
  font-weight: bold;
}

.choices-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.choice-item {
  padding: 10px;
}

.choice-value {
  white-space: pre-line;
  line-height: 1.5;
}
</style>