<template>
  <div class="items-list">
    <div v-for="(item, index) in items" :key="index" class="item-entry">
      <div class="item-header">
        <span class="item-num">{{ item.num }}个</span>
        <span class="item-id">#{{ item.id }}</span>
        <!-- 卡片类型 -->
        <span v-if="item.type === 'card' && itemNames[item.id]" 
              class="item-name clickable" 
              @click="showDetails(item.id, 'card')">
          {{ itemNames[item.id] }}
        </span>
        <!-- 仪式类型 -->
        <span v-else-if="item.type === 'rite'" 
              class="item-name rite-name clickable" 
              @click="showDetails(item.id, 'rite')">
          {{ itemNames['rite_'+item.id] || '仪式 #' + item.id }}
        </span>
        <!-- 事件类型 -->
        <span v-else-if="item.type === 'event'" 
              class="item-name event-name clickable" 
              @click="showDetails(item.id, 'event')">
          {{ itemNames[item.id] || '事件 #' + item.id }}
        </span>
        <!-- 加载中状态 -->
        <span v-else-if="['card', 'rite', 'event'].includes(item.type) && !itemNames[item.id]" class="item-loading">加载中...</span>
        <!-- 其他类型 -->
        <span v-else class="item-type">{{ formatItemType(item.type) }}</span>
      </div>
      <div class="item-details">
        <span v-if="item.weight" class="item-weight">权重: {{ item.weight }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { getCardById, loadEventData } from '@/services/eventService';
import eventBus from '@/utils/eventBus';

export default {
  name: 'ItemListDisplay',
  props: {
    items: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const itemNames = ref({});
    
    // 加载卡片名称
    const loadCardName = async (cardId) => {
      if (!itemNames.value[cardId]) {
        try {
          const cardData = await getCardById(cardId);
          if (cardData) {
            itemNames.value[cardId] = cardData.name || cardData.text || `卡片 #${cardId}`;
          }
        } catch (error) {
          console.error(`加载卡片 ${cardId} 失败:`, error);
          itemNames.value[cardId] = `卡片 #${cardId}`;
        }
      }
    };
    
    // 加载事件或仪式名称
    const loadEventName = async (eventId, type) => {
      if (!itemNames.value[eventId]) {
        try {
          console.log(`加载${type} ${eventId}`); // 添加这一行以确认事件ID是否正确传递给 loadEventData 函数
          const eventData = await loadEventData(eventId, type);
          if (eventData) {
            const prefix = type === 'rite' ? '仪式: ' : '';
            if(type == 'rite'){
              itemNames.value['rite_'+eventId] = prefix + (eventData.name || eventData.text || `${type} #${eventId}`);
            }else {
              itemNames.value[eventId] = prefix + (eventData.name || eventData.text || `${type} #${eventId}`);
            }
          }
        } catch (error) {
          console.error(`加载${type} ${eventId} 失败:`, error);
          itemNames.value[eventId] = `${type} #${eventId}`;
        }
      }
    };
    
    // 格式化物品类型
    const formatItemType = (type) => {
      const typeMap = {
        'card': '卡片',
        'item': '物品',
        'resource': '资源',
        'loot': '战利品',
        'rite': '仪式',
        'event': '事件'
      };
      return typeMap[type] || type;
    };
    
    // 显示详情
    const showDetails = (id, type) => {
      console.log(`显示${type}详情:`, id);
      if (type === 'card') {
        eventBus.emit('show-card-details', id);
      } else if(type == 'rite'){
        eventBus.emit('show-rite-details', id);
      } else if(type == 'event'){
        eventBus.emit('show-event-details', id);
      }
    };
    
    // 组件挂载时加载所有物品名称
    onMounted(() => {
      if (props.items && props.items.length > 0) {
        props.items.forEach(item => {
          if (item.type === 'card') {
            loadCardName(item.id);
          } else if (item.type === 'rite' || item.type === 'event') {
            loadEventName(item.id, item.type);
          }
        });
      }
    });
    
    return {
      itemNames,
      formatItemType,
      showDetails
    };
  }
}
</script>

<style scoped>
.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-entry {
  background-color: #f5f5f5;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e0e0e0;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.item-num {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
}

.item-id {
  color: #666;
  font-size: 12px;
}

.item-name {
  font-weight: 500;
  color: #333;
}

.item-name.clickable {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}

.item-name.clickable:hover {
  color: #0d47a1;
}

.item-loading {
  font-style: italic;
  color: #666;
  font-size: 12px;
}

.item-type {
  background-color: #f0f4c3;
  color: #827717;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
}

.item-details {
  display: flex;
  gap: 8px;
}

.item-weight {
  background-color: #fff8e1;
  color: #ff8f00;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
}

.item-name.rite-name {
  color: #7b1fa2;
  font-weight: 500;
}

.item-name.event-name {
  color: #1976d2;
  font-weight: 500;
}

.item-name.rite-name.clickable:hover,
.item-name.event-name.clickable:hover {
  text-decoration: underline;
  opacity: 0.8;
}
</style>