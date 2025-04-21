import json
import os
import re
import json5
from pathlib import Path

def process_rite_relations(rite_dir, output_file):
    """
    遍历rite目录下所有json文件，提取仪式ID、result和action信息，
    并将这些信息保存到一个缓存JSON文件中
    
    Args:
        rite_dir: 仪式JSON文件所在目录
        output_file: 输出的缓存JSON文件路径
    """
    print(f"开始处理仪式目录: {rite_dir}")
    
    # 存储所有仪式关系的字典
    rite_relations = {}
    
    # 遍历rite目录下的所有JSON文件
    rite_files = list(Path(rite_dir).glob("*.json"))
    total_files = len(rite_files)
    
    print(f"找到 {total_files} 个仪式文件")
    
    processed_files = 0
    skipped_files = 0
    
    for i, file_path in enumerate(rite_files):
        if i % 100 == 0:
            print(f"处理进度: {i}/{total_files}")
            
        try:
            # 读取文件内容
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 直接使用json5解析，而不是先尝试移除注释
            try:
                rite_data = json5.loads(content)
            except Exception as e:
                # 如果json5解析失败，尝试更强大的预处理
                print(f"JSON5解析文件 {file_path} 失败，尝试更强大的预处理: {e}")
                
                # 移除单行注释，但保留引号内的内容
                content = re.sub(r'(?<!["\'\\])//.*?(?=\n|$)', '', content)
                
                # 移除多行注释
                content = re.sub(r'/\*[\s\S]*?\*/', '', content)
                
                # 处理尾随逗号
                content = re.sub(r',(\s*[}\]])', r'\1', content)
                
                # 再次尝试使用json5解析
                try:
                    rite_data = json5.loads(content)
                except Exception as e2:
                    print(f"预处理后仍然解析失败 {file_path}: {e2}")
                    
                    # 尝试使用正则表达式提取关键信息
                    id_match = re.search(r'"id"\s*:\s*(\d+)', content)
                    if id_match:
                        rite_id = int(id_match.group(1))
                        
                        # 提取over字段
                        over_matches = re.findall(r'"over"\s*:\s*(\d+)', content)
                        
                        if over_matches:
                            # 创建简化的仪式信息
                            rite_info = {
                                'id': rite_id,
                                'name': '',
                                'text': '',
                                'type': '',
                                'relations': {
                                    'overs': [int(over) for over in over_matches],
                                    'rites': [],
                                    'events': [],
                                    'counters': [],
                                    'achievements': []
                                }
                            }
                            
                            # 提取计数器
                            # 在正则表达式提取部分（约在第70行附近）
                            # 提取计数器 - 使用更广泛的模式
                            counter_matches = re.findall(r'"(counter[^"]*?)"\s*:', content)
                            for counter_key in counter_matches:
                                # 尝试从键名中提取计数器ID
                                counter_id = None
                                
                                # 处理常见格式
                                if '+' in counter_key:
                                    counter_id = counter_key.split('+')[-1].split('<')[0].split('>')[0].split('=')[0]
                                elif '-' in counter_key:
                                    counter_id = counter_key.split('-')[-1].split('<')[0].split('>')[0].split('=')[0]
                                elif '=' in counter_key:
                                    counter_id = counter_key.split('=')[-1].split('<')[0].split('>')[0]
                                
                                # 如果上述方法都无法提取ID，尝试使用正则表达式
                                if not counter_id or not counter_id.isdigit():
                                    match = re.search(r'counter.*?(\d+)', counter_key)
                                    if match:
                                        counter_id = match.group(1)
                                
                                # 如果成功提取到ID，添加到关系中
                                if counter_id and counter_id.isdigit():
                                    if counter_id not in rite_info['relations']['counters']:
                                        rite_info['relations']['counters'].append(counter_id)
                                    else:
                                        # 如果无法提取ID，记录完整的键名
                                        if counter_key not in rite_info['relations']['counters']:
                                            rite_info['relations']['counters'].append(counter_key)
                            
                            # 提取成就
                            achievement_matches = re.findall(r'"steam_achievement"\s*:\s*"([^"]+)"', content)
                            for achievement in achievement_matches:
                                if achievement not in rite_info['relations']['achievements']:
                                    rite_info['relations']['achievements'].append(achievement)
                            
                            rite_relations[str(rite_id)] = rite_info
                            processed_files += 1
                            print(f"使用正则表达式处理文件 {file_path.name} 成功，ID: {rite_id}, 结局: {rite_info['relations']['overs']}")
                            continue
                    
                    skipped_files += 1
                    continue
            
            # 提取仪式ID
            rite_id = rite_data.get('id')
            if not rite_id:
                print(f"文件 {file_path} 没有仪式ID，跳过")
                skipped_files += 1
                continue
            
            # 初始化该仪式的关系信息
            rite_info = {
                'id': rite_id,
                'name': rite_data.get('name', ''),
                'text': rite_data.get('text', ''),
                'type': rite_data.get('type', ''),
                'relations': {
                    'overs': [],  # 关联的结局
                    'rites': [],  # 关联的其他仪式
                    'events': [], # 关联的事件
                    'counters': [], # 关联的计数器
                    'achievements': [] # 关联的成就
                }
            }
            
            # 提取结算信息
            has_over = False
            
            # 检查settlement部分
            if 'settlement' in rite_data and isinstance(rite_data['settlement'], list):
                for item in rite_data['settlement']:
                    has_over = process_settlement_item(item, rite_info['relations']) or has_over
            
            # 检查settlement_extre部分
            if 'settlement_extre' in rite_data and isinstance(rite_data['settlement_extre'], list):
                for item in rite_data['settlement_extre']:
                    has_over = process_settlement_item(item, rite_info['relations']) or has_over
            
            # 检查waiting_round_end_action部分
            if 'waiting_round_end_action' in rite_data and isinstance(rite_data['waiting_round_end_action'], list):
                for item in rite_data['waiting_round_end_action']:
                    has_over = process_settlement_item(item, rite_info['relations']) or has_over
            
            # 只保存有结局的仪式
            if has_over and len(rite_info['relations']['overs']) > 0:
                rite_relations[str(rite_id)] = rite_info
                processed_files += 1
                print(f"处理文件 {file_path.name} 成功，ID: {rite_id}, 结局: {rite_info['relations']['overs']}")
            else:
                skipped_files += 1
            
        except Exception as e:
            print(f"处理文件 {file_path} 时出错: {e}")
            skipped_files += 1
    
    # 在处理完所有仪式后，遍历一次确保所有计数器都是对象格式
    for rite_id, rite_info in rite_relations.items():
        normalized_counters = []
        for counter in rite_info['relations']['counters']:
            # 将字符串格式的计数器转换为对象格式
            if isinstance(counter, dict):
                normalized_counters.append(counter)
            else:
                # 字符串格式的计数器转换为对象
                counter_str = str(counter)
                counter_obj = {'id': '', 'op': '', 'value': ''}
                
                # 处理counter+、counter-、counter=格式
                if counter_str.startswith('counter+'):
                    counter_obj['op'] = '+'
                    counter_id = counter_str.split('+')[-1]
                    # 检查是否有比较操作符
                    if '>=' in counter_id:
                        counter_obj['id'] = counter_id.split('>=')[0]
                        counter_obj['op'] += '>='
                    elif '<=' in counter_id:
                        counter_obj['id'] = counter_id.split('<=')[0]
                        counter_obj['op'] += '<='
                    elif '>' in counter_id:
                        counter_obj['id'] = counter_id.split('>')[0]
                        counter_obj['op'] += '>'
                    elif '<' in counter_id:
                        counter_obj['id'] = counter_id.split('<')[0]
                        counter_obj['op'] += '<'
                    elif '=' in counter_id:
                        counter_obj['id'] = counter_id.split('=')[0]
                        counter_obj['op'] += '='
                    else:
                        counter_obj['id'] = counter_id
                elif counter_str.startswith('counter-'):
                    counter_obj['op'] = '-'
                    counter_id = counter_str.split('-')[-1]
                    # 检查是否有比较操作符
                    if '>=' in counter_id:
                        counter_obj['id'] = counter_id.split('>=')[0]
                        counter_obj['op'] += '>='
                    elif '<=' in counter_id:
                        counter_obj['id'] = counter_id.split('<=')[0]
                        counter_obj['op'] += '<='
                    elif '>' in counter_id:
                        counter_obj['id'] = counter_id.split('>')[0]
                        counter_obj['op'] += '>'
                    elif '<' in counter_id:
                        counter_obj['id'] = counter_id.split('<')[0]
                        counter_obj['op'] += '<'
                    elif '=' in counter_id:
                        counter_obj['id'] = counter_id.split('=')[0]
                        counter_obj['op'] += '='
                    else:
                        counter_obj['id'] = counter_id
                elif counter_str.startswith('counter='):
                    counter_obj['op'] = '='
                    counter_id = counter_str.split('=')[-1]
                    # 检查是否有比较操作符
                    if '>=' in counter_id:
                        counter_obj['id'] = counter_id.split('>=')[0]
                        counter_obj['op'] += '>='
                    elif '<=' in counter_id:
                        counter_obj['id'] = counter_id.split('<=')[0]
                        counter_obj['op'] += '<='
                    elif '>' in counter_id:
                        counter_obj['id'] = counter_id.split('>')[0]
                        counter_obj['op'] += '>'
                    elif '<' in counter_id:
                        counter_obj['id'] = counter_id.split('<')[0]
                        counter_obj['op'] += '<'
                    elif '=' in counter_id:
                        counter_obj['id'] = counter_id.split('=')[0]
                        counter_obj['op'] += '='
                    else:
                        counter_obj['id'] = counter_id
                # 处理counter.7000xxx>=5格式
                elif counter_str.startswith('counter.'):
                    parts = counter_str.replace('counter.', '').split('>=')
                    if len(parts) > 1:
                        counter_obj['id'] = parts[0]
                        counter_obj['op'] = '>='
                        counter_obj['value'] = parts[1] if parts[1] else ''
                    else:
                        parts = counter_str.replace('counter.', '').split('<=')
                        if len(parts) > 1:
                            counter_obj['id'] = parts[0]
                            counter_obj['op'] = '<='
                            counter_obj['value'] = parts[1] if parts[1] else ''
                        else:
                            parts = counter_str.replace('counter.', '').split('>')
                            if len(parts) > 1:
                                counter_obj['id'] = parts[0]
                                counter_obj['op'] = '>'
                                counter_obj['value'] = parts[1] if parts[1] else ''
                            else:
                                parts = counter_str.replace('counter.', '').split('<')
                                if len(parts) > 1:
                                    counter_obj['id'] = parts[0]
                                    counter_obj['op'] = '<'
                                    counter_obj['value'] = parts[1] if parts[1] else ''
                                else:
                                    parts = counter_str.replace('counter.', '').split('=')
                                    if len(parts) > 1:
                                        counter_obj['id'] = parts[0]
                                        counter_obj['op'] = '='
                                        counter_obj['value'] = parts[1] if parts[1] else ''
                                    else:
                                        counter_obj['id'] = counter_str.replace('counter.', '')
                else:
                    # 直接使用数字ID
                    counter_obj['id'] = counter_str
                
                if counter_obj['id']:
                    normalized_counters.append(counter_obj)
        
        # 替换原来的计数器列表
        rite_info['relations']['counters'] = normalized_counters
    
    # 保存关系信息到JSON文件
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(rite_relations, f, ensure_ascii=False, indent=2)
    
    print(f"处理完成，共处理 {processed_files} 个仪式，跳过 {skipped_files} 个仪式，结果已保存到 {output_file}")
    return rite_relations

def process_settlement_item(item, relations):
    """
    处理结算项，提取关系信息
    
    Args:
        item: 结算项
        relations: 存储关系的字典
        
    Returns:
        bool: 是否找到了over字段
    """
    has_over = False
    
    # 提取result部分
    if 'result' in item and isinstance(item['result'], dict):
        has_over = extract_relations_from_dict(item['result'], relations) or has_over
    
    # 提取action部分
    if 'action' in item and isinstance(item['action'], dict):
        has_over = extract_relations_from_dict(item['action'], relations) or has_over
    
    return has_over

def extract_relations_from_dict(data_dict, relations):
    """
    从字典中提取关系信息
    
    Args:
        data_dict: 包含关系信息的字典
        relations: 存储关系的字典
        
    Returns:
        bool: 是否找到了over字段
    """
    has_over = False
    
    for key, value in data_dict.items():
        # 提取结局关系
        if key == 'over':
            has_over = True
            if value not in relations['overs']:
                relations['overs'].append(value)
        
        # 提取仪式关系
        elif key == 'rite':
            if value not in relations['rites']:
                relations['rites'].append(value)
        
        # 提取事件关系
        elif key in ['event_on', 'event_off']:
            if value not in relations['events']:
                relations['events'].append(value)
        
        # 提取计数器关系 - 处理各种格式的计数器
        elif 'counter' in key.lower():
            # 确保值被正确提取
            counter_value = str(value) if value is not None else ''
            counter_info = {'id': '', 'op': '', 'value': counter_value}
            
            # 处理counter+、counter-、counter=格式
            if key.startswith('counter+'):
                counter_info['op'] = '+'
                counter_id = key.split('+')[-1]
                # 检查是否有比较操作符
                if '>=' in counter_id:
                    counter_info['id'] = counter_id.split('>=')[0]
                    counter_info['op'] += '>='
                elif '<=' in counter_id:
                    counter_info['id'] = counter_id.split('<=')[0]
                    counter_info['op'] += '<='
                elif '>' in counter_id:
                    counter_info['id'] = counter_id.split('>')[0]
                    counter_info['op'] += '>'
                elif '<' in counter_id:
                    counter_info['id'] = counter_id.split('<')[0]
                    counter_info['op'] += '<'
                elif '=' in counter_id:
                    counter_info['id'] = counter_id.split('=')[0]
                    counter_info['op'] += '='
                else:
                    counter_info['id'] = counter_id
            
            elif key.startswith('counter-'):
                counter_info['op'] = '-'
                counter_id = key.split('-')[-1]
                # 检查是否有比较操作符
                if '>=' in counter_id:
                    counter_info['id'] = counter_id.split('>=')[0]
                    counter_info['op'] += '>='
                elif '<=' in counter_id:
                    counter_info['id'] = counter_id.split('<=')[0]
                    counter_info['op'] += '<='
                elif '>' in counter_id:
                    counter_info['id'] = counter_id.split('>')[0]
                    counter_info['op'] += '>'
                elif '<' in counter_id:
                    counter_info['id'] = counter_id.split('<')[0]
                    counter_info['op'] += '<'
                elif '=' in counter_id:
                    counter_info['id'] = counter_id.split('=')[0]
                    counter_info['op'] += '='
                else:
                    counter_info['id'] = counter_id
            
            elif key.startswith('counter='):
                counter_info['op'] = '='
                counter_id = key.split('=')[-1]
                # 检查是否有比较操作符
                if '>=' in counter_id:
                    counter_info['id'] = counter_id.split('>=')[0]
                    counter_info['op'] += '>='
                elif '<=' in counter_id:
                    counter_info['id'] = counter_id.split('<=')[0]
                    counter_info['op'] += '<='
                elif '>' in counter_id:
                    counter_info['id'] = counter_id.split('>')[0]
                    counter_info['op'] += '>'
                elif '<' in counter_id:
                    counter_info['id'] = counter_id.split('<')[0]
                    counter_info['op'] += '<'
                elif '=' in counter_id:
                    counter_info['id'] = counter_id.split('=')[0]
                    counter_info['op'] += '='
                else:
                    counter_info['id'] = counter_id
            
            # 处理counter.7000xxx>=5格式
            elif key.startswith('counter.'):
                parts = key.replace('counter.', '').split('>=')
                if len(parts) > 1:
                    counter_info['id'] = parts[0]
                    counter_info['op'] = '>='
                    counter_info['value'] = parts[1] if parts[1] else str(value)
                else:
                    parts = key.replace('counter.', '').split('<=')
                    if len(parts) > 1:
                        counter_info['id'] = parts[0]
                        counter_info['op'] = '<='
                        counter_info['value'] = parts[1] if parts[1] else str(value)
                    else:
                        parts = key.replace('counter.', '').split('>')
                        if len(parts) > 1:
                            counter_info['id'] = parts[0]
                            counter_info['op'] = '>'
                            counter_info['value'] = parts[1] if parts[1] else str(value)
                        else:
                            parts = key.replace('counter.', '').split('<')
                            if len(parts) > 1:
                                counter_info['id'] = parts[0]
                                counter_info['op'] = '<'
                                counter_info['value'] = parts[1] if parts[1] else str(value)
                            else:
                                parts = key.replace('counter.', '').split('=')
                                if len(parts) > 1:
                                    counter_info['id'] = parts[0]
                                    counter_info['op'] = '='
                                    counter_info['value'] = parts[1] if parts[1] else str(value)
                                else:
                                    counter_info['id'] = key.replace('counter.', '')
            
            # 处理global_counter格式
            elif key.startswith('global_counter'):
                counter_info['id'] = 'g' + key.replace('global_counter', '')
            
            # 如果以上都不匹配，尝试直接提取数字作为ID
            else:
                match = re.search(r'(\d+)', key)
                if match:
                    counter_info['id'] = match.group(1)
                else:
                    counter_info['id'] = key
            
            # 如果成功提取到ID，添加到关系中
            if counter_info['id']:
                # 检查是否已存在相同的计数器信息
                exists = False
                for existing in relations['counters']:
                    if isinstance(existing, dict) and existing.get('id') == counter_info['id'] and existing.get('op') == counter_info['op']:
                        exists = True
                        break
                
                if not exists:
                    relations['counters'].append(counter_info)
        
        # 提取成就关系
        elif key == 'steam_achievement':
            if value not in relations['achievements']:
                relations['achievements'].append(value)
    
    return has_over


def build_over_relations(rite_relations, output_file):
    """
    构建结局与仪式的关系
    
    Args:
        rite_relations: 仪式关系数据
        output_file: 输出的缓存JSON文件路径
    """
    print("开始构建结局与仪式的关系")
    
    # 存储结局与仪式关系的字典
    over_relations = {}
    
    # 遍历所有仪式关系
    for rite_id, rite_info in rite_relations.items():
        for over_id in rite_info['relations']['overs']:
            over_id_str = str(over_id)
            
            # 初始化结局信息
            if over_id_str not in over_relations:
                over_relations[over_id_str] = {
                    'id': over_id,
                    'related_rites': [],
                    'related_counters': [],
                    'related_achievements': []
                }
            
            # 添加关联的仪式
            if rite_id not in over_relations[over_id_str]['related_rites']:
                over_relations[over_id_str]['related_rites'].append(rite_id)
            
            # 添加关联的计数器 - 确保所有计数器都是对象格式
            for counter in rite_info['relations']['counters']:
                # 将字符串格式的计数器转换为对象格式
                counter_obj = None
                if isinstance(counter, dict):
                    counter_obj = counter
                else:
                    # 字符串格式的计数器转换为对象
                    counter_str = str(counter)
                    counter_obj = {'id': '', 'op': '', 'value': ''}
                    
                    # 处理counter+、counter-、counter=格式
                    if counter_str.startswith('counter+'):
                        counter_obj['op'] = '+'
                        counter_id = counter_str.split('+')[-1]
                        # 检查是否有比较操作符
                        if '>=' in counter_id:
                            counter_obj['id'] = counter_id.split('>=')[0]
                            counter_obj['op'] += '>='
                        elif '<=' in counter_id:
                            counter_obj['id'] = counter_id.split('<=')[0]
                            counter_obj['op'] += '<='
                        elif '>' in counter_id:
                            counter_obj['id'] = counter_id.split('>')[0]
                            counter_obj['op'] += '>'
                        elif '<' in counter_id:
                            counter_obj['id'] = counter_id.split('<')[0]
                            counter_obj['op'] += '<'
                        elif '=' in counter_id:
                            counter_obj['id'] = counter_id.split('=')[0]
                            counter_obj['op'] += '='
                        else:
                            counter_obj['id'] = counter_id
                    elif counter_str.startswith('counter-'):
                        counter_obj['op'] = '-'
                        counter_id = counter_str.split('-')[-1]
                        # 检查是否有比较操作符
                        if '>=' in counter_id:
                            counter_obj['id'] = counter_id.split('>=')[0]
                            counter_obj['op'] += '>='
                        elif '<=' in counter_id:
                            counter_obj['id'] = counter_id.split('<=')[0]
                            counter_obj['op'] += '<='
                        elif '>' in counter_id:
                            counter_obj['id'] = counter_id.split('>')[0]
                            counter_obj['op'] += '>'
                        elif '<' in counter_id:
                            counter_obj['id'] = counter_id.split('<')[0]
                            counter_obj['op'] += '<'
                        elif '=' in counter_id:
                            counter_obj['id'] = counter_id.split('=')[0]
                            counter_obj['op'] += '='
                        else:
                            counter_obj['id'] = counter_id
                    elif counter_str.startswith('counter='):
                        counter_obj['op'] = '='
                        counter_id = counter_str.split('=')[-1]
                        # 检查是否有比较操作符
                        if '>=' in counter_id:
                            counter_obj['id'] = counter_id.split('>=')[0]
                            counter_obj['op'] += '>='
                        elif '<=' in counter_id:
                            counter_obj['id'] = counter_id.split('<=')[0]
                            counter_obj['op'] += '<='
                        elif '>' in counter_id:
                            counter_obj['id'] = counter_id.split('>')[0]
                            counter_obj['op'] += '>'
                        elif '<' in counter_id:
                            counter_obj['id'] = counter_id.split('<')[0]
                            counter_obj['op'] += '<'
                        elif '=' in counter_id:
                            counter_obj['id'] = counter_id.split('=')[0]
                            counter_obj['op'] += '='
                        else:
                            counter_obj['id'] = counter_id
                    # 处理counter.7000xxx>=5格式
                    elif counter_str.startswith('counter.'):
                        parts = counter_str.replace('counter.', '').split('>=')
                        if len(parts) > 1:
                            counter_obj['id'] = parts[0]
                            counter_obj['op'] = '>='
                            counter_obj['value'] = parts[1] if parts[1] else ''
                        else:
                            parts = counter_str.replace('counter.', '').split('<=')
                            if len(parts) > 1:
                                counter_obj['id'] = parts[0]
                                counter_obj['op'] = '<='
                                counter_obj['value'] = parts[1] if parts[1] else ''
                            else:
                                parts = counter_str.replace('counter.', '').split('>')
                                if len(parts) > 1:
                                    counter_obj['id'] = parts[0]
                                    counter_obj['op'] = '>'
                                    counter_obj['value'] = parts[1] if parts[1] else ''
                                else:
                                    parts = counter_str.replace('counter.', '').split('<')
                                    if len(parts) > 1:
                                        counter_obj['id'] = parts[0]
                                        counter_obj['op'] = '<'
                                        counter_obj['value'] = parts[1] if parts[1] else ''
                                    else:
                                        parts = counter_str.replace('counter.', '').split('=')
                                        if len(parts) > 1:
                                            counter_obj['id'] = parts[0]
                                            counter_obj['op'] = '='
                                            counter_obj['value'] = parts[1] if parts[1] else ''
                                        else:
                                            counter_obj['id'] = counter_str.replace('counter.', '')
                    else:
                        # 直接使用数字ID
                        counter_obj['id'] = counter_str
                
                # 检查是否已存在相同的计数器
                exists = False
                for existing in over_relations[over_id_str]['related_counters']:
                    if existing.get('id') == counter_obj.get('id') and existing.get('op') == counter_obj.get('op'):
                        exists = True
                        break
                
                if not exists and counter_obj.get('id'):
                    over_relations[over_id_str]['related_counters'].append(counter_obj)
            
            # 添加关联的成就
            for achievement in rite_info['relations']['achievements']:
                if achievement not in over_relations[over_id_str]['related_achievements']:
                    over_relations[over_id_str]['related_achievements'].append(achievement)
    
    # 保存关系信息到JSON文件
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(over_relations, f, ensure_ascii=False, indent=2)
    
    print(f"结局关系构建完成，共 {len(over_relations)} 个结局，结果已保存到 {output_file}")
    return over_relations

def main():
    # 项目根目录
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 仪式目录
    rite_dir = os.path.join(project_dir, 'src', 'assets', 'config', 'rite')
    
    # 输出文件
    rite_relations_file = os.path.join(project_dir, 'src', 'assets', 'rite_relations.json')
    over_relations_file = os.path.join(project_dir, 'src', 'assets', 'over_relations.json')
    
    # 处理仪式关系
    rite_relations = process_rite_relations(rite_dir, rite_relations_file)
    
    # 构建结局关系
    build_over_relations(rite_relations, over_relations_file)
    
    print("所有处理完成！")

if __name__ == "__main__":
    main()