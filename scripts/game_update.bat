@REM 递归遍历config目录，找到包含counter的行，提取计数器ID和注释 到 defaultCommentCache.json
python extract_counter_comments.py
@REM 改换JSON5格式为JSON
python json5_parser.py
@REM process_cards.py 已经不再需要，直接使用改换后的json格式数据
@REM 解析结局
python process_over.py
@REM 缓存文件映射 rite_relations.json
python process_rite_relations.py
@REM 缓存游戏数据
cd ..
python extract_game_data.py
pause
