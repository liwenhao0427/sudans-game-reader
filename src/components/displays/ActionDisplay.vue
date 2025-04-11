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
          <span class="action-value">{{ formatValue(key, value) }}</span>
        </div>
      </div>
      
      <!-- 事件引用显示 -->
      <div v-if="hasEventReferences" class="event-references">
        <div v-for="(eventRef, key) in eventReferences" :key="key" class="event-reference-item">
          <div class="event-reference-header">{{ formatKey(key) }}</div>
          <div v-for="(event, index) in eventRef" :key="`${key}-${index}`" class="event-reference">
            <span class="event-id">#{{ event }}</span>
            <span v-if="eventNames[event]" class="event-name clickable" @click="showEventDetails(event)">
              {{ eventNames[event] }}
            </span>
            <span v-else class="event-loading">加载中...</span>
          </div>
        </div>
      </div>
      
      <!-- 仪式引用显示 -->
      <div v-if="hasRiteReferences" class="rite-references">
        <div v-for="(riteRef, key) in riteReferences" :key="key" class="rite-reference-item">
          <div class="rite-reference-header">{{ formatKey(key) }}</div>
          <div class="rite-reference">
            <span class="rite-id">#{{ riteRef }}</span>
            <span v-if="riteNames[riteRef]" class="rite-name clickable" @click="showRiteDetails(riteRef)">
              {{ riteNames[riteRef] }}
            </span>
            <span v-else class="rite-loading">加载中...</span>
          </div>
        </div>
      </div>
      
      <!-- 提示文本显示 -->
      <div v-if="hasPrompts" class="prompts">
        <div v-for="(prompt, key) in prompts" :key="key" class="prompt-item">
          <div class="prompt-header">{{ formatKey(key) }}</div>
          <div class="prompt-content">
            <div v-if="prompt.id" class="prompt-id">ID: {{ prompt.id }}</div>
            <div v-if="prompt.text" class="prompt-text">{{ prompt.text }}</div>
            <div v-if="prompt.icon" class="prompt-icon">图标: {{ prompt.icon }}</div>
          </div>
        </div>
      </div>
      
      <!-- 选项显示 -->
      <div v-if="hasOptions" class="options">
        <div v-for="(option, key) in options" :key="key" class="option-item">
          <div class="option-header">{{ formatKey(key) }}</div>
          <div class="option-content">
            <div v-if="option.id" class="option-id">ID: {{ option.id }}</div>
            <div v-if="option.text" class="option-text">{{ option.text }}</div>
            <div v-if="option.icon" class="option-icon">图标: {{ Array.isArray(option.icon) ? option.icon.join(', ') : option.icon }}</div>
            
            <div v-if="option.items && option.items.length" class="option-choices">
              <div v-for="(item, index) in option.items" :key="index" class="option-choice">
                <div class="choice-tag">{{ item.tag }}</div>
                <div class="choice-text">{{ item.text }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 选项RESULT显示 -->
      <div v-if="hasCases" class="cases">
        <div v-for="(caseAction, key) in cases" :key="key" class="case-item">
          <div class="case-header">{{ formatKey(key) }}</div>
          <action-display :action="caseAction" />
        </div>
      </div>
      
      <!-- 延迟动作显示 -->
      <div v-if="hasDelays" class="delays">
        <div v-for="(delay, key) in delays" :key="key" class="delay-item">
          <div class="delay-header">{{ formatKey(key) }}</div>
          <div class="delay-content">
            <div v-if="delay.id" class="delay-id">ID: {{ delay.id }}</div>
            <div v-if="delay.round" class="delay-round">{{ delay.round }} 回合后</div>
            <action-display :action="getDelayActions(delay)" />
          </div>
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
import { loadEventData, loadGameDataIndex } from '@/services/eventService';
import eventBus from '@/utils/eventBus';

export default {
  name: 'ActionDisplay',
  // 添加自身引用
  components: {
    ActionDisplay: () => import('./ActionDisplay.vue')
  },
  props: {
    action: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      eventNames: {}, // 存储事件名称
      riteNames: {}, // 存储仪式名称
      eventsData: null, // 事件数据缓存
      ritesData: null, // 仪式数据缓存
    };
  },
  computed: {
    simpleActions() {
      // 提取简单动作（非对象值且不是特殊类型）
      return Object.entries(this.action)
        .filter(([key, value]) => 
          typeof value !== 'object' || value === null || Array.isArray(value) && 
          !this.isEventReference(key) && 
          !this.isRiteReference(key)
        )
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    },
    complexActions() {
      // 提取复杂动作（对象值且不是特殊类型）
      return Object.entries(this.action)
        .filter(([key, value]) => 
          typeof value === 'object' && value !== null && 
          !Array.isArray(value) &&
          !this.isPrompt(key, value) &&
          !this.isOption(key, value) &&
          !this.isCase(key) &&
          !this.isDelay(key, value) &&
          !this.isSuccess(key) &&
          !this.isFailure(key)
        )
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    },
    eventReferences() {
      // 提取事件引用
      return Object.entries(this.action)
        .filter(([key]) => this.isEventReference(key))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    },
    riteReferences() {
      // 提取仪式引用
      return Object.entries(this.action)
        .filter(([key, value]) => this.isRiteReference(key, value))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    },
    prompts() {
      // 提取提示文本
      return Object.entries(this.action)
        .filter(([key, value]) => this.isPrompt(key, value))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    },
    options() {
      // 提取选项
      return Object.entries(this.action)
        .filter(([key, value]) => this.isOption(key, value))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    },
    cases() {
      // 提取选项结果
      return Object.entries(this.action)
        .filter(([key]) => this.isCase(key))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    },
    delays() {
      // 提取延迟动作
      return Object.entries(this.action)
        .filter(([key, value]) => this.isDelay(key, value))
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
    },
    hasEventReferences() {
      return Object.keys(this.eventReferences).length > 0;
    },
    hasRiteReferences() {
      return Object.keys(this.riteReferences).length > 0;
    },
    hasPrompts() {
      return Object.keys(this.prompts).length > 0;
    },
    hasOptions() {
      return Object.keys(this.options).length > 0;
    },
    hasCases() {
      return Object.keys(this.cases).length > 0;
    },
    hasDelays() {
      return Object.keys(this.delays).length > 0;
    }
  },
  methods: {
    isEventReference(key) {
      return key === 'event_on' || key === 'event_off';
    },
    isRiteReference(key, value) {
      return key === 'rite' || key === 'clean.rite' || 
             (typeof value === 'number' && value.toString().startsWith('500'));
    },
    isPrompt(key, value) {
      return key === 'prompt' && value && typeof value === 'object' && value.text;
    },
    isOption(key, value) {
      return key === 'option' && value && typeof value === 'object' && value.items;
    },
    isCase(key) {
      return key.startsWith('case:');
    },
    isDelay(key, value) {
      return key === 'delay' && value && typeof value === 'object' && value.round;
    },
    isSuccess(key) {
      return key === 'success';
    },
    isFailure(key) {
      return key === 'failure';
    },
    formatKey(key) {
      // 格式化动作键
      const actionMap = {
        'rite': '仪式',
        'clean.rite': '清除仪式',
        'event': '事件',
        'event_on': '激活事件',
        'event_off': '关闭事件',
        'choose': '选择',
        'add': '添加',
        'remove': '移除',
        'prompt': '提示',
        'option': '选项',
        'delay': '延迟动作',
        'success': '成功结果',
        'failure': '失败结果',
        'no_prompt': '无提示动作'
      };
      
      if (key.startsWith('case:')) {
        return `选项结果: ${key.substring(5)}`;
      }
      
      return actionMap[key] || key;
    },
    formatValue(key, value) {
      // 格式化动作值
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return value;
    },
    getDelayActions(delay) {
      // 提取延迟动作中的实际动作
      const actions = {};
      Object.entries(delay).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'round') {
          actions[key] = value;
        }
      });
      return actions;
    },
    async loadEventInfo(eventId) {
      try {
        if (!this.eventsData) {
          this.eventsData = await loadGameDataIndex();
        }
        
        if (this.eventsData && this.eventsData.events) {
          const event = this.eventsData.events.find(e => e.id === eventId || e.id === parseInt(eventId));
          if (event) {
            this.eventNames[eventId] = event.name || event.text || `事件 #${eventId}`;
            return;
          }
        }
        
        // 如果索引中没有找到，尝试直接加载事件数据
        const eventData = await loadEventData(eventId, 'event');
        if (eventData) {
          this.eventNames[eventId] = eventData.name || eventData.text || `事件 #${eventId}`;
        } else {
          this.eventNames[eventId] = `未知事件 #${eventId}`;
        }
      } catch (error) {
        console.error('加载事件信息失败:', error);
        this.eventNames[eventId] = `加载失败 #${eventId}`;
      }
    },
    async loadRiteInfo(riteId) {
      try {
        if (!this.ritesData) {
          this.ritesData = await loadGameDataIndex();
        }
        
        if (this.ritesData && this.ritesData.rites) {
          const rite = this.ritesData.rites.find(r => r.id === riteId || r.id === parseInt(riteId));
          if (rite) {
            this.riteNames[riteId] = rite.name || rite.text || `仪式 #${riteId}`;
            return;
          }
        }
        
        // 如果索引中没有找到，尝试直接加载仪式数据
        const riteData = await loadEventData(riteId, 'rite');
        if (riteData) {
          this.riteNames[riteId] = riteData.name || riteData.text || `仪式 #${riteId}`;
        } else {
          this.riteNames[riteId] = `未知仪式 #${riteId}`;
        }
      } catch (error) {
        console.error('加载仪式信息失败:', error);
        this.riteNames[riteId] = `加载失败 #${riteId}`;
      }
    },
    showEventDetails(eventId) {
      // 显示事件详情弹窗
      console.log('显示事件详情:', eventId);
      // 使用事件总线触发全局事件
      eventBus.emit('show-event-details', eventId);
    },
    showRiteDetails(riteId) {
      // 显示仪式详情弹窗
      console.log('显示仪式详情:', riteId);
      // 使用 mitt 触发事件
      eventBus.emit('show-rite-details', riteId);
    },
    loadAllReferences() {
      // 加载所有事件和仪式引用
      Object.values(this.eventReferences).forEach(events => {
        if (Array.isArray(events)) {
          events.forEach(eventId => this.loadEventInfo(eventId));
        } else {
          this.loadEventInfo(events);
        }
      });
      
      Object.values(this.riteReferences).forEach(riteId => {
        this.loadRiteInfo(riteId);
      });
    }
  },
  mounted() {
    this.loadAllReferences();
  },
  watch: {
    action: {
      handler() {
        this.loadAllReferences();
      },
      deep: true
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

.simple-actions, .event-references, .rite-references, .prompts, .options, .cases, .delays {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
}

.action-item, .event-reference-item, .rite-reference-item, .prompt-item, .option-item, .case-item, .delay-item {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.action-key, .event-reference-header, .rite-reference-header, .prompt-header, .option-header, .case-header, .delay-header {
  font-weight: bold;
  margin-bottom: 4px;
  color: #606266;
}

.action-value, .event-reference, .rite-reference, .prompt-content, .option-content, .delay-content {
  color: #333;
}

.event-id, .rite-id {
  color: #909399;
  font-size: 0.9em;
  margin-right: 5px;
}

.event-name, .rite-name {
  font-weight: 500;
  color: #409eff;
}

.event-name.clickable, .rite-name.clickable {
  cursor: pointer;
  text-decoration: underline;
}

.event-name.clickable:hover, .rite-name.clickable:hover {
  color: #66b1ff;
}

.event-loading, .rite-loading {
  font-style: italic;
  color: #909399;
}

.prompt-text, .option-text {
  white-space: pre-line;
  margin: 5px 0;
}

.prompt-id, .option-id, .delay-id {
  font-size: 0.8em;
  color: #909399;
  margin-bottom: 3px;
}

.option-choices {
  margin-top: 8px;
  border-top: 1px dashed #e0e0e0;
  padding-top: 8px;
}

.option-choice {
  margin-bottom: 5px;
  padding: 5px;
  background-color: #f5f7fa;
  border-radius: 3px;
}

.choice-tag {
  font-weight: bold;
  font-size: 0.9em;
  color: #409eff;
  margin-bottom: 3px;
}

.delay-round {
  font-weight: bold;
  color: #e6a23c;
  margin-bottom: 5px;
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