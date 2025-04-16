import os
import json
import re
from pathlib import Path

def extract_counter_comments(config_dir, output_file):
    """
    递归遍历config目录，找到包含counter的行，提取计数器ID和注释
    
    Args:
        config_dir: 配置文件目录
        output_file: 输出的JSON文件路径
    """
    print(f"开始处理配置目录: {config_dir}")
    
    # 存储计数器ID和注释的字典
    counter_comments = {}
    
    # 如果输出文件已存在，先加载现有内容
    if os.path.exists(output_file):
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                counter_comments = json.load(f)
            print(f"已加载现有注释缓存，包含 {len(counter_comments)} 个计数器")
        except Exception as e:
            print(f"加载现有注释缓存失败: {e}")
    
    # 递归遍历目录下的所有JSON文件
    config_files = list(Path(config_dir).glob("**/*.json"))
    total_files = len(config_files)
    
    print(f"找到 {total_files} 个配置文件")
    
    processed_files = 0
    counter_found = 0
    
    for i, file_path in enumerate(config_files):
        if i % 100 == 0:
            print(f"处理进度: {i}/{total_files}")
        
        try:
            # 读取文件内容
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 查找包含counter的行
            lines = content.split('\n')
            for line in lines:
                # 查找包含counter和数字的部分
                counter_matches = re.findall(r'counter[^"]*?(\d+)', line)
                if not counter_matches:
                    # 尝试查找其他格式的计数器
                    counter_matches = re.findall(r'counter\.(\d+)', line)
                
                if counter_matches:
                    for counter_id in counter_matches:
                        counter_found += 1
                        
                        # 查找该行中的注释（//后面的内容）
                        comment_match = re.search(r'//\s*(.*?)$', line)
                        if comment_match:
                            comment = comment_match.group(1).strip()
                            
                            # 如果注释非空且有意义
                            if comment and not comment.isdigit() and len(comment) > 1:
                                # 如果计数器ID已存在，取最短的注释
                                if counter_id in counter_comments:
                                    if len(comment) < len(counter_comments[counter_id]):
                                        counter_comments[counter_id] = comment
                                else:
                                    counter_comments[counter_id] = comment
            
            processed_files += 1
            
        except Exception as e:
            print(f"处理文件 {file_path} 时出错: {e}")
    
    # 保存注释信息到JSON文件
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(counter_comments, f, ensure_ascii=False, indent=2, sort_keys=True)
    
    print(f"处理完成，共处理 {processed_files} 个文件，找到 {counter_found} 个计数器引用，提取 {len(counter_comments)} 个有效注释")
    return counter_comments

def main():
    # 项目根目录
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 配置目录
    config_dir = os.path.join(project_dir, 'src', 'assets', 'config')
    
    # 输出文件
    output_file = os.path.join(project_dir, 'src', 'assets', 'defaultCommentCache.json')
    
    # 提取计数器注释
    extract_counter_comments(config_dir, output_file)
    
    print("所有处理完成！")

if __name__ == "__main__":
    main()