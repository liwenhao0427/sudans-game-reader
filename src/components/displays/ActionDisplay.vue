<template>
  <div class="action-container">
    <div class="container-header">
      <span class="container-icon">⚡</span>
      <span class="container-title">动作</span>
    </div>
    <div class="action-content">
      <div v-if="hasSimpleActions" class="simple-actions">
        <div v-for="(value, key) in simpleActions" :key="key" class="action-item">
          <span class="action-key">{{ formatKey(key) }}</span>
          <span class="action-value">{{ formatValue(value) }}</span>
        </div>
      </div>
      <div v-if="hasComplexActions" class="complex-actions">
        <div v-for="(value, key) in complexActions" :key="key" class="complex-action">
          <div class="complex-action-header">{{ formatKey(key) }}</div>
          <pre>{{ JSON.stringify(value, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ActionDisplay',
  props: {
    action: {
      type: Object,
      required: true
    }
  },
  computed: {
    simpleActions() {
      // 提取简单动作（非对象值）
      return Object.entries(this.action)
        // eslint-disable-next-line no-unused-vars
        .filter(([_, value]) => typeof value !== 'object' || value === null)
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    },
    complexActions() {
      // 提取复杂动作（对象值）
      return Object.entries(this.action)
        // eslint-disable-next-line no-unused-vars
        .filter(([_, value]) => typeof value === 'object' && value !== null)
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    },
    hasSimpleActions() {
      return Object.keys(this.simpleActions).length > 0;
    },
    hasComplexActions() {
      return Object.keys(this.complexActions).length > 0;
    }
  },
  methods: {
    formatKey(key) {
      // 格式化动作键
      const actionMap = {
        'rite': '仪式',
        'event': '事件',
        'choose': '选择',
        'add': '添加',
        'remove': '移除'
      };
      
      return actionMap[key] || key;
    },
    formatValue(value) {
      // 格式化动作值
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return value;
    }
  }
}
</script>

<style scoped>
.action-container {
  margin-top: 15px;
  padding: 12px;
  border-radius: 6px;
  background-color: #fdf6ec;
  border: 1px solid #f5dab1;
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
  color: #e6a23c;
}

.simple-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
}

.action-item {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.action-key {
  font-weight: bold;
  margin-bottom: 4px;
  color: #606266;
}

.action-value {
  color: #333;
}

.complex-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.complex-action {
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.complex-action-header {
  padding: 8px 12px;
  background-color: #faf0e6;
  font-weight: bold;
  border-bottom: 1px solid #f5dab1;
}

.complex-action pre {
  margin: 0;
  padding: 10px;
  background-color: white;
}
</style>