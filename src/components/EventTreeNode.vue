<template>
  <div class="event-tree-node">
    <div 
      class="node-header" 
      :class="{ 'selected': selected }"
      @click="handleSelect"
    >
      <span class="toggle-icon" v-if="hasChildren" @click.stop="toggleExpanded">
        {{ expanded ? '▼' : '►' }}
      </span>
      <span class="node-title">{{ event.text || '未命名事件' }} (ID: {{ event.id }})</span>
    </div>
    
    <div class="children" v-if="expanded && hasChildren">
      <div v-if="loading" class="loading">加载子节点中...</div>
      <template v-else>
        <event-tree-node 
          v-for="child in children" 
          :key="child.id" 
          :event="child" 
          :selected="selectedId === child.id"
          @select="handleChildSelect"
        />
      </template>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { loadEventData, getChildEventIds } from '../services/eventService';

export default {
  name: 'EventTreeNode',
  props: {
    event: {
      type: Object,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select'],
  setup(props, { emit }) {
    const expanded = ref(false);
    const loading = ref(false);
    const children = ref([]);
    const selectedId = ref(null);
    
    // 检查是否有子节点
    const hasChildren = computed(() => {
      return getChildEventIds(props.event).length > 0;
    });
    
    // 处理选择节点
    const handleSelect = () => {
      emit('select', props.event.id);
    };
    
    // 处理子节点选择
    const handleChildSelect = (eventId) => {
      selectedId.value = eventId;
      emit('select', eventId);
    };
    
    // 切换展开/折叠状态
    const toggleExpanded = async () => {
      expanded.value = !expanded.value;
      
      // 如果展开且还没有加载子节点，则加载子节点
      if (expanded.value && children.value.length === 0) {
        await loadChildren();
      }
    };
    
    // 加载子节点
    const loadChildren = async () => {
      loading.value = true;
      try {
        const childIds = getChildEventIds(props.event);
        const loadedChildren = [];
        
        for (const id of childIds) {
          try {
            const childData = await loadEventData(id);
            if (childData) {
              loadedChildren.push(childData);
            }
          } catch (e) {
            console.error(`加载子节点 ${id} 失败:`, e);
          }
        }
        
        children.value = loadedChildren;
      } catch (e) {
        console.error('加载子节点失败:', e);
      } finally {
        loading.value = false;
      }
    };
    
    return {
      expanded,
      loading,
      children,
      hasChildren,
      selectedId,
      handleSelect,
      handleChildSelect,
      toggleExpanded
    };
  }
}
</script>

<style scoped>
.event-tree-node {
  margin-bottom: 5px;
}

.node-header {
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.node-header:hover {
  background-color: #e9e9e9;
}

.node-header.selected {
  background-color: #e1f5fe;
  border-left: 3px solid #03a9f4;
}

.toggle-icon {
  margin-right: 8px;
  font-size: 12px;
  width: 16px;
  text-align: center;
  cursor: pointer;
}

.node-title {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.children {
  margin-left: 20px;
  padding-left: 10px;
  border-left: 1px dashed #ccc;
}

.loading {
  padding: 8px;
  color: #888;
  font-style: italic;
  font-size: 12px;
}
</style>