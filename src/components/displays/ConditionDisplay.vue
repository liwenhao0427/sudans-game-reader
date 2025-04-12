<template>
  <div class="condition-container" v-if="Object.keys(this.condition).length > 0">
    <div class="container-header">
      <span class="container-icon">🔍</span>
      <span class="container-title">条件</span>
    </div>
    <div class="condition-content">
      <div v-if="isSimpleCondition" class="simple-condition">
        <div v-for="(value, key) in condition" :key="key" class="condition-item">
          <span class="condition-key">{{ formatKey(key) }}</span>
          <span class="condition-value">
            <!-- 处理仪式条件，添加点击查看详情 -->
            <template v-if="key.includes('rite')">
              <span class="clickable" @click="showRiteDetails(typeof value === 'number' ? value : key.replace(/^(!)?rite/, '').replace(/^\./, ''))">
                {{ riteCache[value]  || 'rite_' + value }} 
              </span>
            </template>
            <!-- 处理卡片拥有条件，添加点击查看详情 -->
            <template v-else-if="key.includes('have')">
              <span class="clickable" @click="showCardDetails(getCardIdFromKey(key))">
                {{ formatValue(key, value) }}
              </span>
            </template>
            <!-- 其他条件 -->
            <template v-else>
              {{ formatValue(key, value) }}
            </template>
          </span>
        </div>
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
        <div v-if="Object.keys(getOtherConditions(condition)).length > 0" class="other-conditions">
          <div v-for="(value, key) in getOtherConditions(condition)" :key="key" class="condition-item">
            <span class="condition-key">{{ formatKey(key) }}</span>
            <span class="condition-value">
              <!-- 处理仪式条件，添加点击查看详情 -->
              <template v-if="key.includes('rite')">
                <span class="clickable" @click="showRiteDetails(typeof value === 'number' ? value : key.replace(/^(!)?rite/, '').replace(/^\./, ''))">
                  {{ formatValue(key, value) }}
                </span>
              </template>
              <!-- 处理卡片拥有条件，添加点击查看详情 -->
              <template v-else-if="key.includes('have')">
                <span class="clickable" @click="showCardDetails(getCardIdFromKey(key))">
                  {{ formatValue(key, value) }}
                </span>
              </template>
              <!-- 其他条件 -->
              <template v-else>
                {{ formatValue(key, value) }}
              </template>
            </span>
          </div>
        </div>
      </div>
      
      <!-- 特殊条件显示 -->
      <div v-else-if="hasSpecialCondition" class="special-condition">
        <div v-if="condition.is" class="condition-item">
          <span class="condition-key">需要卡片</span>
          <span class="condition-value card-value">
            <span class="card-id">#{{ condition.is }}</span>
            <span v-if="cardName" class="card-name clickable" @click="showCardDetails(condition.is)">{{ cardName }}</span>
            <span v-else class="card-loading">加载中...</span>
          </span>
        </div>
        <div v-if="condition.type" class="condition-item">
          <span class="condition-key">需要类型</span>
          <span class="condition-value">{{ formatCardType(condition.type) }}</span>
        </div>
        <div v-if="condition.any" class="condition-item">
          <span class="condition-key">任意满足</span>
          <div class="any-conditions">
            <div v-for="(val, key) in condition.any" :key="key" class="any-condition-item">
              <span v-if="key === 'is'">
                {{ formatKey(key) }}: 
                <span class="card-value">
                  <span class="card-id">#{{ val }}</span>
                  <span v-if="anyCardNames[val]" class="card-name clickable" @click="showCardDetails(val)">
                    {{ anyCardNames[val] }}
                  </span>
                  <span v-else class="card-loading">加载中...</span>
                </span>
              </span>
              <span v-else>{{ formatKey(key) }}: {{ formatValue(key, val) }}</span>
            </div>
          </div>
        </div>
        <div v-for="(value, key) in getSlotRestrictions(condition)" :key="key" class="condition-item">
          <span class="condition-key">{{ formatSlotRestriction(key) }}</span>
          <span class="condition-value">{{ value }}</span>
        </div>
        <div v-for="(value, key) in getOtherConditions(condition)" :key="key" class="condition-item">
          <span class="condition-key">{{ formatKey(key) }}</span>
          <span class="condition-value">{{ formatValue(key, value) }}</span>
        </div>
      </div>
      <div v-if="shouldShowJson" class="complex-condition">
        <pre>{{ JSON.stringify(condition, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import { loadCardsData, getCommentFromCache, loadEventData } from '@/services/eventService';
import { eventBus } from '@/components/CardDetailsModal.vue';
import eventBus2 from '@/utils/eventBus';

export default {
  name: 'ConditionDisplay',
  // 添加自引用以支持递归显示
  components: {
    ConditionDisplay: () => import('./ConditionDisplay.vue')
  },
  props: {
    condition: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      cardName: null,
      cardsData: null,
      anyCardNames: {}, // 存储any条件中卡片的名称
      counterCache: {}, // 存储counter的缓存文本
      cardCache: {}, // 存储卡片名称缓存
      riteCache: {} // 存储仪式名称缓存
    };
  },
  computed: {
    isSimpleCondition() {
      // 判断是否为简单条件（没有嵌套对象且没有特殊条件）
      return !Object.values(this.condition).some(value => typeof value === 'object' && value !== null) 
        && !this.hasSpecialKeys;
    },
    hasSpecialCondition() {
      // 判断是否包含特殊条件
      return this.hasSpecialKeys && !this.isComplexCondition;
    },
    hasSpecialKeys() {
      // 检查是否包含特殊键
      const specialKeys = ['is', 'type', 'any'];
      return specialKeys.some(key => key in this.condition) || 
        Object.keys(this.condition).some(key => 
          key.startsWith('!s') || 
          key.startsWith('s') || 
          key.startsWith('r') || // 添加对r开头的键的检查
          key === 'round_begin_ba'
        );
    },
    isComplexCondition() {
      // 判断是否为复杂条件（包含深层嵌套）
      return Object.values(this.condition).some(value => {
        return typeof value === 'object' && value !== null && 
          !(value instanceof Array) && 
          Object.keys(value).length > 3; // 如果对象属性超过3个，视为复杂对象
      });
    },
    
    // 添加新的计算属性来检测递归条件
    hasRecursiveConditions() {
      return this.condition && (this.condition.all || this.condition.any);
    },
    
    // 添加新的计算属性来检测是否应该显示JSON
    shouldShowJson() {
      // 如果条件为空对象或者其他条件都不满足，则显示JSON
      return !this.isSimpleCondition && 
              !this.condition.all &&
              !this.condition.is &&
              !this.condition.type &&
              !this.condition.any &&
              Object.keys(this.getOtherConditions(this.condition)).length === 0 &&
              Object.keys(this.getSlotRestrictions(this.condition)).length === 0 &&
             !this.hasRecursiveConditions &&
             !this.isComplexCondition ||
             Object.keys(this.condition).length === 0;
    }
  },
  methods: {
    // 显示仪式详情
    showRiteDetails(riteId) {
      console.log(`显示仪式详情:`, riteId);
      // 使用事件总线触发显示仪式详情事件
      eventBus2.emit('show-rite-details', riteId);
    },
    formatKey(key) {
      // 格式化条件键
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
      } else if (key.startsWith('rite') || key.startsWith('!rite')) {
        // 处理仪式条件
        const isNegated = key.startsWith('!');
        // const riteId = key.replace(/^(!)?rite/, '').replace(/^\./, '');
        return isNegated ? `仪式未开启` : `仪式已开启`;
      } else if (key.startsWith('have.') || key.startsWith('!have.')) {
        // 处理拥有卡片条件
        const isNegated = key.startsWith('!');
        const cardInfo = key.replace(/^(!)?have\./, '').split('.');
        // const cardId = cardInfo[0];
        const cardDesc = cardInfo.length > 1 ? cardInfo[1] : '';
        return isNegated ? `未拥有卡片${cardDesc ? ` ${cardDesc}` : ''}` : `拥有卡片${cardDesc ? ` ${cardDesc}` : ''}`;
      } else if (key.startsWith('hand_have.') || key.startsWith('!hand_have.')) {
        // 处理手牌中的卡片条件
        const isNegated = key.startsWith('!');
        // const cardId = key.replace(/^(!)?hand_have\./, '');
        return isNegated ? `手牌中没有` : `手牌中有`;
      } else if (key.startsWith('table_have.') || key.startsWith('!table_have.')) {
        // 处理牌库中的卡片条件
        const isNegated = key.startsWith('!');
        // const cardId = key.replace(/^(!)?table_have\./, '');
        return isNegated ? `牌库中没有` : `牌库中有`;
      } else if (key.startsWith('counter.')) {
        // 处理counter类型的条件
        const counterMatch = key.match(/counter\.(\d+)([<>=]+)/);
        if (counterMatch) {
          const counterId = counterMatch[1];
          const operator = counterMatch[2];
          
          // 尝试从缓存获取counter的注释文本
          const cachedText = this.getCounterText(counterId, operator);
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
      }  else if (key.startsWith('f:rare-s') && key.includes('.rare')) {
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
    },
    
    // 添加获取counter缓存文本的方法
    getCounterText(counterId, operator) {
      // 先尝试获取完整键名的缓存 (例如: "7000420>=")
      const fullKey = `${counterId}${operator}`;
      
      // 检查本地缓存
      if (this.counterCache[fullKey]) {
        return this.counterCache[fullKey];
      }
      
      // 从localStorage获取
      let cachedText = getCommentFromCache(fullKey);
      if (!cachedText) {
        // 如果没有找到完整键名的缓存，尝试获取基础键的缓存
        cachedText = getCommentFromCache(counterId);
      }
      
      // 存储到本地缓存
      if (cachedText) {
        this.counterCache[fullKey] = cachedText;
      }
      
      return cachedText;
    },
    formatValue(key, value) {
      // 格式化条件值
      if (key === 'is' && this.cardName) {
        return `${this.cardName} (ID: ${value})`;
      } else if (key.startsWith('rite') || key.startsWith('!rite')) {
        // 处理仪式值，显示仪式名称
        const riteId = typeof value === 'number' ? value : key.replace(/^(!)?rite/, '').replace(/^\./, '');
        const riteName = this.getRiteName(riteId);
        return riteName ? `${riteName} (#${riteId})` : `仪式 #${riteId}`;
      } else if (key.startsWith('have.') || key.startsWith('!have.') || 
                 key.startsWith('hand_have.') || key.startsWith('!hand_have.') ||
                 key.startsWith('table_have.') || key.startsWith('!table_have.')) {
        // 处理卡片值，显示卡片名称
        const cardId = this.getCardIdFromKey(key);
        const cardName = this.getCardName(cardId);
        return cardName ? `${cardName} (#${cardId})` : `卡片 #${cardId}`;
      } else if (key === 'type') {
        return this.formatCardType(value);
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
    },
    // 从键中提取卡片ID
    getCardIdFromKey(key) {
      if (key.startsWith('have.') || key.startsWith('!have.')) {
        return key.replace(/^(!)?have\./, '').split('.')[0];
      } else if (key.startsWith('hand_have.') || key.startsWith('!hand_have.')) {
        return key.replace(/^(!)?hand_have\./, '');
      } else if (key.startsWith('table_have.') || key.startsWith('!table_have.')) {
        return key.replace(/^(!)?table_have\./, '');
      }
      return null;
    },
    
    // 获取卡片名称
    getCardName(cardId) {
      if (!cardId) return null;
      
      // 检查缓存
      if (this.cardCache[cardId]) {
        return this.cardCache[cardId];
      }
      
      // 异步加载卡片名称
      this.loadSingleCardInfo(cardId, (name) => {
        this.cardCache[cardId] = name;
      });
      
      return this.cardCache[cardId] || null;
    },
    
    // 获取仪式名称
    getRiteName(riteId) {
      if (!riteId) return null;
      
      // 检查缓存
      if (this.riteCache[riteId]) {
        return this.riteCache[riteId];
      }
      
      // 异步加载仪式名称
      this.loadRiteInfo(riteId);
      
      return this.riteCache[riteId] || null;
    },
    
    // 加载仪式信息
    async loadRiteInfo(riteId) {
      try {
        const eventsData = await loadEventData(riteId, 'rite');
        if (eventsData && eventsData.rites) {
          const rite = eventsData.rites.find(r => r.id === parseInt(riteId) || r.id === riteId);
          if (rite) {
            this.riteCache[riteId] = rite.name || rite.text || `仪式 #${riteId}`;
          } else {
            this.riteCache[riteId] = `未知仪式 #${riteId}`;
          }
        }
      } catch (error) {
        console.error('加载仪式信息失败:', error);
        this.riteCache[riteId] = `加载失败 #${riteId}`;
      }
    },
    
    formatCardType(type) {
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
    },
    formatSlotRestriction(key) {
      // 格式化卡槽限制
      if (key.startsWith('!s')) {
        const slotNum = key.substring(2);
        return `不能与卡位 ${slotNum} 同时填入`;
      } else if (key.startsWith('s')) {
        const slotNum = key.substring(1);
        return `卡位 ${slotNum}`;
      }
      return key;
    },
    getSlotRestrictions(condition) {
      // 获取所有卡槽限制条件
      const restrictions = {};
      Object.entries(condition).forEach(([key, value]) => {
        if ((key.startsWith('!s') || key.startsWith('s')) && /^(!)?s\d+$/.test(key)) {
          restrictions[key] = value;
        }
      });
      return restrictions;
    },
    getOtherConditions(condition) {
      // 获取其他非特殊条件
      const specialKeys = ['is', 'type', 'any', 'all'];
      const others = {};
      Object.entries(condition).forEach(([key, value]) => {
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
    },
    async loadCardInfo() {
      // 加载主条件中的卡片
      if (this.condition && this.condition.is) {
        await this.loadSingleCardInfo(this.condition.is, (name) => {
          this.cardName = name;
        });
      }
      
      // 加载any条件中的卡片
      if (this.condition && this.condition.any && this.condition.any.is) {
        await this.loadSingleCardInfo(this.condition.any.is, (name) => {
          // 在 Vue 3 中直接赋值即可，不需要使用 $set
          this.anyCardNames[this.condition.any.is] = name;
        });
      }
    },
    async loadSingleCardInfo(cardId, setNameCallback) {
      try {
        if (!this.cardsData) {
          this.cardsData = await loadCardsData();
        }
        
        // 修复：处理cardsData可能是对象而非数组的情况
        let card = null;
        
        if (Array.isArray(this.cardsData)) {
          // 如果是数组，使用find方法
          card = this.cardsData.find(c => c.id === cardId || c.id === parseInt(cardId));
        } else if (typeof this.cardsData === 'object') {
          // 如果是对象，直接通过键查找或遍历对象
          card = this.cardsData[cardId] || this.cardsData[cardId.toString()];
          
          // 如果直接查找不到，遍历对象
          if (!card) {
            for (const key in this.cardsData) {
              const item = this.cardsData[key];
              if (item.id === cardId || item.id === parseInt(cardId)) {
                card = item;
                break;
              }
            }
          }
        }
        
        if (card) {
          setNameCallback(card.name || card.text || `卡片 #${cardId}`);
        } else {
          setNameCallback(`未知卡片 #${cardId}`);
        }
      } catch (error) {
        console.error('加载卡片信息失败:', cardId, error);
        setNameCallback(`加载失败 #${cardId}`);
      }
    },
    showCardDetails(cardId) {
      // Use the event bus instead of $root
      eventBus.emit('show-card-details', cardId);
    }
  },
  mounted() {
    this.loadCardInfo();
  },
  watch: {
    'condition.is': function() {
      this.loadCardInfo();
    },
    'condition.any': {
      handler: function(newAny) {
        if (newAny && newAny.is) {
          this.loadSingleCardInfo(newAny.is, (name) => {
            // 在 Vue 3 中直接赋值即可，不需要使用 $set
            this.anyCardNames[newAny.is] = name;
          });
        }
      },
      deep: true
    }
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

.card-value {
  display: flex;
  align-items: center;
}

.card-id {
  color: #909399;
  font-size: 0.9em;
  margin-right: 5px;
}

.card-name {
  font-weight: 500;
  color: #409eff;
}

.card-name.clickable {
  cursor: pointer;
  text-decoration: underline;
}

.card-name.clickable:hover {
  color: #66b1ff;
}

.card-loading {
  font-style: italic;
  color: #909399;
}

.any-conditions {
  margin-top: 5px;
}

.any-condition-item {
  padding: 3px 6px;
  background-color: #f5f7fa;
  border-radius: 3px;
  margin-bottom: 3px;
  font-size: 0.9em;
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

.clickable {
  cursor: pointer;
  color: #409eff;
  text-decoration: underline;
}

.clickable:hover {
  color: #66b1ff;
}
</style>