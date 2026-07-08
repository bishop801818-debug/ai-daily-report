#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 reports/*.json 日报渲染为 Aily 知识空间支持的 Markdown 文档。

设计要点：
- 每个 json 文件 -> 一个 .md 文档（主报 / 单事业部报 统一处理，按结构自适应）。
- 兼容 sections 的两种写法：列表 [{dim,title,items}] 或字典 {dim:[items]}。
- 兼容字段缺失 / 非字典项：自动跳过，不抛错。
- 单文件渲染异常时跳过并警告，不影响整体批量转换。
- 输出到 _aily_kb/ 目录（不进妙搭发布包，仅供同步脚本上传飞书云盘）。

用法：
    python _aily_export.py
    python _aily_export.py --since 2026-07-01
"""
import json, glob, os, re, sys, argparse
from pathlib import Path
from datetime import datetime

ROOT = Path(r"D:/trae/AI Daily report")
REPORTS = ROOT / "reports"
OUT = ROOT / "_aily_kb"

DIM_LABEL = {
    "topnews": "今日关注", "market": "市场/价格", "policy": "政策/行业",
    "enterprise": "企业动态", "tech": "技术/产品", "project": "项目/招标",
    "tips": "专属提示", "competitor": "竞品动态", "customer": "客户动态",
    "frontier": "前沿技术",
}

def clean(text):
    if not text:
        return ""
    return re.sub(r"\s+", " ", str(text)).strip()

def render_item(it):
    if not isinstance(it, dict):
        return None
    title = clean(it.get("title"))
    content = clean(it.get("content"))
    source = clean(it.get("source"))
    date = clean(it.get("date"))
    url = clean(it.get("url"))
    priority = clean(it.get("priority"))
    if not title and not content:
        return None
    line = f"- **{title}**" if title else "-"
    if priority:
        line += f" `[{priority}]`"
    if content:
        line += f"：{content}"
    meta = []
    if source and source not in content:
        meta.append(f"来源：{source}")
    if date and date not in content:
        meta.append(f"日期：{date}")
    if meta:
        line += f"（{'；'.join(meta)}）"
    if url:
        line += f"  [原文]({url})"
    return line

def render_sections(sections):
    out = []
    if isinstance(sections, dict):
        for dim, items in sections.items():
            title = DIM_LABEL.get(dim, dim or "其他")
            out.append(f"\n## {title}\n")
            items = items if isinstance(items, list) else []
            rendered = [render_item(it) for it in items]
            rendered = [x for x in rendered if x]
            out.extend(rendered) if rendered else out.append("_（本板块暂无条目）_")
        return "\n".join(out)
    # list 形式
    for sec in sections or []:
        if not isinstance(sec, dict):
            continue
        dim = clean(sec.get("dim"))
        title = clean(sec.get("title")) or DIM_LABEL.get(dim, dim or "其他")
        out.append(f"\n## {title}\n")
        items = [render_item(it) for it in sec.get("items", [])]
        items = [x for x in items if x]
        if items:
            out.extend(items)
        else:
            out.append("_（本板块暂无条目）_")
    return "\n".join(out)

def render_report(data, filename):
    parts = []
    date = clean(data.get("date") or data.get("today"))
    name = clean(data.get("name"))
    bu_name = name or ""
    if not bu_name and data.get("departments"):
        bus = [clean(b.get("bu_name", k)) for k, b in data["departments"].items() if isinstance(b, dict)]
        bu_name = "、".join(b for b in bus if b) or "全公司"
    title = f"锂电早报 {date}" + (f" · {bu_name}" if bu_name else "")
    parts.append(f"# {title}\n")
    parts.append(f"> 生成日期：{datetime.now().strftime('%Y-%m-%d %H:%M')} ｜ 源文件：`{filename}`\n")

    header = data.get("header")
    if isinstance(header, dict):
        concl = clean(header.get("核心结论"))
        if concl:
            parts.append(f"\n**核心结论**：{concl}\n")

    if data.get("departments") and isinstance(data["departments"], dict):
        for bu_id, bu in data["departments"].items():
            if not isinstance(bu, dict):
                continue
            bn = clean(bu.get("bu_name", bu_id))
            parts.append(f"\n# {bn}\n")
            parts.append(render_sections(bu.get("sections")))
    elif data.get("sections"):
        parts.append(render_sections(data.get("sections")))

    parts.append("\n\n---\n*本内容由 AI 早报系统自动生成，供内部检索与问答使用。*\n")
    return "\n".join(parts)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--since", help="仅转换该日期及之后的日报，如 2026-07-01")
    args = ap.parse_args()
    OUT.mkdir(exist_ok=True)
    files = sorted(glob.glob(str(REPORTS / "2026-*.json")))
    if not files:
        print("⚠️ 未找到 reports/*.json")
        return
    count = 0
    skipped = 0
    for f in files:
        fn = os.path.basename(f)
        m = re.match(r"(\d{4}-\d{2}-\d{2})", fn)
        if args.since and m and m.group(1) < args.since:
            continue
        try:
            data = json.load(open(f, encoding="utf-8"))
            md = render_report(data, fn)
            out_path = OUT / (Path(fn).stem + ".md")
            out_path.write_text(md, encoding="utf-8")
            count += 1
        except Exception as e:
            skipped += 1
            print(f"⚠️ 跳过 {fn}（渲染失败：{e}）")
    print(f"✅ 已转换 {count} 份日报 -> {OUT}/" + (f"；跳过 {skipped} 份异常" if skipped else ""))

if __name__ == "__main__":
    main()
