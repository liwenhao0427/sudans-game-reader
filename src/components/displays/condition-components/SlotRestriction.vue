<template>
  <div class="condition-item">
    <span class="condition-key">{{ formatSlotRestriction(slotKey) }}</span>
    <span class="condition-value">{{ slotValue }}</span>
  </div>
</template>

<script>
export default {
  name: 'SlotRestriction',
  props: {
    slotKey: {
      type: String,
      required: true
    },
    slotValue: {
      required: true
    }
  },
  setup() {
    const formatSlotRestriction = (key) => {
      if (key.startsWith('!s')) {
        const slotNum = key.substring(2);
        return `不能与卡位 ${slotNum} 同时填入`;
      } else if (key.startsWith('s')) {
        const slotNum = key.substring(1);
        return `卡位 ${slotNum}`;
      }
      return key;
    };
    
    return {
      formatSlotRestriction
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
</style>