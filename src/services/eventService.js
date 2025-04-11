// 解析带注释的JSON
export const parseJsonWithComments = (jsonString) => {
  try {
    // 移除单行注释
    let noComments = jsonString.replace(/\/\/.*$/gm, '');
    
    // 处理可能存在的重复键问题（先转换为字符串形式）
    // 使用正则表达式匹配JSON对象中的键值对
    const keyValueRegex = /"([^"]+)":\s*([^,}\]]+)/g;
    const keys = new Map();
    let match;
    
    while ((match = keyValueRegex.exec(noComments)) !== null) {
      const key = match[1];
      if (keys.has(key)) {
        // 如果是重复键，可能需要特殊处理
        console.log(`检测到重复键: ${key}`);
      }
      keys.set(key, match[2]);
    }
    
    // 处理特殊格式问题，如表达式中的等号
    noComments = noComments.replace(/"([^"]+)=([^"]+)":/g, '"$1_$2":');
    
    // 尝试解析JSON
    try {
      return JSON.parse(noComments);
    } catch (parseError) {
      // 如果解析失败，尝试更严格的清理
      console.log("第一次解析失败，尝试更严格的清理...");
      
      // 移除所有注释（包括多行注释）
      noComments = noComments.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      
      // 处理可能存在的尾随逗号
      noComments = noComments.replace(/,(\s*[}\]])/g, '$1');
      
      // 处理可能存在的非标准JSON语法
      noComments = noComments.replace(/([{,])\s*([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
      
      // 处理可能存在的单引号
      noComments = noComments.replace(/'/g, '"');
      
      // 处理可能存在的非法转义字符
      noComments = noComments.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1');
      
      // 再次尝试解析
      try {
        return JSON.parse(noComments);
      } catch (finalError) {
        // 如果仍然失败，尝试手动解析关键部分
        console.error('严格清理后仍然解析失败:', finalError);
        console.log('尝试手动解析关键部分...');
        console.log('报错结果:', jsonString, noComments);
        
        // 提取关键信息构建一个简化的对象
        const idMatch = /"id"\s*:\s*(\d+)/.exec(noComments);
        const textMatch = /"text"\s*:\s*"([^"]*)"/.exec(noComments);
        
        if (idMatch && textMatch) {
          const simpleObj = {
            id: parseInt(idMatch[1]),
            text: textMatch[1],
            _parseError: true,
            _originalContent: jsonString
          };
          console.log('创建了简化对象:', simpleObj);
          return simpleObj;
        }
        
        return null;
      }
    }
  } catch (e) {
    console.error('解析JSON过程中发生错误:', e);
    return null;
  }
};

// 处理重复键的问题
export const handleDuplicateKeys = (eventData) => {
  if (!eventData) return null;
  
  // 如果是解析错误的简化对象，直接返回
  if (eventData._parseError) {
    return eventData;
  }
  
  // 检查success和failed中是否有重复的event_on键
  if (eventData.settlement) {
    eventData.settlement.forEach(item => {
      if (item.action) {
        // 处理action中可能存在的多个rite属性
        if (item.action.rite) {
          if (!Array.isArray(item.action.rite)) {
            // 将单个值转换为数组
            const riteValues = [];
            // 遍历对象的所有键
            Object.keys(item.action).forEach(key => {
              if (key === 'rite') {
                riteValues.push(item.action[key]);
                // 删除原始键，后面会重新添加
                delete item.action[key];
              }
            });
            // 重新添加为数组
            if (riteValues.length > 0) {
              item.action.rite = riteValues;
            }
          }
        }
        
        // 处理success中的event_on
        if (item.action.success && item.action.success.event_on) {
          if (!Array.isArray(item.action.success.event_on)) {
            item.action.success.event_on = [item.action.success.event_on];
          }
        }
        
        // 处理failed中的event_on
        if (item.action.failed && item.action.failed.event_on) {
          if (!Array.isArray(item.action.failed.event_on)) {
            item.action.failed.event_on = [item.action.failed.event_on];
          }
        }
        
        // 处理直接在action中的event_on
        if (item.action.event_on) {
          if (!Array.isArray(item.action.event_on)) {
            const eventOnValues = [];
            // 遍历对象的所有键
            Object.keys(item.action).forEach(key => {
              if (key === 'event_on') {
                eventOnValues.push(item.action[key]);
                // 删除原始键，后面会重新添加
                delete item.action[key];
              }
            });
            // 重新添加为数组
            if (eventOnValues.length > 0) {
              item.action.event_on = eventOnValues;
            }
          }
        }
      }
    });
  }
  
  return eventData;
};

// 获取事件的所有子节点ID
export const getChildEventIds = (eventData) => {
  const childIds = new Set();
  
  if (!eventData) return Array.from(childIds);
  
  // 如果是解析错误的简化对象，返回空数组
  if (eventData._parseError) {
    return Array.from(childIds);
  }
  
  if (eventData.settlement) {
    eventData.settlement.forEach(item => {
      if (item.action) {
        // 检查直接在action中的event_on
        if (item.action.event_on) {
          if (Array.isArray(item.action.event_on)) {
            item.action.event_on.forEach(id => childIds.add(id));
          } else {
            childIds.add(item.action.event_on);
          }
        }
        
        // 检查success中的event_on
        if (item.action.success && item.action.success.event_on) {
          if (Array.isArray(item.action.success.event_on)) {
            item.action.success.event_on.forEach(id => childIds.add(id));
          } else {
            childIds.add(item.action.success.event_on);
          }
        }
        
        // 检查failed中的event_on
        if (item.action.failed && item.action.failed.event_on) {
          if (Array.isArray(item.action.failed.event_on)) {
            item.action.failed.event_on.forEach(id => childIds.add(id));
          } else {
            childIds.add(item.action.failed.event_on);
          }
        }
        
        // 检查action中的rite属性
        if (item.action.rite) {
          if (Array.isArray(item.action.rite)) {
            item.action.rite.forEach(id => {
              // 添加rite_前缀以区分
              childIds.add(`rite_${id}`);
            });
          } else {
            childIds.add(`rite_${item.action.rite}`);
          }
        }
      }
    });
  }
  
  // 检查顶层rite属性
  if (eventData.rite) {
    if (Array.isArray(eventData.rite)) {
      eventData.rite.forEach(id => childIds.add(`rite_${id}`));
    } else {
      childIds.add(`rite_${eventData.rite}`);
    }
  }
  
  return Array.from(childIds);
};

// 加载事件数据
export const loadEventData = async (eventId) => {
  try {
    // 判断是否是rite类型的ID
    const isRite = typeof eventId === 'string' && eventId.startsWith('rite_');
    const directory = isRite ? 'rite' : 'event';
    const id = isRite ? eventId.substring(5) : eventId;
    
    // 使用require加载JSON文件
    const eventJsonText = require(`raw-loader!@/assets/config/${directory}/${id}.json`).default;

    // 提取JSON内容 - 处理module.exports包装
    let jsonContent = eventJsonText;
    if (jsonContent.startsWith('module.exports = ')) {
      // 移除 module.exports = 和首尾的引号
      jsonContent = jsonContent.substring(16);
    }
    
    // 移除字符串首尾的引号和分号
    jsonContent = jsonContent.trim();
    if (jsonContent.startsWith('"') && jsonContent.endsWith('";')) {
      jsonContent = jsonContent.substring(1, jsonContent.length - 2);
    } else if (jsonContent.startsWith('"') && jsonContent.endsWith('"')) {
      jsonContent = jsonContent.substring(1, jsonContent.length - 1);
    }
    
    // 处理转义的引号和换行符
    jsonContent = jsonContent.replace(/\\"/g, '"').replace(/\\r\\n/g, '\n');
    
    console.log("原始数据", eventJsonText);
    console.log("处理后的数据", jsonContent);
    const eventData = parseJsonWithComments(jsonContent);
    
    if (eventData) {
      return handleDuplicateKeys(eventData);
    }
    return null;
  } catch (e) {
    console.error(`加载事件 ${eventId} 失败:`, e);
    // 创建一个错误占位对象
    return {
      id: eventId,
      text: `加载失败 (${eventId})`,
      _loadError: true,
      _errorMessage: e.message
    };
  }
};