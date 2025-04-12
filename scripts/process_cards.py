import json
import re
import os

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
    content = content.replace('\\n', '\n')
    content = content.replace('\\r', '')
    content = content.replace('\\t', '')
    
    try:
        # 尝试解析JSON
        cards_data = json.loads(content)
        
        # 创建新的简化数据结构
        simplified_cards = {}
        
        for card_id, card_info in cards_data.items():
            # 提取所需字段
            simplified_card = {
                "id": card_info.get("id", None),
                "name": card_info.get("name", ""),
                "title": card_info.get("title", ""),
                "text": card_info.get("text", ""),
                "type": card_info.get("type", ""),
                "rare": card_info.get("rare", 0)
            }
            simplified_cards[card_id] = simplified_card
        
        # 写入新的JSON文件
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(simplified_cards, f, ensure_ascii=False, indent=2)
        
        print(f"处理完成，已生成简化JSON文件: {output_file}")
        print(f"共处理 {len(simplified_cards)} 张卡片")
        
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}")
        
        # 尝试使用正则表达式提取卡片数据
        print("尝试使用正则表达式提取数据...")
        
        # 匹配卡片ID和内容的模式
        pattern = r'"(\d+)":\s*{([^{}]*(?:{[^{}]*}[^{}]*)*?)}'
        matches = re.findall(pattern, content)
        
        simplified_cards = {}
        
        for card_id, card_content in matches:
            # 如果已经处理过这个ID，跳过（处理重复键）
            if card_id in simplified_cards:
                print(f"警告: 发现重复的卡片ID: {card_id}，使用第一个出现的定义")
                continue
                
            # 提取各个字段
            id_match = re.search(r'"id":\s*(\d+)', card_content)
            name_match = re.search(r'"name":\s*"([^"]*)"', card_content)
            title_match = re.search(r'"title":\s*"([^"]*)"', card_content)
            text_match = re.search(r'"text":\s*"([^"]*)"', card_content)
            type_match = re.search(r'"type":\s*"([^"]*)"', card_content)
            rare_match = re.search(r'"rare":\s*(\d+)', card_content)
            
            simplified_card = {
                "id": int(id_match.group(1)) if id_match else None,
                "name": name_match.group(1) if name_match else "",
                "title": title_match.group(1) if title_match else "",
                "text": text_match.group(1) if text_match else "",
                "type": type_match.group(1) if type_match else "",
                "rare": int(rare_match.group(1)) if rare_match else 0
            }
            
            simplified_cards[card_id] = simplified_card
        
        # 写入新的JSON文件
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(simplified_cards, f, ensure_ascii=False, indent=2)
        
        print(f"使用正则表达式处理完成，已生成简化JSON文件: {output_file}")
        print(f"共处理 {len(simplified_cards)} 张卡片")

if __name__ == "__main__":
    # 设置输入和输出文件路径
    input_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                             "src", "assets", "config", "cards.json")
    output_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                              "src", "assets", "config", "cards_simplified.json")
    
    # 确保输出目录存在
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # 处理文件
    process_cards_json(input_file, output_file)