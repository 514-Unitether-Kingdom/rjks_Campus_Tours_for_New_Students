# -*- coding: utf-8 -*-
"""
T8 AI 助手：知识库配图构建脚本（后端 B / 任晟达）

作用：
  1. 从"工大百科知识库"里，把已导入 kb_entries 的那 62 条条目所引用的
     非装饰图片，按 blocks 里的原文顺序收集出来；
  2. 压缩到长边 1200px / JPEG q85（手机聊天框够清晰，体积小、异步秒出），
     输出到 backend/public/kb-images/（后端静态托管此目录）；
  3. 生成 sql/t8_kb_gongda_images.sql —— 只对这些条目做
     UPDATE kb_entries SET images=... WHERE question=... AND source=...，
     不触碰已有的 category/question/answer/keywords。

可重复执行：图片已存在则跳过压缩；SQL 每次覆盖重写。

用法（在 backend/ 目录）：
  python scripts/build_kb_images.py
  # 知识库路径默认 ../../工大百科知识库，可用 --kb 覆盖

依赖：Pillow。   pip install pillow
"""
import argparse
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)

MAX_EDGE = 1200      # 长边上限，表格类图保清晰
JPEG_QUALITY = 85    # 文字/表格边缘不糊
SOURCE_TAG = '工大百科(学生整理)'   # 与导入时一致，作为 UPDATE 的第二定位键

# 噪音图过滤：二维码/宣传图/推广/拉群/梗图 挂在答案下面不专业，剔除。
# 注意别误杀有用的教程截图（如"医院公众号首页截图，红框标注挂号入口"），
# 所以只按明确的营销特征词，不按"公众号/截图"这类中性词过滤。
NOISE_PATTERN = re.compile(r'二维码|宣传图|宣传海报|推广|拉人加群|拉群|梗|表情包|小程序码')


def is_noise(desc):
    return bool(NOISE_PATTERN.search(desc or ''))


def clean_desc(desc):
    """规范化图注：
    - 去掉每条都有的冗余机构前缀（北京工业大学/北工大/我校，语境已是北工大），精简阅读；
    - 把 ASCII 双引号转中文引号、去反斜杠/换行，保证 json.dumps 零反斜杠，
      避免 JSON 列 + MySQL 反斜杠转义踩坑。"""
    d = (desc or '').strip()
    d = re.sub(r'^(北京工业大学|北工大|我校)\s*', '', d)  # 只去开头，"北京友谊医院"等不误伤
    d = re.sub(r'"([^"]*)"', r'“\1”', d)   # 成对双引号 → 中文引号
    d = d.replace('"', '”').replace('\\', ' ')
    d = re.sub(r'\s+', ' ', d).strip()
    return d


def sql_escape(s):
    """MySQL 单引号字符串转义：先转义反斜杠，再转义单引号，去掉换行。"""
    return str(s).replace('\\', '\\\\').replace("'", "''").replace('\r', ' ').replace('\n', ' ')


def compress(src_path, dst_path):
    """压缩到长边<=MAX_EDGE 的 JPEG。已存在则跳过。返回输出字节数。"""
    if os.path.exists(dst_path):
        return os.path.getsize(dst_path)
    im = Image.open(src_path)
    w, h = im.size
    scale = MAX_EDGE / max(w, h)
    if scale < 1:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    if im.mode in ('RGBA', 'P', 'LA'):
        # JPEG 不支持透明；铺白底
        bg = Image.new('RGB', im.size, (255, 255, 255))
        im = im.convert('RGBA')
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert('RGB')
    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    im.save(dst_path, 'JPEG', quality=JPEG_QUALITY, optimize=True)
    return os.path.getsize(dst_path)


def imported_titles(sql_path):
    """从已生成的 t8_kb_gongda.sql 里取出被导入的 62 个 question(=title)。"""
    txt = open(sql_path, encoding='utf-8').read()
    rows = re.findall(r"INSERT INTO kb_entries \([^)]*\) VALUES \('(.*?)'\);", txt, re.S)
    return set(v.split("','")[1] for v in rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--kb', default=os.path.join(BACKEND, '..', '..', '工大百科知识库'),
                    help='工大百科知识库文件夹路径')
    args = ap.parse_args()

    kb_dir = os.path.abspath(args.kb)
    kb_json = os.path.join(kb_dir, 'knowledge_base.json')
    gongda_sql = os.path.join(BACKEND, 'sql', 't8_kb_gongda.sql')
    out_img_dir = os.path.join(BACKEND, 'public', 'kb-images')
    out_sql = os.path.join(BACKEND, 'sql', 't8_kb_gongda_images.sql')

    if not os.path.exists(kb_json):
        print('找不到 knowledge_base.json：', kb_json); sys.exit(1)

    titles = imported_titles(gongda_sql)
    entries = json.load(open(kb_json, encoding='utf-8'))

    total_bytes = 0
    used = set()
    dropped = []   # 被噪音过滤掉的 desc，供复核
    updates = []   # (title, images_json_str)
    for e in entries:
        title = e.get('title', '')
        if title not in titles:
            continue
        imgs = []
        seen = set()
        for b in e.get('blocks', []):
            if not (isinstance(b, dict) and b.get('type') == 'image'):
                continue
            if b.get('decorative'):
                continue
            desc = (b.get('desc') or '').strip()
            if is_noise(desc):
                dropped.append(desc)
                continue
            loc = b.get('local')            # 形如 images/xxxx.png
            if not loc or loc in seen:
                continue
            src = os.path.join(kb_dir, loc)
            if not os.path.exists(src):
                print('  ! 缺图，跳过:', loc); continue
            seen.add(loc)
            stem = os.path.splitext(os.path.basename(loc))[0]
            dst = os.path.join(out_img_dir, stem + '.jpg')
            total_bytes += compress(src, dst)
            used.add(stem)
            imgs.append({'url': '/kb-images/%s.jpg' % stem, 'desc': clean_desc(desc)})
        if imgs:
            updates.append((title, json.dumps(imgs, ensure_ascii=False)))

    # 写 SQL
    lines = [
        'SET NAMES utf8mb4;',
        '-- T8 AI 助手：为工大百科条目补 images（图文配图）。后端 B / 任晟达。',
        '-- 只更新 images 列，不动 category/question/answer/keywords。',
        '-- 依赖：先跑 t8_ai_schema.sql（含 images 列）与 t8_kb_gongda.sql（含 INSERT）。',
        '',
    ]
    for title, imgs_json in updates:
        lines.append(
            "UPDATE kb_entries SET images='%s' WHERE question='%s' AND source='%s';"
            % (sql_escape(imgs_json), sql_escape(title), sql_escape(SOURCE_TAG))
        )
    open(out_sql, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')

    print('压缩图片输出目录:', out_img_dir)
    print('去重图片数:', len(used), '  压缩后总大小: %.1f MB' % (total_bytes / 1024 / 1024))
    print('带图条目数(UPDATE 行):', len(updates))
    print('噪音过滤丢弃图片数:', len(dropped))
    for d in sorted(set(dropped)):
        print('   [丢]', d[:50])
    print('生成 SQL:', out_sql)


if __name__ == '__main__':
    main()
