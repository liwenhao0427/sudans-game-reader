<template>
  <div class="condition-container">
    <div class="container-header">
      <span class="container-icon">🔍</span>
      <span class="container-title">条件</span>
    </div>
    <div class="condition-content">
      <div v-if="isSimpleCondition" class="simple-condition">
        <div v-for="(value, key) in condition" :key="key" class="condition-item">
          <span class="condition-key">{{ formatKey(key) }}</span>
          <span class="condition-value">{{ formatValue(value) }}</span>
        </div>
      </div>
      <div v-else class="complex-condition">
        <pre>{{ JSON.stringify(condition, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConditionDisplay',
  props: {
    condition: {
      type: Object,
      required: true
    }
  },
  computed: {
    isSimpleCondition() {
      // 判断是否为简单条件（没有嵌套对象）
      return !Object.values(this.condition).some(value => typeof value === 'object' && value !== null);
    }
  },
  methods: {
    formatKey(key) {
      // 格式化条件键
      if (key.endsWith('=')) {
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
    formatValue(value) {
      // 格式化条件值
      if (typeof value === 'boolean') {
        return value ? '是' : '否';
      }
      return value;
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

.simple-condition {
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

.complex-condition pre {
  margin: 0;
  background-color: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}
</style>