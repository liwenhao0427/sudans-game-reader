<template>
  <div class="condition-item">
    <span class="condition-key">任意满足</span>
    <div class="any-conditions">
      <div v-for="(val, key) in anyCondition" :key="key" class="any-condition-item">
        <span v-if="key === 'is'">
          {{ formatKey(key) }}: 
          <span class="card-value">
            <span class="card-id">#{{ val }}</span>
            <span v-if="cardName" class="card-name clickable" @click="$emit('show-card-details', val)">
              {{ cardName }}
            </span>
            <span v-else class="card-loading">加载中...</span>
          </span>
        </span>
        <span v-else>{{ formatKey(key) }}: {{ formatValue(key, val) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { getCardById } from '@/services/eventService';

export default {
  name: 'AnyCondition',
  props: {
    anyCondition: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const cardName = ref(null);
    
    const formatKey = (key) => {
      if (key === 'is') {
        return '需要卡片';
      } else if (key === 'type') {
        return '需要类型';
      }
      return key;
    };
    
    const formatValue = (key, value) => {
      if (key === 'type') {
        const typeMap = {
          'char': '角色',
          'item': '物品',
          'skill': '技能',
          'event': '事件',
          'enemy': '敌人',
          'npc': 'NPC',
          'sudan': '苏丹卡'
        };
        return typeMap[value] || value;
      }
      return value;
    };
    
    const loadCardInfo = async () => {
      if (props.anyCondition && props.anyCondition.is) {
        try {
          const cardData = await getCardById(props.anyCondition.is);
          if (cardData) {
            cardName.value = cardData.name || cardData.text || `卡片 #${props.anyCondition.is}`;
          } else {
            cardName.value = `未知卡片 #${props.anyCondition.is}`;
          }
        } catch (error) {
          console.error('加载卡片信息失败:', error);
          cardName.value = `加载失败 #${props.anyCondition.is}`;
        }
      }
    };
    
    onMounted(() => {
      loadCardInfo();
    });
    
    return {
      cardName,
      formatKey,
      formatValue
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
</style>