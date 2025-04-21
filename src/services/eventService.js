// 在文件顶部添加 JSON5 导入
import JSON5 from 'json5';

// 解析带注释的JSON
export const parseJsonWithComments = (jsonString) => {
  try {
    // 检查输入是否为空
    if (!jsonString) {
      console.error('输入的JSON字符串为空');
      return null;
    }

    try {
      // 使用自定义解析器处理重复键
      const result = JSON5.parse(jsonString);
      return result;
    } catch (parseError) {
      console.error("第一次解析失败，尝试使用JSON5解析器", parseError);
    }
    
    // 先将转义的换行符替换为实际的换行符
    jsonString = jsonString.replace(/\\n/g, '\n');
    jsonString = jsonString.replace(/\\r/g, '');
    jsonString = jsonString.replace(/\\t/g, '');
    
    

    // 移除单行注释，但保留引号内的注释样式文本
    // 正确处理换行符，确保注释只到换行符为止
    let noComments = jsonString.replace(/([^"\\]|^)\/\/[^\n]*/g, '$1');

    // 处理特殊格式问题，如表达式中的等号
    noComments = noComments.replace(/"([^"]+)=([^"]+)":/g, '"$1_EQUALS_$2":');
    
    // 处理特殊键名，如counter+7000101
    noComments = noComments.replace(/"([^"]+)\+([^"]+)":/g, '"$1_PLUS_$2":');
    
    // 处理尾随逗号问题 - 在对象和数组结束前的逗号
    noComments = noComments.replace(/,(\s*[\]}])/g, '$1');
    
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
      
      // 处理可能存在的尾随逗号 - 更严格的处理
      noComments = noComments.replace(/,(\s*[}\]])/g, '$1');
      // 处理对象内部的尾随逗号
      noComments = noComments.replace(/,(\s*})/g, '$1');
      // 处理数组内部的尾随逗号
      noComments = noComments.replace(/,(\s*\])/g, '$1');
      
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


// 创建一个全局变量来存储注释缓存
let globalCommentCache = {};
let loadDefaultCache = false;


// 获取注释缓存
export function getCommentFromCache(counterId) {
  try {
    // 使用全局变量而不是localStorage
    let commentCache = globalCommentCache;
    
    // 如果缓存为空对象，尝试从默认配置加载
    if (!loadDefaultCache || Object.keys(commentCache).length === 0) {
      try {
        // 导入默认缓存配置
        const defaultCache = JSON.parse(require('@/assets/defaultCommentCache.json'));
        // 直接使用默认缓存
        globalCommentCache = defaultCache;
        commentCache = defaultCache;
        loadDefaultCache = true;
      } catch (e) {
        console.error('加载默认缓存配置失败:', e);
        commentCache = {};
      }
    }
    // console.log("获取注释缓存", counterId, commentCache, commentCache[counterId]);
    
    // 先尝试直接获取counterId对应的缓存
    if (commentCache[counterId]) {
      return commentCache[counterId];
    }
    
    // 检查是否为全局计数器ID (通常以g开头)
    if (counterId.toString().startsWith('g')) {
      // 使用正则表达式提取数字部分，而不仅仅是移除g前缀
      const baseId = counterId.toString().replace(/\D/g, ''); // 移除所有非数字字符
      return commentCache[baseId] || null;
    }
    
    // 检查是否存在对应的全局计数器缓存
    const globalId = `g${counterId}`;
    if (commentCache[globalId]) {
      return commentCache[globalId];
    }
    
    return null;
  } catch (e) {
    console.error('获取注释缓存失败:', e);
    return null;
  }
}


// ... 省略部分代码 ...

// 递归查找并修复对象中的重复键
function fixDuplicateKeys(obj, key, values) {
  if (!obj || typeof obj !== 'object') return;

  // 如果当前对象有该key且不是数组，则替换为数组
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    if (!Array.isArray(obj[key])) {
      obj[key] = values.map(val => {
        // 尝试将数字字符串转换为数字
        if (/^\d+$/.test(val)) {
          return parseInt(val);
        }
        return val;
      });
    }
  }

  // 递归处理子对象
  for (const prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop) && typeof obj[prop] === 'object') {
      fixDuplicateKeys(obj[prop], key, values);
    }
  }
}

// ... 省略部分代码 ...

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
    
    // 检查是否是需要处理为数组的重复键
    const keysToArrayify = ['rite', 'event_on', 'rite_end', 'card', 'loot'];
    if (keysToArrayify.includes(key) || keysToArrayify.some(k => key.endsWith(`.${k}`))) {
      if (!keyMap.has(key)) {
        keyMap.set(key, []);
      }
      // 仅在值不重复且不与当前事件id一致时添加
      if (!keyMap.get(key).includes(value) && value !== jsonString.id) {
        keyMap.get(key).push(value);
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
    
    // 处理换行符，将其替换为空格
    cleanedJson = cleanedJson.replace(/\n/g, ' ');
    
    // 处理可能存在的尾随逗号 - 更全面的处理
    cleanedJson = cleanedJson.replace(/,(\s*[}\]])/g, '$1');
    // 处理对象内部的尾随逗号
    cleanedJson = cleanedJson.replace(/,(\s*})/g, '$1');
    // 处理数组内部的尾随逗号
    cleanedJson = cleanedJson.replace(/,(\s*\])/g, '$1');
    
    // 处理特殊字符和转义序列
    // 处理字体标签中的引号问题
    cleanedJson = cleanedJson.replace(/<font=\\?"([^"]+)\\?">/g, '<font="$1">');
    
    // 处理反斜杠后跟着换行的情况
    cleanedJson = cleanedJson.replace(/\\(\s+)/g, ' ');
    
    // 使用JSON.parse直接尝试解析，避免使用Function构造函数
    try {
      // 使用自定义的JSON解析函数处理重复键
      const jsonObj = parseJSONWithArrays(cleanedJson, keyMap);
      return jsonObj;
    } catch (jsonParseError) {
      console.error('自定义JSON解析失败，尝试使用标准JSON.parse:', jsonParseError);
      
      try {
        // 标准JSON.parse不能处理重复键，所以我们需要先处理重复键
        // 这里我们使用一个简单的方法：将JSON字符串转换为对象，然后手动处理重复键
        const jsonObj = JSON.parse(cleanedJson);
        
        // 处理重复键
        for (const [key, values] of keyMap.entries()) {
          if (values.length > 1) {
            // 递归查找并修复对象中的重复键
            fixDuplicateKeys(jsonObj, key, values);
          }
        }
        
        return jsonObj;
      } catch (standardParseError) {
        console.error('标准JSON.parse解析失败，尝试使用Function:', standardParseError);
        
        // 如果JSON.parse失败，再尝试使用Function构造函数
        try {
          // 进一步处理可能导致Function构造函数失败的特殊字符
          cleanedJson = cleanedJson.replace(/<font=[^>]+>/g, '');  // 移除字体标签
          cleanedJson = cleanedJson.replace(/<\/font>/g, '');      // 移除字体结束标签
          cleanedJson = cleanedJson.replace(/<[^>]+>/g, '');       // 移除其他HTML标签
          
          // 处理Title SDF等特殊标识符
          cleanedJson = cleanedJson.replace(/Title SDF/g, '"Title SDF"');
          
          const jsonObj = new Function('return ' + cleanedJson)();
          
          // 处理重复键
          for (const [key, values] of keyMap.entries()) {
            if (values.length > 1) {
              // 递归查找并修复对象中的重复键
              fixDuplicateKeys(jsonObj, key, values);
            }
          }
          
          return jsonObj;
        } catch (evalError) {
          console.error('使用Function解析JSON失败:', evalError);
        }
      }
      
      // 尝试使用JSON5解析，它更宽松
      try {
        // 如果有JSON5库可用，可以使用它
        // 这里我们使用一个简单的手动解析方法
        
        // 尝试手动修复一些常见问题
        cleanedJson = cleanedJson.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
        cleanedJson = cleanedJson.replace(/'/g, '"');
        // 再次处理尾随逗号
        cleanedJson = cleanedJson.replace(/,(\s*[}\]])/g, '$1');
        console.log("第一次尝试修复", jsonString, cleanedJson);

        // 尝试使用标准JSON解析
        return JSON.parse(cleanedJson);
      } catch (jsonError) {
        console.error('JSON.parse解析失败:', jsonError);

        try {
          const result = JSON5.parse(jsonString);
          return result;
        }catch (finalError) {
          console.error('JSON5仍然解析失败:', finalError);
        }

        
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

function parseJSONWithArrays(jsonString, keyMap) {
  // 先使用标准JSON.parse解析
  const obj = JSON.parse(jsonString);
  
  // 然后处理重复键
  for (const [key, values] of keyMap.entries()) {
    if (values.length > 0) {
      // 找到包含该键的对象和路径
      const pathParts = key.split('.');
      const finalKey = pathParts[pathParts.length - 1];
      
      // 如果是简单键（没有点号），需要确定它在哪个嵌套对象中
      if (pathParts.length === 1) {
        // 查找该键在原始JSON中的位置
        const keyRegex = new RegExp(`"${key}"\\s*:`, 'g');
        let match;
        const positions = [];
        
        while ((match = keyRegex.exec(jsonString)) !== null) {
          positions.push(match.index);
        }
        
        if (positions.length > 0) {
          // 对于每个位置，确定它所在的嵌套对象
          for (const pos of positions) {
            // 向前查找最近的左大括号
            let braceCount = 0;
            let objectStart = -1;
            
            for (let i = pos; i >= 0; i--) {
              if (jsonString[i] === '{') {
                braceCount++;
                if (objectStart === -1) {
                  objectStart = i;
                }
              } else if (jsonString[i] === '}') {
                braceCount--;
              }
              
              // 找到包含该键的对象
              if (braceCount === 1 && objectStart !== -1) {
                // 尝试确定这个对象在整个JSON中的路径
                const objPath = findObjectPath(obj, jsonString.substring(objectStart, pos));
                
                if (objPath) {
                  // 找到了路径，将值设置到正确的位置
                  let current = obj;
                  for (let j = 0; j < objPath.length - 1; j++) {
                    current = current[objPath[j]];
                  }
                  
                  // 将值转换为数组
                  const parsedValues = values.map(val => {
                    // 尝试将数字字符串转换为数字
                    if (/^\d+$/.test(val)) {
                      return parseInt(val);
                    }
                    return val;
                  });
                  
                  // 设置为数组
                  current[objPath[objPath.length - 1]][key] = parsedValues;
                  
                  // 删除可能错误添加到顶层的数组
                  if (obj[key] && obj[key] !== current[objPath[objPath.length - 1]][key]) {
                    delete obj[key];
                  }
                  
                  break;
                }
              }
            }
          }
        } else {
          // 如果找不到位置，尝试使用默认处理
          processNestedKey(obj, key, values);
        }
      } else {
        // 对于嵌套键，使用路径处理
        processNestedKey(obj, key, values);
      }
    }
  }
  
  return obj;
}

// 查找对象路径
function findObjectPath(obj, objectStart) {
  // 这个函数尝试根据对象的开始部分找到它在整个JSON中的路径
  // 由于这是一个复杂的问题，这里提供一个简化版本
  
  // 提取可能的键
  const keyMatch = /"([^"]+)"\s*:/.exec(objectStart);
  if (!keyMatch) return null;
  
  const possibleKey = keyMatch[1];
  
  // 递归查找包含该键的对象
  const findPath = (current, path = []) => {
    if (!current || typeof current !== 'object') return null;
    
    // 检查当前对象是否有可能的键
    if (Object.prototype.hasOwnProperty.call(current, possibleKey)) {
      return path;
    }
    
    // 递归处理子对象
    if (Array.isArray(current)) {
      for (let i = 0; i < current.length; i++) {
        if (typeof current[i] === 'object') {
          const result = findPath(current[i], [...path, i]);
          if (result) return result;
        }
      }
    } else {
      for (const prop in current) {
        if (Object.prototype.hasOwnProperty.call(current, prop) && 
            typeof current[prop] === 'object') {
          const result = findPath(current[prop], [...path, prop]);
          if (result) return result;
        }
      }
    }
    
    return null;
  };
  
  return findPath(obj);
}
// 处理嵌套键
function processNestedKey(obj, key, values) {
  const pathParts = key.split('.');
  const finalKey = pathParts[pathParts.length - 1];
  
  // 遍历对象树，找到所有包含该键的对象
  const findAndUpdateObjects = (current, path = []) => {
    if (!current || typeof current !== 'object') return;
    
    // 检查当前对象是否有目标键
    if (pathParts.length === 1) {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        // 将值转换为数组
        const parsedValues = values.map(val => {
          // 尝试将数字字符串转换为数字
          if (/^\d+$/.test(val)) {
            return parseInt(val);
          }
          return val;
        });
        
        current[key] = parsedValues;
        return true;
      }
    } else if (path.length === pathParts.length - 1 && 
               path.every((p, i) => p === pathParts[i]) && 
               Object.prototype.hasOwnProperty.call(current, finalKey)) {
      // 找到了完整路径
      const parsedValues = values.map(val => {
        if (/^\d+$/.test(val)) {
          return parseInt(val);
        }
        return val;
      });
      
      current[finalKey] = parsedValues;
      return true;
    }
    
    // 递归处理子对象
    let found = false;
    if (Array.isArray(current)) {
      for (let i = 0; i < current.length; i++) {
        if (typeof current[i] === 'object') {
          found = findAndUpdateObjects(current[i], path) || found;
        }
      }
    } else {
      for (const prop in current) {
        if (Object.prototype.hasOwnProperty.call(current, prop) && 
            typeof current[prop] === 'object') {
          const newPath = [...path];
          if (prop === pathParts[path.length]) {
            newPath.push(prop);
          }
          found = findAndUpdateObjects(current[prop], newPath) || found;
        }
      }
    }
    
    return found;
  };
  
  // 开始查找和更新
  const found = findAndUpdateObjects(obj);
  
  // 如果没有找到匹配的对象，尝试创建路径
  if (!found && pathParts.length > 1) {
    let current = obj;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    
    // 将值转换为数组
    const parsedValues = values.map(val => {
      if (/^\d+$/.test(val)) {
        return parseInt(val);
      }
      return val;
    });
    
    current[finalKey] = parsedValues;
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
      // console.log(obj)
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
    // console.log(filteredItems);
    
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
    
    // 这个文件太大了
    // if(id == '5000002'){
    //   console.error(`文件不存在: ${id}`);
    //   return null;
    // }
    // 使用require加载JSON文件
    // console.log("加载的JSON文本", `raw-loader!@/assets/config/${directory}/${id}.json`);
    const eventJsonText = require(`raw-loader!@/assets/config/${directory}/${id}.json`).default;
    // 判断文件是否存在，如果不存在则返回null
    if (!eventJsonText) {
      console.error(`File not found: @/assets/config/${directory}/${id}.json`);
      return null;
    }

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


// 添加一个变量来缓存结局数据
let oversData = null;

// 加载结局数据并缓存
export async function loadOversData() {
  if (oversData !== null) {
    return oversData;
  }
  
  try {
    // 使用require直接导入JSON文件
    const response = require('raw-loader!@/assets/config/over.json').default;
    
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
      oversData = JSON.parse(jsonContent);
    } catch (directParseError) {
      // 如果直接解析失败，尝试使用自定义解析器
      oversData = parseJsonWithComments(jsonContent);
    }
    
    return oversData;
  } catch (e) {
    console.error('加载结局数据失败:', e);
    return {};
  }
}

// 根据结局ID获取结局信息
export async function getOverById(overId) {
  try {
    const overs = await loadOversData();
    return overs[overId.toString()];
  } catch (e) {
    console.error(`获取结局 ${overId} 信息失败:`, e);
    return null;
  }
}


// 添加一个变量来缓存卡片数据
let cardsData = null;

// 加载卡片数据并缓存
export async function loadCardsData() {
  if (cardsData !== null) {
    return cardsData;
  }
  
  try {
    // 使用require直接导入JSON文件
    const response = require('raw-loader!@/assets/config/cards.json').default;
    
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
    return cards[cardId]
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

// 获取仪式卡位信息
export async function getRiteSlotInfo(riteId, slotId) {
  try {
    // 加载仪式数据
    const riteData = await loadEventData(riteId, 'rite');
    if(slotId[0] != 's'){
      slotId = 's' + slotId;
    }
    
    // 检查是否成功加载数据
    if (!riteData) {
      console.error(`无法加载仪式数据: ${riteId}`);
      return null;
    }
    
    // 检查是否有解析错误
    if (riteData._parseError || riteData._loadError) {
      console.error(`仪式数据解析错误: ${riteId}`, riteData._errorMessage || '未知错误');
      return null;
    }
    
    // 检查是否有cards_slot属性
    if (!riteData.cards_slot) {
      console.error(`仪式数据中没有卡位信息: ${riteId}`);
      return null;
    }
    
    // 获取指定卡位的信息
    const slotInfo = riteData.cards_slot[slotId];
    
    if (!slotInfo) {
      console.error(`仪式 ${riteId} 中没有找到卡位 ${slotId} 的信息`);
      return null;
    }
    
    // 返回卡位信息，并添加仪式ID和卡位ID
    return {
      ...slotInfo,
      riteId: riteId,
      slotId: slotId
    };
  } catch (e) {
    console.error(`获取仪式 ${riteId} 卡位 ${slotId} 信息失败:`, e);
    return null;
  }
}

// 获取仪式所有卡位信息
export async function getAllRiteSlots(riteId) {
  try {
    // 如果riteId不是字符串或不是以rite_开头，则添加前缀
    if (typeof riteId === 'number' || (typeof riteId === 'string' && !riteId.startsWith('rite_'))) {
      riteId = `rite_${riteId}`;
    }
    
    // 加载仪式数据
    const riteData = await loadEventData(riteId, 'rite');
    
    // 检查是否成功加载数据
    if (!riteData || !riteData.cards_slot) {
      console.error(`无法加载仪式卡位数据: ${riteId}`);
      return null;
    }
    
    // 检查是否有解析错误
    if (riteData._parseError || riteData._loadError) {
      console.error(`仪式数据解析错误: ${riteId}`);
      return null;
    }
    
    // 处理所有卡位信息，添加riteId和slotId
    const result = {};
    Object.entries(riteData.cards_slot).forEach(([slotId, slotInfo]) => {
      result[slotId] = {
        ...slotInfo,
        riteId: riteId,
        slotId: slotId
      };
    });
    
    return result;
  } catch (e) {
    console.error(`获取仪式 ${riteId} 所有卡位信息失败:`, e);
    return null;
  }
}


// 添加一个变量来缓存后日谈数据
let afterStoriesData = null;

// 加载后日谈数据
export async function loadAfterStoryById(afterStoryId) {
  try {
    // 使用require加载JSON文件
    const response = require(`raw-loader!@/assets/config/after_story/${afterStoryId}.json`).default;
    
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
      // 先尝试直接解析，这适用于格式良好的JSON
      const afterStoryData = JSON.parse(jsonContent);
      return afterStoryData;
    } catch (directParseError) {
      // console.log(`直接解析后日谈 ${afterStoryId} 失败，尝试使用自定义解析器:`, directParseError);
      
      // 如果直接解析失败，尝试使用我们的自定义解析器
      try {
        // 使用自定义解析器处理带注释的JSON
        const afterStoryData = parseJsonWithComments(jsonContent);
        if (afterStoryData) {
          // 确保extra字段是数组
          if (afterStoryData.extra && !Array.isArray(afterStoryData.extra)) {
            afterStoryData.extra = Object.values(afterStoryData.extra);
          }
          return afterStoryData;
        }
      } catch (parseError) {
        console.error(`解析后日谈 ${afterStoryId} 失败:`, parseError);
        
        // 最后的尝试：手动提取关键信息
        try {
          // 提取关键信息
          const idMatch = /"id"\s*:\s*(\d+)/.exec(jsonContent);
          const nameMatch = /"name"\s*:\s*"([^"]*)"/.exec(jsonContent);
          const extraItems = [];
          
          // 尝试提取extra数组中的项目
          const extraRegex = /"key"\s*:\s*"([^"]*)".+?"result_text"\s*:\s*"([^"]*)"/gs;
          let extraMatch;
          while ((extraMatch = extraRegex.exec(jsonContent)) !== null) {
            extraItems.push({
              key: extraMatch[1],
              result_text: extraMatch[2]
            });
          }
          
          return {
            id: idMatch ? parseInt(idMatch[1]) : afterStoryId,
            name: nameMatch ? nameMatch[1] : `后日谈 ${afterStoryId}`,
            extra: extraItems,
            _parseError: true,
            _originalContent: jsonContent
          };
        } catch (finalError) {
          console.error(`最终解析后日谈 ${afterStoryId} 失败:`, finalError);
        }
      }
    }
    
    return null;
  } catch (e) {
    console.error(`加载后日谈 ${afterStoryId} 失败:`, e);
    return null;
  }
}

// 获取所有后日谈列表
export async function getAfterStories() {
  if (afterStoriesData !== null) {
    return afterStoriesData;
  }
  
  try {
    // 通过遍历文件夹获取后日谈数据
    const afterStoryFiles = require.context('@/assets/config/after_story', false, /\.json$/);
    const fileList = afterStoryFiles.keys();
    
    // 处理文件列表并加载数据
    afterStoriesData = await Promise.all(
      fileList.map(async (filePath) => {
        // 从文件路径中提取ID
        const fileId = filePath.replace(/^\.\//, '').replace(/\.json$/, '');
        
        try {
          // 尝试加载完整数据以获取更准确的信息
          const afterStoryData = await loadAfterStoryById(fileId);
          
          if (afterStoryData) {
            return {
              id: fileId,
              name: afterStoryData.name || `后日谈 ${fileId}`,
              text: afterStoryData.text || (afterStoryData.extra && afterStoryData.extra.length > 0 ? 
                     afterStoryData.extra[0].result_text : ''),
              type: 'after_story',
              extraCount: afterStoryData.extra ? afterStoryData.extra.length : 0
            };
          }
          
          // 如果加载失败，尝试提取基本信息
          const fileContent = afterStoryFiles(filePath).default;
          
          // 提取基本信息
          let jsonContent = fileContent;
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
          
          // 提取基本信息
          const nameMatch = /"name"\s*:\s*"([^"]*)"/.exec(jsonContent);
          const textMatch = /"result_text"\s*:\s*"([^"]*)"/.exec(jsonContent);
          
          return {
            id: fileId,
            name: nameMatch ? nameMatch[1] : `后日谈 ${fileId}`,
            text: textMatch ? textMatch[1] : '',
            type: 'after_story'
          };
        } catch (e) {
          console.error(`提取后日谈 ${fileId} 基本信息失败:`, e);
          return {
            id: fileId,
            name: `后日谈 ${fileId}`,
            text: '加载失败',
            type: 'after_story'
          };
        }
      })
    );
    
    return afterStoriesData;
  } catch (e) {
    console.error('加载后日谈列表失败:', e);
    return [];
  }
}

// 添加一个变量来缓存仪式关系数据
let riteRelationsData = null;

// 添加一个变量来缓存结局关系数据
let overRelationsData = null;

/**
 * 加载仪式关系数据
 * 包含仪式与结局、计数器、成就等的关联关系
 */
export async function loadRiteRelationsData() {
  if (riteRelationsData !== null) {
    return riteRelationsData;
  }
  
  try {
    // 使用require直接导入JSON文件
    const response = require('raw-loader!@/assets/rite_relations.json').default;
    
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
    
    
    try {
      // 尝试直接解析
      riteRelationsData = JSON.parse(jsonContent);
    } catch (directParseError) {
      // 如果直接解析失败，尝试使用自定义解析器
      riteRelationsData = parseJsonWithComments(jsonContent);
      console.log('使用自定义解析器解析仪式关系数据');
    }
    
    return riteRelationsData;
  } catch (e) {
    console.error('加载仪式关系数据失败:', e);
    return {};
  }
}

/**
 * 加载结局关系数据
 * 包含结局与仪式、计数器、成就等的关联关系
 */
export async function loadOverRelationsData() {
  if (overRelationsData !== null) {
    return overRelationsData;
  }
  
  try {
    // 使用require直接导入JSON文件
    const response = require('raw-loader!@/assets/over_relations.json').default;
    
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
      overRelationsData = JSON.parse(jsonContent);
    } catch (directParseError) {
      // 如果直接解析失败，尝试使用自定义解析器
      overRelationsData = parseJsonWithComments(jsonContent);
    }
    
    return overRelationsData;
  } catch (e) {
    console.error('加载结局关系数据失败:', e);
    return {};
  }
}

/**
 * 获取与结局相关的仪式列表
 * @param {string|number} overId 结局ID
 * @returns {Promise<Array>} 相关仪式列表
 */
export async function getRelatedRitesByOverId(overId) {
  try {
    const overRelations = await loadOverRelationsData();
    const overIdStr = overId.toString();
    
    if (overRelations && overRelations[overIdStr]) {
      return overRelations[overIdStr].related_rites || [];
    }
    
    return [];
  } catch (e) {
    console.error(`获取结局 ${overId} 相关仪式失败:`, e);
    return [];
  }
}

/**
 * 获取与结局相关的计数器列表
 * @param {string|number} overId 结局ID
 * @returns {Promise<Array>} 相关计数器列表
 */
export async function getRelatedCountersByOverId(overId) {
  try {
    const overRelations = await loadOverRelationsData();
    const overIdStr = overId.toString();
    
    if (overRelations && overRelations[overIdStr]) {
      return overRelations[overIdStr].related_counters || [];
    }
    
    return [];
  } catch (e) {
    console.error(`获取结局 ${overId} 相关计数器失败:`, e);
    return [];
  }
}

/**
 * 获取与结局相关的成就列表
 * @param {string|number} overId 结局ID
 * @returns {Promise<Array>} 相关成就列表
 */
export async function getRelatedAchievementsByOverId(overId) {
  try {
    const overRelations = await loadOverRelationsData();
    const overIdStr = overId.toString();
    
    if (overRelations && overRelations[overIdStr]) {
      return overRelations[overIdStr].related_achievements || [];
    }
    
    return [];
  } catch (e) {
    console.error(`获取结局 ${overId} 相关成就失败:`, e);
    return [];
  }
}

/**
 * 获取与仪式相关的结局列表
 * @param {string|number} riteId 仪式ID
 * @returns {Promise<Array>} 相关结局列表
 */
export async function getRelatedOversByRiteId(riteId) {
  try {
    const riteRelations = await loadRiteRelationsData();
    const riteIdStr = riteId.toString();
    
    if (riteRelations && riteRelations[riteIdStr]) {
      return riteRelations[riteIdStr].relations.overs || [];
    }
    
    return [];
  } catch (e) {
    console.error(`获取仪式 ${riteId} 相关结局失败:`, e);
    return [];
  }
}

/**
 * 获取与仪式相关的计数器列表
 * @param {string|number} riteId 仪式ID
 * @returns {Promise<Array>} 相关计数器列表
 */
export async function getRelatedCountersByRiteId(riteId) {
  try {
    const riteRelations = await loadRiteRelationsData();
    const riteIdStr = riteId.toString();
    
    if (riteRelations && riteRelations[riteIdStr]) {
      return riteRelations[riteIdStr].relations.counters || [];
    }
    
    return [];
  } catch (e) {
    console.error(`获取仪式 ${riteId} 相关计数器失败:`, e);
    return [];
  }
}

/**
 * 获取与仪式相关的成就列表
 * @param {string|number} riteId 仪式ID
 * @returns {Promise<Array>} 相关成就列表
 */
export async function getRelatedAchievementsByRiteId(riteId) {
  try {
    const riteRelations = await loadRiteRelationsData();
    const riteIdStr = riteId.toString();
    
    if (riteRelations && riteRelations[riteIdStr]) {
      return riteRelations[riteIdStr].relations.achievements || [];
    }
    
    return [];
  } catch (e) {
    console.error(`获取仪式 ${riteId} 相关成就失败:`, e);
    return [];
  }
}

/**
 * 获取所有结局关系数据
 * @returns {Promise<Object>} 所有结局关系数据
 */
export async function getAllOverRelations() {
  return await loadOverRelationsData();
}

/**
 * 获取所有仪式关系数据
 * @returns {Promise<Object>} 所有仪式关系数据
 */
export async function getAllRiteRelations() {
  return await loadRiteRelationsData();
}
