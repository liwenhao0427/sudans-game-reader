import os
import re
import json
from pathlib import Path

def extract_data_from_file(file_path):
    """从文件中提取id、name和text字段"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # 提取ID
            id_match = re.search(r'"id"\s*:\s*(\d+)', content)
            id_value = int(id_match.group(1)) if id_match else None
            
            # 提取name
            name_match = re.search(r'"name"\s*:\s*"([^"]*)"', content)
            name_value = name_match.group(1) if name_match else ""
            
            # 提取text
            text_match = re.search(r'"text"\s*:\s*"([^"]*)"', content)
            text_value = text_match.group(1) if text_match else ""
            
            return {
                "id": id_value,
                "name": name_value,
                "text": text_value,
                "type": file_path.parent.name  # 记录类型(loot/event/rite)
            }
    except Exception as e:
        print(f"处理文件 {file_path} 时出错: {e}")
        return None

def main():
    # 当前目录
    base_dir = Path.cwd()
    
    # 要处理的目录
    directories = ["loot", "event", "rite"]
    
    # 结果列表
    all_data = []
    
    # 处理每个目录
    for directory in directories:
        dir_path = base_dir / "src" / "assets" / "config" / directory
        
        if not dir_path.exists():
            print(f"目录 {dir_path} 不存在，跳过")
            continue
        
        print(f"正在处理 {directory} 目录...")
        
        # 遍历目录中的所有json文件
        for file_path in dir_path.glob("*.json"):
            data = extract_data_from_file(file_path)
            if data:
                all_data.append(data)
                if len(all_data) % 100 == 0:
                    print(f"已处理 {len(all_data)} 个文件...")
    
    # 按ID排序
    all_data.sort(key=lambda x: x["id"])
    
    # 保存结果到配置文件
    output_file = base_dir / "src" / "assets" / "game_data_index.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"处理完成! 共处理了 {len(all_data)} 个文件")
    print(f"结果已保存到 {output_file}")

if __name__ == "__main__":
    main()