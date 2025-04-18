import os
import json
import commentjson
import re
from collections import defaultdict
from pathlib import Path

def parse_json_with_duplicates(json_str):
    """解析JSON字符串，将重复键合并为数组"""
    def hook(pairs):
        result = defaultdict(list)
        for key, value in pairs:
            result[key].append(value)
        return {k: v if len(v) > 1 else v[0] for k, v in result.items()}
    
    return commentjson.loads(json_str, object_pairs_hook=hook)

def normalize_keys(obj):
    """处理对象中不合法的键名"""
    if isinstance(obj, dict):
        # 创建一个新字典来存储处理后的键值对
        new_obj = {}
        
        for key, value in obj.items():
            # 处理键名中的特殊字符
            new_key = key

            # 处理否逻辑
            if 'uprare' in new_key:
                new_key = re.sub(r'([^"]*)uprare([^"]*)', r'\1晋升\2', new_key)

            # 处理否逻辑
            if 'rare' in new_key:
                new_key = re.sub(r'([^"]*)rare([^"]*)', r'\1稀有度\2', new_key)

            # 处理否逻辑
            if '!' in new_key:
                new_key = re.sub(r'([^"]*)!([^"]*)', r'\1非\2', new_key)

            # 处理等号
            if '=' in new_key:
                new_key = re.sub(r'([^"]+)=([^"]*)', r'\1等于\2', new_key)
            
            # 处理加号
            if '+' in new_key:
                new_key = re.sub(r'([^"]+)\+([^"]*)', r'\1加\2', new_key)

            # 处理大于
            if '>' in new_key:
                new_key = re.sub(r'([^"]+)\>([^"]*)', r'\1大于\2', new_key)

            # 处理小于
            if '<' in new_key:
                new_key = re.sub(r'([^"]+)\<([^"]*)', r'\1小于\2', new_key)

            # 处理其他可能的非法字符
            new_key = re.sub(r'[^\w\d_\.]', '_', new_key)
            
            # 递归处理嵌套对象
            if isinstance(value, dict):
                new_obj[new_key] = normalize_keys(value)
            elif isinstance(value, list):
                new_obj[new_key] = [normalize_keys(item) if isinstance(item, dict) else item for item in value]
            else:
                if '稀有度' in new_key:
                    if value == 1:
                        value = '石'
                    elif value == 2:
                        value = '铜'
                    elif value == 3:
                        value = '银'
                    elif value == 4:
                        value = '金'
                new_obj[new_key] = value
        
        return new_obj
    elif isinstance(obj, list):
        # 处理列表中的每个元素
        return [normalize_keys(item) if isinstance(item, dict) else item for item in obj]
    else:
        # 非对象或列表类型直接返回
        return obj

def process_json_file(file_path):
    """处理单个JSON文件，将重复键合并为数组并处理不合法键名，然后覆盖原文件"""
    try:
        # 读取文件内容
        with open(file_path, 'r', encoding='utf-8') as f:
            json_str = f.read()
        
        # 解析JSON，处理重复键
        parsed_json = parse_json_with_duplicates(json_str)
        
        # 处理不合法的键名
        normalized_json = normalize_keys(parsed_json)
        
        # 将处理后的JSON写回原文件
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(normalized_json, f, ensure_ascii=False, indent=2)
        
        print(f"成功处理: {file_path}")
        return True
    except Exception as e:
        print(f"处理文件 {file_path} 时出错: {e}")
        return False

def process_all_json_files(directory):
    """处理目录下所有JSON文件"""
    # 获取所有JSON文件
    json_files = list(Path(directory).glob('**/*.json'))
    
    success_count = 0
    fail_count = 0
    
    for file_path in json_files:
        if process_json_file(file_path):
            success_count += 1
        else:
            fail_count += 1
    
    print(f"处理完成! 成功: {success_count}, 失败: {fail_count}")

if __name__ == "__main__":
    # 设置config目录路径
    config_dir = r"C:\Users\liwen\Documents\GitHub\sudans-game-reader\src\assets\config"
    
    # 处理所有JSON文件
    process_all_json_files(config_dir)
