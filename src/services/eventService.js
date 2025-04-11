// 解析带注释的JSON
export const parseJsonWithComments = (jsonString) => {
  try {
    // 检查输入是否为空
    if (!jsonString) {
      console.error('输入的JSON字符串为空');
      return null;
    }
    
    // 先将转义的换行符替换为实际的换行符
    jsonString = jsonString.replace(/\\n/g, '\n');
    jsonString = jsonString.replace(/\\r/g, '');
    jsonString = jsonString.replace(/\\t/g, '');
    // console.log("初始JSON", jsonString);

    // 移除单行注释，但保留引号内的注释样式文本
    // 正确处理换行符，确保注释只到换行符为止
    let noComments = jsonString.replace(/([^"\\]|^)\/\/[^\n]*/g, '$1');
    // console.log("移除单行注释，但保留引号内的注释样式文本", noComments);

    // 处理特殊格式问题，如表达式中的等号
    noComments = noComments.replace(/"([^"]+)=([^"]+)":/g, '"$1_EQUALS_$2":');
    
    // 处理特殊键名，如counter+7000101
    noComments = noComments.replace(/"([^"]+)\+([^"]+)":/g, '"$1_PLUS_$2":');
    
    // 尝试解析JSON
    try {
      // 使用自定义解析器处理重复键
      const result = parseJSONWithDuplicateKeys(noComments);
      return result;
    } catch (parseError) {
      console.log("第一次解析失败，尝试更严格的清理", noComments);
      console.log("第一次解析失败，尝试更严格的清理...", parseError);
      
      // 移除所有注释（包括多行注释）
      // 修改单行注释的正则表达式
      noComments = noComments.replace(/\/\*[\s\S]*?\*\//g, '');
      noComments = noComments.replace(/([^\\]|^)\/\/[^\n]*(\n|$)/gm, '$1$2');
      
      // 处理可能存在的尾随逗号
      noComments = noComments.replace(/,(\s*[}\]])/g, '$1');
      
      // 处理可能存在的非标准JSON语法
      noComments = noComments.replace(/([{,])\s*([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
      
      // 处理可能存在的单引号
      noComments = noComments.replace(/'/g, '"');
      
      // 处理可能存在的非法转义字符
      noComments = noComments.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1');
      
      try {
        // 再次尝试使用自定义解析器
        const result = parseJSONWithDuplicateKeys(noComments);
        return result;
      } catch (finalError) {
        console.error('严格清理后仍然解析失败:', finalError);
        
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

// 自定义解析器处理重复键
/* eslint-disable */
function parseJSONWithDuplicateKeys(jsonString) {
  // 使用正则表达式匹配所有键值对
  const keyValuePairs = [];
  const keyRegex = /"([^"]+)"\s*:\s*([^,}\]]+|{[^}]*}|\[[^\]]*\]|"[^"]*")/g;
  
  let match;
  const keyMap = new Map();
  
  // 收集所有键值对
  while ((match = keyRegex.exec(jsonString)) !== null) {
    const key = match[1];
    const value = match[2].replace(/\\n|\\r|\s+/g, ''); // 移除换行符和空格
    
    // 检查是否是重复键
    if (key === 'rite' || key === 'event_on') {
      if (!keyMap.has(key)) {
        keyMap.set(key, []);
      }
      // 仅在值不重复且不与当前事件id一致时添加
      if (!keyMap.get(key).includes(value) && value !== jsonString.id) {
        keyMap.get(key).push(value);
        // console.log(key, value);
      }
    }
    
    keyValuePairs.push({ key, value, index: match.index });
  }
  
  // 尝试使用更安全的方式解析JSON
  try {
    // 先尝试清理JSON字符串
    let cleanedJson = jsonString;
    
    // 移除所有注释，修改单行注释的正则表达式
    cleanedJson = cleanedJson.replace(/\/\/[^\n]*(\n|$)/gm, '$1');

    cleanedJson = cleanedJson.replace(/\/\*[\s\S]*?\*\//g, '');
    // console.log("移除所有注释，修改单行注释的正则表达式2", cleanedJson);
    
    // 处理换行符，将其替换为空格
    cleanedJson = cleanedJson.replace(/\n/g, ' ');
    // console.log("处理换行符，将其替换为空格", cleanedJson);
    
    // 处理可能存在的尾随逗号
    cleanedJson = cleanedJson.replace(/,(\s*[}\]])/g, '$1');
    // console.log("处理可能存在的尾随逗号", cleanedJson);
    
    // 使用Function构造函数创建一个沙箱环境
    try {
      const jsonObj = new Function('return ' + cleanedJson)();
      
      // 处理重复键
      for (const [key, values] of keyMap.entries()) {
        if (values.length > 1) {
          // 递归查找并修复对象中的重复键
          fixDuplicateKeys(jsonObj, key, values);
        }
      }
      
      console.log("最终JSON对象", jsonObj);
      return jsonObj;
    } catch (evalError) {
      console.error('使用Function解析JSON失败:', evalError);
      
      // 尝试使用JSON5解析，它更宽松
      try {
        // 如果有JSON5库可用，可以使用它
        // 这里我们使用一个简单的手动解析方法
        
        // 尝试手动修复一些常见问题
        cleanedJson = cleanedJson.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
        cleanedJson = cleanedJson.replace(/'/g, '"');
        console.log("第一次尝试修复", cleanedJson);

        // 尝试使用标准JSON解析
        return JSON.parse(cleanedJson);
      } catch (jsonError) {
        console.error('JSON.parse解析失败:', jsonError);
        
        // 如果所有方法都失败，尝试使用正则表达式提取关键信息
        const idMatch = /"id"\s*:\s*(\d+)/.exec(cleanedJson);
        const textMatch = /"text"\s*:\s*"([^"]*)"/.exec(cleanedJson);
        console.log("第二次尝试修复", idMatch, textMatch);

        
        if (idMatch && textMatch) {
          return {
            id: parseInt(idMatch[1]),
            text: textMatch[1],
            _parseError: true,
            _originalContent: jsonString
          };
        }
        
        throw jsonError;
      }
    }
  } catch (e) {
    console.error('解析JSON过程中发生错误:', e);
    throw e;
  }
}

// 递归查找并修复对象中的重复键
function fixDuplicateKeys(obj, targetKey, values) {
  if (!obj || typeof obj !== 'object') return;
  
  // 检查当前对象是否有目标键
  if (Object.prototype.hasOwnProperty.call(obj, targetKey)) {
    // 将值转换为数组
    if (!Array.isArray(obj[targetKey])) {
      obj[targetKey] = [obj[targetKey]];
    }
    
    // 添加其他值
    for (let i = 1; i < values.length; i++) {
      let value = values[i];
      
      // 尝试解析值
      try {
        if (typeof value === 'string') {
          // 如果是数字字符串，转换为数字
          if (/^\d+$/.test(value)) {
            value = parseInt(value);
          }
          // 如果是对象或数组字符串，解析它
          else if (/^[\{\[]/.test(value)) {
            value = JSON.parse(value);
          }
        }
      } catch (e) {
        console.warn('解析值失败:', e);
      }
      
      obj[targetKey].push(value);
    }
  }
  
  // 递归处理子对象
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && typeof obj[key] === 'object') {
      fixDuplicateKeys(obj[key], targetKey, values);
    }
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'object') {
        fixDuplicateKeys(obj[i], targetKey, values);
      }
    }
  }
}
/* eslint-enable */

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
  
  // 递归处理对象，查找所有包含rite或event的属性
  const processObject = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    // 检查对象是否同时包含id和type属性
    if (obj.id && obj.type) {
      const id = obj.id;
      console.log(obj)
      const type = obj.type;
      
      // 根据type类型添加不同前缀的ID
      if (type === 'event') {
        if (typeof id === 'number' || /^\d+$/.test(id)) {
          childIds.add(parseInt(id));
        }
      } else if (type === 'rite') {
        childIds.add(`rite_${id}`);
      } else if (type === 'loot') {
        childIds.add(`loot_${id}`);
      }
    }
    
    // 遍历对象的所有属性
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      
      // 处理rite属性
      if (key === 'rite') {
        if (Array.isArray(value)) {
          value.forEach(id => childIds.add(`rite_${id}`));
        } else if (value) {
          childIds.add(`rite_${value}`);
        }
      }
      // 处理包含event的属性（如event_on）
      else if (key.includes('event') && key !== 'event_text' && key !== 'event_tips') {
        if (Array.isArray(value)) {
          value.forEach(id => {
            if (id && typeof id === 'number') childIds.add(id);
          });
        } else if (value && typeof value === 'number') {
          childIds.add(value);
        }
      }
      // 处理loot属性
      else if (key === 'loot') {
        if (Array.isArray(value)) {
          value.forEach(id => {
            if (id && typeof id === 'number') childIds.add(`loot_${id}`);
          });
        } else if (value && typeof value === 'number') {
          childIds.add(`loot_${value}`);
        }
      }
      
      // 递归处理子对象和数组
      if (typeof value === 'object') {
        processObject(value, currentPath);
      }
    });
    
    // 如果是数组，处理数组中的每个元素
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (typeof item === 'object') {
          processObject(item, `${path}[${index}]`);
        }
      });
    }
  };
  // 开始递归处理
  processObject(eventData);
  
  return Array.from(childIds);
};

// 修改按名称搜索事件的函数，使用索引文件
export async function searchEventsByName(name, types = ['event']) {
  try {
    const index = await loadGameDataIndex();
    
    // 过滤符合条件的项目
    return index.filter(item => {
      // 检查类型是否匹配
      if (!types.includes(item.type)) {
        return false;
      }
      
      // 检查名称或文本是否包含搜索词
      const itemName = item.name || '';
      const itemText = item.text || '';
      const searchTerm = name.toLowerCase();
      
      return itemName.toLowerCase().includes(searchTerm) || 
             itemText.toLowerCase().includes(searchTerm);
    });
  } catch (e) {
    console.error('搜索失败:', e);
    return [];
  }
}

// 添加一个函数来获取指定类型的所有事件
export async function getEventsByType(type, page = 1, pageSize = 10) {
  try {
    const index = await loadGameDataIndex();
    
    // 过滤指定类型的项目
    const filteredItems = index.filter(item => item.type === type);
    console.log(filteredItems);
    
    // 计算分页
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      items: filteredItems.slice(startIndex, endIndex),
      total: filteredItems.length,
      totalPages: Math.ceil(filteredItems.length / pageSize)
    };
  } catch (e) {
    console.error(`获取${type}列表失败:`, e);
    return { items: [], total: 0, totalPages: 0 };
  }
}

// 添加一个函数来加载索引文件
let gameDataIndex = null;

export async function loadGameDataIndex() {
  if (gameDataIndex !== null) {
    return gameDataIndex;
  }
  
  try {
    // 使用require直接导入JSON文件，而不是通过fetch请求
    const response = require('@/assets/game_data_index.json');
    gameDataIndex =  JSON.parse(response);
    return gameDataIndex;
  } catch (e) {
    console.error('加载游戏数据索引失败:', e);
    throw e;
  }
}


// 加载事件数据
export const loadEventData = async (eventId, type) => {
  if(type == 'rite'){
    eventId = 'rite_' + eventId; 
  }
  if(type == 'loot'){
    eventId = 'loot_' + eventId; 
  }
  try {
    // 判断是否是rite或loot类型的ID
    const isRite = typeof eventId === 'string' && eventId.startsWith('rite_');
    const isLoot = typeof eventId === 'string' && eventId.startsWith('loot_');
    
    let directory = 'event';
    let id = eventId;
    
    if (isRite) {
      directory = 'rite';
      id = eventId.substring(5);
    } else if (isLoot) {
      directory = 'loot';
      id = eventId.substring(5);
    }
    
    // 使用require加载JSON文件
    // console.log("加载的JSON文本", `raw-loader!@/assets/config/${directory}/${id}.json`);
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
    
    // 处理转义的引号和换行符，但保留原始结构
    jsonContent = jsonContent.replace(/\\"/g, '"');
    // 不要替换换行符，保留原始格式
    // jsonContent = jsonContent.replace(/\\r\\n/g, '\n');
    // 先将转义的换行符替换为实际的换行符
    jsonContent = jsonContent.replace(/\\n/g, '\n');
    jsonContent = jsonContent.replace(/\\r/g, '');
    jsonContent = jsonContent.replace(/\\t/g, '');

    
    
    // console.log("原始数据", eventJsonText);
    // console.log("处理后的数据", jsonContent);
    
    // 直接尝试使用JSON.parse解析，不进行额外的注释处理
    try {
      // 先尝试直接解析，这适用于格式良好的JSON
      const eventData = JSON.parse(jsonContent);
      let result = handleDuplicateKeys(eventData);
      result.eventId = eventId;
      return result;
    } catch (directParseError) {
      // console.log("直接解析失败，尝试预处理...", directParseError);
      
      // 如果直接解析失败，尝试使用我们的自定义解析器
      try {
        // 使用自定义解析器，但不进行注释处理
        const eventData = parseJsonWithComments(jsonContent);
        if (eventData) {
          let result = handleDuplicateKeys(eventData);
          result.eventId = eventId;
          return result;
        }
      } catch (parseError) {
        console.error(`解析事件 ${eventId} 失败:`, parseError);
        
        // 最后的尝试：手动构建一个基本对象
        try {
          // 提取关键信息
          const idMatch = /"id"\s*:\s*(\d+)/.exec(jsonContent);
          const textMatch = /"text"\s*:\s*"([^"]*)"/.exec(jsonContent);
          
          if (idMatch && textMatch) {
            return {
              id: parseInt(idMatch[1]),
              eventId: eventId,
              text: textMatch[1],
              _parseError: true,
              _originalContent: jsonContent
            };
          }
        } catch (finalError) {
          console.error(`最终解析事件 ${eventId} 失败:`, finalError);
        }
      }
    }
    
    return null;
  } catch (e) {
    console.error(`加载事件 ${eventId} 失败:`, e);
    // 创建一个错误占位对象
    return {
      id: eventId,
      eventId: eventId,
      text: `加载失败 (${eventId})`,
      _loadError: true,
      _errorMessage: e.message
    };
  }
};

// ... 现有代码 ...

// 添加一个变量来缓存卡片数据
let cardsData = null;

// 加载卡片数据并缓存
export async function loadCardsData() {
  if (cardsData !== null) {
    return cardsData;
  }
  
  try {
    // 使用require直接导入JSON文件
    const response = require('raw-loader!@/assets/config/cards_simplified.json').default;
    
    // 处理JSON内容 - 处理module.exports包装
    let jsonContent = response;
    if (jsonContent.startsWith('module.exports = ')) {
      jsonContent = jsonContent.substring(16);
    }
    
    // 移除字符串首尾的引号和分号
    jsonContent = jsonContent.trim();
    if (jsonContent.startsWith('"') && jsonContent.endsWith('";')) {
      jsonContent = jsonContent.substring(1, jsonContent.length - 2);
    } else if (jsonContent.startsWith('"') && jsonContent.endsWith('"')) {
      jsonContent = jsonContent.substring(1, jsonContent.length - 1);
    }
    
    // 处理转义字符
    jsonContent = jsonContent.replace(/\\"/g, '"');
    jsonContent = jsonContent.replace(/\\n/g, '\n');
    jsonContent = jsonContent.replace(/\\r/g, '');
    jsonContent = jsonContent.replace(/\\t/g, '');
    
    try {
      // 尝试直接解析
      cardsData = JSON.parse(jsonContent);
    } catch (directParseError) {
      // 如果直接解析失败，尝试使用自定义解析器
      cardsData = parseJsonWithComments(jsonContent);
    }
    
    return cardsData;
  } catch (e) {
    console.error('加载卡片数据失败:', e);
    throw e;
  }
}

// 根据卡片ID获取卡片信息
export async function getCardById(cardId) {
  try {
    const cards = await loadCardsData();
    return cards.find(card => card.id === cardId || card.id === parseInt(cardId));
  } catch (e) {
    console.error(`获取卡片 ${cardId} 信息失败:`, e);
    return null;
  }
}

// 根据卡片类型获取卡片列表
export async function getCardsByType(type) {
  try {
    const cards = await loadCardsData();
    return cards.filter(card => card.type === type);
  } catch (e) {
    console.error(`获取类型为 ${type} 的卡片列表失败:`, e);
    return [];
  }
}

// ... 现有代码 ...