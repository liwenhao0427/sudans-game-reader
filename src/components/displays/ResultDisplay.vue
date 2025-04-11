<template>
  <div class="result-container">
    <div class="container-header">
      <span class="container-icon">✅</span>
      <span class="container-title">结果</span>
    </div>
    <div class="result-content">
      <div class="result-grid">
        <div v-for="(value, key) in result" :key="key" class="result-item">
          <span class="result-key">{{ formatKey(key) }}</span>
          <span class="result-value">{{ formatValue(value) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResultDisplay',
  props: {
    result: {
      type: Object,
      required: true
    }
  },
  methods: {
    formatKey(key) {
      // 格式化结果键
      if (key.startsWith('counter-')) {
        return '减少计数器: ' + key.slice(8);
      } else if (key.startsWith('counter+')) {
        return '增加计数器: ' + key.slice(8);
      } else if (key.includes('+')) {
        const [slot, item] = key.split('+');
        return `添加到槽位 ${slot}: ${item}`;
      } else if (key.includes('-')) {
        // eslint-disable-next-line no-unused-vars 
        const [stat, amount] = key.split('-');
        return `减少 ${stat}`;
      }
      return key;
    },
    formatValue(value) {
      // 格式化结果值
      if (typeof value === 'boolean') {
        return value ? '是' : '否';
      }
      return value;
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

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.result-item {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.result-key {
  font-weight: bold;
  margin-bottom: 4px;
  color: #606266;
}

.result-value {
  color: #333;
}
</style>