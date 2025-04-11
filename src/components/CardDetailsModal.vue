<template>
  <div class="card-details-modal" v-if="visible" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ card ? (card.name || '未命名卡片') : '加载中...' }}</h3>
        <button class="close-button" @click="close">×</button>
      </div>
      <div class="modal-body" v-if="card">
        <div class="card-info">
          <!-- 基本信息 -->
          <div class="card-basic-info">
            <div class="card-title" v-if="card.title">{{ card.title }}</div>
            <div class="card-meta">
              <span class="card-id">ID: {{ card.id }}</span>
              <span class="card-type">类型: {{ formatCardType(card.type) }}</span>
              <span class="card-rare" v-if="card.rare">稀有度: {{ card.rare }}</span>
            </div>
          </div>
          
          <!-- 卡片描述 -->
          <div class="card-text" v-if="card.text">{{ card.text }}</div>
          
          <!-- 卡槽条件 (简化显示) -->
          <div class="card-slots" v-if="hasSlotConditions">
            <div class="slots-container">
              <div v-for="(condition, index) in formatSlotConditions" :key="index" class="slot-item">
                <span class="slot-name">{{ condition.name }}</span>
                <span class="slot-value">{{ condition.value }}</span>
              </div>
            </div>
          </div>
          
          <!-- 更多信息按钮 -->
          <div class="more-info-toggle">
            <button @click="showMoreInfo = !showMoreInfo" class="more-info-button">
              {{ showMoreInfo ? '收起详情' : '显示更多信息' }}
            </button>
          </div>
          
          <!-- 详细标签信息 (可折叠) -->
          <div class="card-tags" v-if="card.tag && showMoreInfo">
            <div class="tags-title">标签:</div>
            <div class="tags-container">
              <span v-for="(value, key) in card.tag" :key="key" class="tag-item">
                {{ key }}{{ value !== 1 ? ': ' + value : '' }}
              </span>
            </div>
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
import mitt from 'mitt';

// Create a global event emitter
export const eventBus = mitt();

export default {
  name: 'CardDetailsModal',
  data() {
    return {
      visible: false,
      cardId: null,
      card: null,
      cardsData: null,
      showMoreInfo: false
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
          const isNegative = key.startsWith('!');
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
    }
  },
  methods: {
    async show(cardId) {
      this.visible = true;
      this.cardId = cardId;
      this.card = null;
      this.showMoreInfo = false;
      await this.loadCardData();
    },
    close() {
      this.visible = false;
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
        'sudan': '苏丹'
      };
      return typeMap[type] || type;
    }
  },
  created() {
    // Use the event bus instead of $root
    eventBus.on('show-card-details', this.show);
  },
  beforeUnmount() {
    // Clean up event listener
    eventBus.off('show-card-details', this.show);
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
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
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
  gap: 8px;
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
}

.card-slots {
  margin-top: 10px;
  border-top: 1px solid #eee;
  padding-top: 10px;
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

.more-info-toggle {
  margin-top: 12px;
  text-align: center;
}

.more-info-button {
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s;
}

.more-info-button:hover {
  background-color: #ecf5ff;
  color: #409eff;
}

.card-tags {
  margin-top: 10px;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.tags-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 5px;
  color: #606266;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  background-color: #f0f2f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.loading-text {
  text-align: center;
  color: #909399;
  padding: 15px;
}
</style>