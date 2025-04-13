import json
import re
import os
# 算了，太麻烦了，不用这个解析了，我直接用JSON5处理好像就没问题，https://www.lddgo.net/string/json5 反正只要没重复键也不丢信息
def process_cards_json(input_file, output_file):
    """
    处理不标准的cards.json文件，提取指定字段并生成标准JSON
    
    Args:
        input_file: 输入文件路径
        output_file: 输出文件路径
    """
    print(f"开始处理文件: {input_file}")
    
    # 读取文件内容
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 处理可能的module.exports包装
    if content.startswith('module.exports = '):
        content = content[16:]
    
    # 处理可能的引号和分号
    content = content.strip()
    if content.startswith('"') and content.endswith('";'):
        content = content[1:-2]
    elif content.startswith('"') and content.endswith('"'):
        content = content[1:-1]
    
    # 移除包含注释//的整行
    content = re.sub(r'[^\n]*//[^\n]*\n', '\n', content)
    
    # 移除包含counter+的整行
    content = re.sub(r'[^\n]*"counter\+[^\n]*\n', '\n', content)
    
    # 移除包含is_rite的整行
    content = re.sub(r'[^\n]*"is_rite"[^\n]*\n', '\n', content)

    # 移除尾随逗号
    content = re.sub(r',\s*}', '}', content)
    content = re.sub(r',\s*]', ']', content)

    # 处理转义字符
    content = content.replace('\\\"', '"')
    # content = content.replace('\\n', '\n')
    content = content.replace('\\r', '')
    content = content.replace('\\t', '')
    
    try:
        # 尝试解析JSON
        cards_data = json.loads(content)
        
        # 直接保存完整的解析结果，而不是提取简化字段
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(cards_data, f, ensure_ascii=False, indent=2)
        
        print(f"处理完成，已生成标准JSON文件: {output_file}")
        print(f"共处理 {len(cards_data)} 张卡片")
        
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}")
        
        # 尝试使用正则表达式提取卡片数据
        print("尝试使用正则表达式提取数据...")
        
        # 匹配卡片ID和内容的模式
        pattern = r'"(\d+)":\s*{([^{}]*(?:{[^{}]*}[^{}]*)*?)}'
        matches = re.findall(pattern, content)
        
        cards_data = {}
        
        for card_id, card_content in matches:
            # 如果已经处理过这个ID，跳过（处理重复键）
            if card_id in cards_data:
                print(f"警告: 发现重复的卡片ID: {card_id}，使用第一个出现的定义")
                continue
                
            # 尝试解析单个卡片的JSON
            try:
                # 构建完整的JSON字符串并解析
                card_json = "{" + card_content + "}"
                card_info = json.loads(card_json)
                cards_data[card_id] = card_info
            except json.JSONDecodeError:
                # 如果解析失败，回退到正则表达式提取关键字段
                print(f"警告: 卡片 {card_id} 解析失败，使用正则表达式提取关键字段")
                
                # 提取各个字段
                id_match = re.search(r'"id":\s*(\d+)', card_content)
                name_match = re.search(r'"name":\s*"([^"]*)"', card_content)
                title_match = re.search(r'"title":\s*"([^"]*)"', card_content)
                text_match = re.search(r'"text":\s*"([^"]*)"', card_content)
                type_match = re.search(r'"type":\s*"([^"]*)"', card_content)
                rare_match = re.search(r'"rare":\s*(\d+)', card_content)
                
                card_info = {
                    "id": int(id_match.group(1)) if id_match else None,
                    "name": name_match.group(1) if name_match else "",
                    "title": title_match.group(1) if title_match else "",
                    "text": text_match.group(1) if text_match else "",
                    "type": type_match.group(1) if type_match else "",
                    "rare": int(rare_match.group(1)) if rare_match else 0
                }
                cards_data[card_id] = card_info
        
        # 写入新的JSON文件
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(cards_data, f, ensure_ascii=False, indent=2)
        
        print(f"使用正则表达式处理完成，已生成JSON文件: {output_file}")
        print(f"共处理 {len(cards_data)} 张卡片")

if __name__ == "__main__":
    # 设置输入和输出文件路径
    input_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                             "src", "assets", "config", "over.json")
    output_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                              "src", "assets", "over_processed.json")
    
    # 确保输出目录存在
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # 处理文件
    process_cards_json(input_file, output_file)