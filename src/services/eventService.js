// 解析带注释的JSON
export const parseJsonWithComments = (jsonString) => {
  // 移除单行注释
  const noComments = jsonString.replace(/\/\/.*$/gm, '');
  try {
    return JSON.parse(noComments);
  } catch (e) {
    console.error('解析JSON失败:', e);
    return null;
  }
};

// 处理重复键的问题
export const handleDuplicateKeys = (eventData) => {
  // 检查success和failed中是否有重复的event_on键
  if (eventData.settlement) {
    eventData.settlement.forEach(item => {
      if (item.action && item.action.success && Array.isArray(item.action.success.event_on)) {
        // 已经是数组，不需要处理
      } else if (item.action && item.action.success && item.action.success.event_on) {
        // 将单个值转换为数组
        const eventOn = item.action.success.event_on;
        item.action.success.event_on = [eventOn];
      }
      
      if (item.action && item.action.failed && Array.isArray(item.action.failed.event_on)) {
        // 已经是数组，不需要处理
      } else if (item.action && item.action.failed && item.action.failed.event_on) {
        // 将单个值转换为数组
        const eventOn = item.action.failed.event_on;
        item.action.failed.event_on = [eventOn];
      }
    });
  }
  
  return eventData;
};

// 加载事件数据
export const loadEventData = async (eventId) => {
  try {
    // 使用fetch API加载JSON文件
    const response = await fetch(`/src/assets/config/event/${eventId}.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    const parsedData = parseJsonWithComments(text);
    return handleDuplicateKeys(parsedData);
  } catch (e) {
    console.error(`加载事件 ${eventId} 失败:`, e);
    return null;
  }
};

// 获取事件的子节点
export const getChildEvents = (eventData) => {
  const childEvents = [];
  
  if (eventData.settlement) {
    eventData.settlement.forEach(item => {
      if (item.action) {
        // 检查success中的event_on
        if (item.action.success && item.action.success.event_on) {
          if (Array.isArray(item.action.success.event_on)) {
            childEvents.push(...item.action.success.event_on);
          } else {
            childEvents.push(item.action.success.event_on);
          }
        }
        
        // 检查failed中的event_on
        if (item.action.failed && item.action.failed.event_on) {
          if (Array.isArray(item.action.failed.event_on)) {
            childEvents.push(...item.action.failed.event_on);
          } else {
            childEvents.push(item.action.failed.event_on);
          }
        }
      }
    });
  }
  
  return [...new Set(childEvents)]; // 去重
};