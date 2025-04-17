<template>
  <div class="card-details-modal" v-if="visible" @click.self="close" :style="{ zIndex: modalZIndex }" @mousedown="bringToFront">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ card ? (card.name || '未命名卡片') : '加载中...' }}</h3>
        <div class="header-buttons">
          <button class="json-button" @click="showJsonData = !showJsonData">
            {{ showJsonData ? '隐藏JSON' : '查看JSON' }}
          </button>
          <button class="close-button" @click="close">×</button>
        </div>
      </div>
      <div class="modal-body" v-if="card">
        <!-- JSON数据显示区域 -->
        <div class="json-data" v-if="showJsonData">
          <pre>{{ JSON.stringify(card, null, 2) }}</pre>
        </div>
        
        <div class="card-info" v-else>
          <!-- 基本信息 -->
          <div class="card-basic-info">
            <div class="card-title" v-if="card.title">{{ card.title }}</div>
            <div class="card-meta">
              <span class="card-id">ID: {{ card.id }}</span>
              <span class="card-type">类型: {{ formatCardType(card.type) }}</span>
              <span class="card-rare" v-if="card.rare !== undefined">稀有度: {{ card.rare }}</span>
            </div>
          </div>
          
          <!-- 卡片描述 -->
          <div class="card-text" v-if="card.text">{{ card.text }}</div>
          
          <!-- 标签信息 -->
          <div class="card-tags" v-if="card.tag && Object.keys(card.tag).length > 0">
            <div class="tags-title">标签:</div>
            <div class="tags-container">
              <span v-for="(value, key) in card.tag" :key="key" class="tag-item" 
                    :class="getTagClass(key, value)">
                {{ key }}{{ attributeTags.includes(key) ? ': ' + value : (value !== 1 ? ': ' + value : '') }}
              </span>
            </div>
          </div>
          
          <!-- 装备槽 -->
          <div class="card-equips" v-if="card.equips && card.equips.length > 0">
            <div class="equips-title">装备槽:</div>
            <div class="equips-container">
              <span v-for="(equip, index) in card.equips" :key="index" class="equip-item">
                {{ equip }}
              </span>
            </div>
          </div>
          
          <!-- 卡槽条件 -->
          <div class="card-slots" v-if="hasSlotConditions">
            <div class="slots-title">卡槽条件:</div>
            <div class="slots-container">
              <div v-for="(condition, index) in formatSlotConditions" :key="index" class="slot-item">
                <span class="slot-name">{{ condition.name }}</span>
                <span class="slot-value">{{ condition.value }}</span>
              </div>
            </div>
          </div>
          
          <!-- 其他属性 -->
          <div class="card-other-props" v-if="hasOtherProps">
            <div class="props-title">其他属性:</div>
            <div class="props-list">
              <div v-for="(value, key) in otherProps" :key="key" class="prop-item">
                <span class="prop-name">{{ formatPropName(key) }}:</span>
                <span class="prop-value">{{ formatPropValue(value) }}</span>
              </div>
            </div>
          </div>
          
          <!-- 资源路径 -->
          <div class="card-resource" v-if="card.resource">
            <div class="resource-title">资源路径:</div>
            <div class="resource-value">{{ card.resource }}</div>
          </div>
        </div>
      </div>
      <div class="modal-body loading" v-else>
        <div class="loading-text">加载卡片信息中...</div>
      </div>
    </div>
  </div>
</template>

<script>
import { loadCardsData } from '@/services/eventService';
import eventBus from '@/utils/eventBus';
import { modalService } from '@/services/modalService';

export default {
  name: 'CardDetailsModal',
  data() {
    return {
      visible: false,
      cardId: null,
      card: null,
      cardsData: null,
      showMoreInfo: true, // 默认显示所有信息
      showJsonData: false, // 控制JSON数据的显示
      attributeTags: ['体魄', '智慧', '魅力', '社交', '战斗', '生存', '魔力', '隐匿'],
      modalZIndex: 1000 // 默认z-index
    };
  },
  computed: {
    hasSlotConditions() {
      return this.card && (this.card.s1 || this.card.s2 || this.card.s3 || this.card.s4);
    },
    formatSlotConditions() {
      if (!this.card) return [];
      
      const slots = [];
      // 检查卡片对象中的所有属性，寻找卡槽相关的条件
      for (const key in this.card) {
        if (key.match(/^s\d+$/) || key.match(/^!s\d+$/)) {
          const slotNum = key.replace(/[!s]/g, '');
          const isNegative = key.startsWith('非');
          const name = isNegative ? `不能与卡位${slotNum}` : `卡位${slotNum}`;
          let value = this.card[key];
          
          // 如果值是对象，简化显示
          if (typeof value === 'object' && value !== null) {
            value = '特殊条件';
          }
          
          slots.push({ name, value });
        }
      }
      return slots;
    },
    hasOtherProps() {
      if (!this.card) return false;
      return Object.keys(this.otherProps).length > 0;
    },
    otherProps() {
      if (!this.card) return {};
      
      const excludedProps = ['id', 'name', 'title', 'text', 'type', 'rare', 'tag', 'equips', 'resource'];
      const slotPattern = /^s\d+$|^!s\d+$/;
      
      const props = {};
      for (const key in this.card) {
        if (!excludedProps.includes(key) && !slotPattern.test(key) && key !== 'card_vanishing' && key !== 'vanish' && key !== 'is_only') {
          props[key] = this.card[key];
        }
      }
      
      // 添加特殊属性
      if (this.card.is_only !== undefined) {
        props['is_only'] = this.card.is_only;
      }
      
      if (this.card.card_vanishing !== undefined) {
        props['card_vanishing'] = this.card.card_vanishing;
      }
      
      return props;
    }
  },
  methods: {
    async show(cardId) {
      this.visible = true;
      this.cardId = cardId;
      this.card = null;
      this.showJsonData = false; // 重置JSON显示状态
      
      // 获取新的z-index值
      this.modalZIndex = modalService.registerModal();
      
      await this.loadCardData();
    },
    close() {
      this.visible = false;
      // 注销弹窗
      modalService.unregisterModal(this.modalZIndex);
    },
    bringToFront() {
      // 将当前弹窗提升到最前面
      this.modalZIndex = modalService.bringToFront(this.modalZIndex);
    },
    async loadCardData() {
      try {
        if (!this.cardsData) {
          this.cardsData = await loadCardsData();
        }
        
        const cardId = this.cardId;
        let card = null;
        
        if (Array.isArray(this.cardsData)) {
          card = this.cardsData.find(c => c.id === cardId || c.id === parseInt(cardId));
        } else if (typeof this.cardsData === 'object') {
          card = this.cardsData[cardId] || this.cardsData[cardId.toString()];
          
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
        
        this.card = card || { id: cardId, name: '未知卡片' };
      } catch (error) {
        console.error('加载卡片详情失败:', error);
        this.card = { id: this.cardId, name: '加载失败' };
      }
    },
    formatCardType(type) {
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
    formatPropName(key) {
      const nameMap = {
        'card_favour': '卡片偏好',
        'tips': '提示',
        'pops': '弹出信息',
        'is_only': '唯一性',
        'card_vanishing': '消失条件'
      };
      return nameMap[key] || key;
    },
    formatPropValue(value) {
      if (value === null || value === undefined) return '无';
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          return value.length ? value.join(', ') : '空数组';
        }
        return Object.keys(value).length ? JSON.stringify(value) : '空对象';
      }
      if (typeof value === 'boolean') return value ? '是' : '否';
      if (value === 0 || value === 1) {
        if (typeof value === 'number') return value === 1 ? '是' : '否';
      }
      return value.toString();
    },
    getTagClass(key) {
      // 根据标签类型返回不同的CSS类
      const statusTags = ['可堆叠', '已拥有', '装备', '已装备', '消耗品', '倒计时'];
      const typeTags = ['武器', '服装', '饰品', '军队', '部队', '贵族', '男性', '女性', '孤儿', '质子'];
      
      if (this.attributeTags.includes(key)) return 'attribute-tag';
      if (statusTags.includes(key)) return 'status-tag';
      if (typeTags.includes(key)) return 'type-tag';
      return '';
    }
  },
  created() {
    // Use the event bus instead of $root
    eventBus.on('show-card-details', this.show);
  },
  beforeUnmount() {
    // Clean up event listener
    eventBus.off('show-card-details', this.show);
    // 确保在组件卸载时注销弹窗
    if (this.visible) {
      modalService.unregisterModal(this.modalZIndex);
    }
  }
}
</script>

<style scoped>
.card-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  /* z-index 现在通过动态绑定设置 */
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 10;
}

.header-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.json-button {
  background-color: #ecf5ff;
  color: #409eff;
  border: 1px solid #d9ecff;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.json-button:hover {
  background-color: #409eff;
  color: white;
}

.json-data {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 10px;
  overflow: auto;
  max-height: 500px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.json-data pre {
  margin: 0;
}

.modal-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.close-button {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #909399;
  padding: 0;
  line-height: 1;
}

.close-button:hover {
  color: #606266;
}

.modal-body {
  padding: 15px;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-basic-info {
  margin-bottom: 5px;
}

.card-title {
  font-size: 16px;
  color: #606266;
  font-style: italic;
  margin-bottom: 5px;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 13px;
  color: #909399;
}

.card-text {
  margin-top: 10px;
  line-height: 1.5;
  white-space: pre-line;
  color: #303133;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.tags-title, .equips-title, .slots-title, .props-title, .resource-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 8px;
  color: #606266;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: #f0f2f5;
  color: #606266;
}

/* 属性标签 */
.attribute-tag {
  background-color: #e1f3d8;
  color: #67c23a;
}

/* 状态标签 */
.status-tag {
  background-color: #fdf6ec;
  color: #e6a23c;
}

/* 类型标签 */
.type-tag {
  background-color: #ecf5ff;
  color: #409eff;
}

.equips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.equip-item {
  background-color: #f0f9ff;
  border: 1px solid #d0e6ff;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 12px;
  color: #409eff;
}

.card-slots {
  margin-top: 10px;
}

.slots-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.slot-item {
  background-color: #f0f9ff;
  border: 1px solid #d0e6ff;
  border-radius: 4px;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  font-size: 13px;
}

.slot-name {
  font-weight: bold;
  margin-right: 5px;
  color: #409eff;
}

.slot-value {
  color: #606266;
}

.props-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.prop-item {
  display: flex;
  padding: 5px 0;
  border-bottom: 1px dashed #eee;
}

.prop-name {
  font-weight: bold;
  color: #606266;
  width: 120px;
  flex-shrink: 0;
}

.prop-value {
  color: #303133;
  word-break: break-word;
}

.card-resource {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.resource-value {
  font-family: monospace;
  background-color: #f5f7fa;
  padding: 5px;
  border-radius: 4px;
  word-break: break-all;
}

.loading-text {
  text-align: center;
  color: #909399;
  padding: 15px;
}
</style>
