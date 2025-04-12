<template>
  <div class="condition-item">
    <span class="condition-key">需要卡片</span>
    <span class="condition-value card-value">
      <span class="card-id">#{{ cardId }}</span>
      <span v-if="cardName" class="card-name clickable" @click="$emit('show-card-details', cardId)">
        {{ cardName }}
      </span>
      <span v-else class="card-loading">加载中...</span>
    </span>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { getCardById } from '@/services/eventService';

export default {
  name: 'CardCondition',
  props: {
    cardId: {
      required: true
    }
  },
  setup(props) {
    const cardName = ref(null);
    
    const loadCardInfo = async () => {
      try {
        const cardData = await getCardById(props.cardId);
        if (cardData) {
          cardName.value = cardData.name || cardData.text || `卡片 #${props.cardId}`;
        } else {
          cardName.value = `未知卡片 #${props.cardId}`;
        }
      } catch (error) {
        console.error('加载卡片信息失败:', error);
        cardName.value = `加载失败 #${props.cardId}`;
      }
    };
    
    onMounted(() => {
      loadCardInfo();
    });
    
    return {
      cardName
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