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
      <div class="node-info" @click="toggleExpanded">
        <div class="node-title">
          {{ event.name || event.text || '未命名事件' }}
          <span class="node-id">(ID: {{ event.eventId }})</span>
          <!-- 添加节点类型标签 -->
          <span v-if="(event.eventId+'').startsWith('rite') " class="node-type rite">仪式</span>
          <span v-else-if="(event.eventId+'').startsWith('loot') " class="node-type loot">战利品</span>
          <span v-else class="node-type event">事件</span>
        </div>
        <div class="node-details" v-if="event.tag_tips || event.location">
          <span class="tag" v-for="tag in event.tag_tips" :key="tag"><span v-if="event.tag_tips">{{ tag }}</span></span>
          <span v-if="event.location" class="location">{{ event.location }}</span>
        </div>
      </div>
    </div>
    
    <div class="children" v-if="expanded && hasChildren">
      <div v-if="loading" class="loading">加载子节点中...</div>
      <template v-else>
        <event-tree-node 
          v-for="child in children" 
          :key="child.eventId" 
          :event="child" 
          :selected="selectedId === child.eventId"
          @select="handleChildSelect"
        />
      </template>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
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
    },
    autoExpand: {
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
    
    // 判断是否为仪式节点
    const isRite = computed(() => {
      return props.event.eventId && props.event.eventId.toString().startsWith('5');
    });
    
    // 判断是否为战利品节点
    const isLoot = computed(() => {
      // 检查是否包含战利品相关的属性或标签
      return props.event.tag_tips && props.event.tag_tips.some(tag => 
        tag.includes('战利品') || tag.includes('宝藏') || tag.includes('奖励')
      ) || props.event.text && (
        props.event.text.includes('战利品') || 
        props.event.text.includes('宝藏') || 
        props.event.text.includes('奖励')
      );
    });
    
    // 处理选择节点
    const handleSelect = () => {
      emit('select', props.event.eventId);
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
        let loadedChildren = [];
        
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
        
        if(loadedChildren){
          loadedChildren = loadedChildren.filter(child => child.eventId !== props.event.eventId);
        }
        children.value = loadedChildren;
        // console.log('子节点加载完成:', children.value); // 添加这一行以查看子节点加载情况
      } catch (e) {
        console.error('加载子节点失败:', e);
      } finally {
        loading.value = false;
      }
    };
    
    // 监听 autoExpand 属性变化，自动展开节点
    watch(() => props.autoExpand, (newValue) => {
      if (newValue && !expanded.value && hasChildren.value) {
        toggleExpanded();
      }
    }, { immediate: true });
    
    // 监听 selected 属性变化，自动展开节点
    watch(() => props.selected, (newValue) => {
      if (newValue && !expanded.value && hasChildren.value) {
        toggleExpanded();
      }
    });
    
    return {
      expanded,
      loading,
      children,
      hasChildren,
      selectedId,
      isRite,
      isLoot,
      handleSelect,
      handleChildSelect,
      toggleExpanded
    };
  },
  // 添加mounted钩子
  mounted() {
    // 如果是根节点且有自动展开属性，则在组件挂载后通知父组件选择第一个仪式节点
    if (this.autoExpand && this.event && (!this.event.parent || this.event.parent === 0)) {
      // 使用nextTick确保DOM已更新
      this.$nextTick(() => {
        // 检查是否有settlement文本
        const hasSettlementText = this.event.settlement && 
          Object.values(this.event.settlement).some(s => s.text && s.text.trim() !== '');
        
        // 如果没有settlement文本且有仪式节点，则选择第一个仪式节点
        if (!hasSettlementText && this.event.rite && this.event.rite.length > 0) {
          this.$parent.selectFirstRiteNode();
        }
      });
    }
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
  align-items: flex-start;
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
  padding-top: 2px;
}

.node-info {
  flex: 1;
  overflow: hidden;
  cursor: pointer; /* 添加指针样式，表明可点击 */
}

.node-title {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.node-id {
  font-size: 12px;
  color: #666;
  font-weight: normal;
  margin-left: 4px;
}

.node-details {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  background-color: #e0f7fa;
  color: #00838f;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 11px;
}

.location {
  background-color: #f0f4c3;
  color: #827717;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 11px;
}

.children {
  margin-left: 24px;
  margin-top: 5px;
  border-left: 1px dashed #ddd;
  padding-left: 10px;
}

.loading {
  padding: 8px;
  color: #666;
  font-style: italic;
  font-size: 13px;
}

.node-type {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 6px;
  font-weight: normal;
  display: inline-block;
  vertical-align: middle;
}

.node-type.event {
  background-color: #e3f2fd;
  color: #1976d2;
}

.node-type.rite {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.node-type.loot {
  background-color: #fffde7;
  color: #f57f17;
}
</style>