#!/usr/bin/env python3
"""
上海有色网（SMM）锂矿价格并行爬虫 —— 「同花顺 iFind 主源 + SMM 并行补位」双源方案

目标：抓取 SMM「锂现货价格」页中两个中国现货品种，作为同花顺 iFind 的并行对照源，
      并在同花顺主源空窗期自动回填，保证网页图表与最新价延伸到当日：
      - 锂云母精矿（中国现货） Li₂O:2.0%-2.5%   → 元/吨
      - 锂辉石（中国现货）     Li₂O:5%-5.5%     → 元/吨

数据源：https://newenergy.smm.cn/price/14042-15010
解析方式：复用 smm_crawler.py 已验证的 __NEXT_DATA__ 明文解析（免登录，反爬下仍可用）。

输出/回填：
  1. data/lithium_ore_smm.json        —— 独立并行序列（含 source="SMM中国现货"）
  2. data/lepidolite_price_history.json   —— 若当日日期未在 history 中，则追加 SMM 记录
  3. data/lithium_ore_price_history.json  —— 同上追加锂辉石 SMM 记录
  4. data/lithium_ore_price.json          —— 若 SMM 为该品种最新日期，则更新最新价快照

回填规则：仅当目标日期在对应 history 中不存在时才追加（避免与同花顺恢复发布后的
          同日记录重复）；快照仅在 SMM 为最新日期时更新（同花顺优先）。全部幂等。

用法：
  python smm_lithium_ore_crawler.py            # 抓取、写并行文件、回填同花顺文件
  python smm_lithium_ore_crawler.py --dry-run  # 仅打印，不写文件（探针/校验用）
"""
import asyncio
import json
import os
import shutil
import sys
from datetime import datetime

from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

URL = "https://newenergy.smm.cn/price/14042-15010"
OUTPUT_PATH = "data/lithium_ore_smm.json"

# 品种配置：commodity_key -> (序列 grade 命名, 输出品类描述, 同花顺 history 文件, 快照品类名)
COMMODITY_CONFIG = {
    "lepidolite": {
        "grade": "锂云母精矿2.0-2.5%",
        "label": "锂云母精矿（中国现货） Li₂O:2.0%-2.5%",
        "hist_file": "data/lepidolite_price_history.json",
        "snap_name": "锂云母",
    },
    "spodumene": {
        "grade": "锂辉石精矿5.0-5.5%",
        "label": "锂辉石（中国现货） Li₂O:5%-5.5%",
        "hist_file": "data/lithium_ore_price_history.json",
        "snap_name": "锂辉石",
    },
}
SNAP_FILE = "data/lithium_ore_price.json"


def _norm(s):
    return (s or "").strip()


def _backup(f):
    if os.path.exists(f):
        try:
            shutil.copy2(f, f + ".bak")
        except Exception:
            pass


def classify(name, spec):
    """根据品名/规格判定是否为目标品种，返回 commodity_key 或 None。"""
    n = _norm(name)
    s = _norm(spec)
    if "锂云母" in n and "中国现货" in n:
        if "2.0" in s and "2.5" in s:
            return "lepidolite"
    if "锂辉石" in n and "中国现货" in n:
        if "5%" in s and "5.5" in s:
            return "spodumene"
    return None


def parse_next_data(nd_text):
    """从 __NEXT_DATA__ 提取目标锂矿品种价格。"""
    data = json.loads(nd_text)
    page_props = data.get("props", {}).get("pageProps", {})
    table_data = page_props.get("tableData", [])
    if not isinstance(table_data, list):
        table_data = []

    price_data = []
    for block in table_data:
        if not isinstance(block, dict):
            continue
        for item in block.get("products", []):
            if not isinstance(item, dict):
                continue
            name = _norm(item.get("product_name"))
            spec = _norm(item.get("spec"))
            key = classify(name, spec)
            if key is None:
                continue
            avg = item.get("average")
            if avg is None:
                continue
            low = item.get("low")
            high = item.get("high")
            price_data.append({
                "commodity": key,
                "品名": name,
                "规格": spec,
                "最低价": low,
                "最高价": high,
                "平均价": avg,
                "涨跌": item.get("change_value") or 0,
                "单位": _norm(item.get("unit")),
                "日期": _norm(item.get("renew_date")) or datetime.now().strftime("%Y-%m-%d"),
            })
    return price_data


async def crawl_smm_prices():
    price_data = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            print(f"正在访问: {URL}")
            await page.goto(URL, wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_timeout(5000)  # 等待 Next.js 注水完成

            nd_text = await page.evaluate(
                "() => { const s = document.querySelector('script#__NEXT_DATA__'); return s ? s.textContent : null; }"
            )
            if not nd_text:
                raise RuntimeError("页面未找到 __NEXT_DATA__，可能页面结构已变更")

            print("解析 __NEXT_DATA__ 锂矿价格数据...")
            price_data = parse_next_data(nd_text)
            print(f"成功解析 {len(price_data)} 条目标锂矿品种价格数据")
            if not price_data:
                raise RuntimeError("__NEXT_DATA__ 中未解析到目标锂矿品种，可能页面结构已变更")

            for i, it in enumerate(price_data):
                print(f"{i+1}. [{it['commodity']}] {it['品名']} ({it['规格']}): "
                      f"均价 {it['平均价']} {it['单位']} (涨跌: {it['涨跌']}) [{it['日期']}]")
        except PlaywrightTimeout as e:
            print(f"超时错误: {e}")
        except Exception as e:
            print(f"错误: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await browser.close()
            print("浏览器已关闭")
    return price_data


def load_existing():
    if os.path.exists(OUTPUT_PATH):
        try:
            with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "source": "SMM中国现货",
        "unit": "元/吨",
        "updated": "",
        "lepidolite": {"grade": COMMODITY_CONFIG["lepidolite"]["grade"], "history": []},
        "spodumene": {"grade": COMMODITY_CONFIG["spodumene"]["grade"], "history": []},
    }


def merge_records(existing, price_data):
    for key in ("lepidolite", "spodumene"):
        h = existing.setdefault(key, {"grade": COMMODITY_CONFIG[key]["grade"], "history": []})
        h.setdefault("history", [])

    for it in price_data:
        key = it["commodity"]
        cfg = COMMODITY_CONFIG[key]
        rec = {
            "date": it["日期"],
            "grade": cfg["grade"],
            "origin": "中国现货",
            "min_price": it["最低价"] if it["最低价"] is not None else it["平均价"],
            "max_price": it["最高价"] if it["最高价"] is not None else it["平均价"],
            "avg_price": it["平均价"],
            "unit": it["单位"] or "元/吨",
            "source": "SMM中国现货",
            "note": f"来自SMM中国现货：{it['品名']} ({it['规格']})，涨跌{it['涨跌']}",
        }
        h = existing[key]["history"]
        if rec["date"] in {r["date"] for r in h}:
            h[:] = [r for r in h if r["date"] != rec["date"]]
        h.append(rec)
        h.sort(key=lambda x: x["date"])

    existing["updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return existing


def backfill_tonghuashun(price_data, dry_run):
    """将 SMM 当日值回填进同花顺 history 文件与最新价快照（幂等）。"""
    for it in price_data:
        key = it["commodity"]
        if key not in COMMODITY_CONFIG:
            continue
        cfg = COMMODITY_CONFIG[key]
        hist_file = cfg["hist_file"]
        snap_name = cfg["snap_name"]
        date = it["日期"]
        avg = it["平均价"]
        low = it["最低价"] if it["最低价"] is not None else avg
        high = it["最高价"] if it["最高价"] is not None else avg

        if not os.path.exists(hist_file):
            print(f"[backfill] 跳过：{hist_file} 不存在")
            continue

        hist = json.load(open(hist_file, encoding="utf-8"))
        h = hist["history"]
        existing_dates = {r["date"] for r in h}

        if date in existing_dates:
            src = [r.get("source") for r in h if r["date"] == date]
            print(f"[backfill] {snap_name} {date} 已存在于 history（source={src}），跳过追加")
        else:
            smm_rec = {
                "date": date,
                "grade": cfg["grade"],
                "origin": "中国现货",
                "min_price": low,
                "max_price": high,
                "avg_price": avg,
                "unit": it["单位"] or "元/吨",
                "source": "SMM中国现货",
                "note": f"来自SMM中国现货：{it['品名']} ({it['规格']})，涨跌{it['涨跌']}（同花顺主源空窗期由SMM并行源补位）",
            }
            if dry_run:
                print(f"[backfill][DRY-RUN] 将向 {hist_file} 追加 {snap_name} {date} = {avg} 元/吨 (SMM)")
            else:
                _backup(hist_file)
                h.append(smm_rec)
                h.sort(key=lambda x: x["date"])
                hist["history"] = h
                hist["update_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                hist["data_points"] = len(h)
                json.dump(hist, open(hist_file, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
                print(f"[backfill] 已向 {hist_file} 追加 {snap_name} {date} = {avg} 元/吨 (SMM)")

        # 重新载入确认最新日期
        hist = json.load(open(hist_file, encoding="utf-8"))
        last_date = hist["history"][-1]["date"] if hist["history"] else ""
        if date == last_date:
            if not os.path.exists(SNAP_FILE):
                print(f"[backfill] 跳过：{SNAP_FILE} 不存在")
                continue
            snap = json.load(open(SNAP_FILE, encoding="utf-8"))
            changed = False
            for item in snap:
                if item.get("commodity") == snap_name:
                    d0 = item["data"][0]
                    if dry_run:
                        print(f"[backfill][DRY-RUN] 将更新快照 {snap_name} -> {avg} 元/吨 (SMM)")
                    else:
                        item["source"] = "SMM中国现货"
                        item["url"] = URL
                        item["scrape_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        d0.update({
                            "min_price": low, "max_price": high, "avg_price": avg,
                            "unit": it["单位"] or "元/吨",
                            "update_time": date + " 12:00:00",
                            "source": "SMM中国现货",
                            "note": f"来自SMM中国现货：{it['品名']} ({it['规格']})，涨跌{it['涨跌']}（同花顺主源空窗期补位）",
                        })
                        changed = True
            if changed and not dry_run:
                _backup(SNAP_FILE)
                json.dump(snap, open(SNAP_FILE, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
                print(f"[backfill] 已更新快照 {snap_name} -> {avg} 元/吨 (SMM)")
        else:
            print(f"[backfill] {snap_name} 最新日期为 {last_date}（非SMM {date}），快照保留原值（同花顺优先）")


def main():
    dry_run = "--dry-run" in sys.argv
    price_data = asyncio.run(crawl_smm_prices())
    if not price_data:
        print("\n抓取结果为空，未写入任何数据文件。")
        sys.exit(1)

    if dry_run:
        print("\n[DRY-RUN] 仅打印，不写文件。")
        backfill_tonghuashun(price_data, dry_run=True)
        return

    # 1) 写独立并行序列
    existing = load_existing()
    merged = merge_records(existing, price_data)
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    print(f"\n已写入并行序列: {OUTPUT_PATH}")
    for key in ("lepidolite", "spodumene"):
        h = merged[key]["history"]
        print(f"  {key}: 共 {len(h)} 条，最新 {h[-1]['date']} = {h[-1]['avg_price']} 元/吨")

    # 2) 回填同花顺 history + 快照
    print("\n--- 回填同花顺文件（保证网页显示最新值）---")
    backfill_tonghuashun(price_data, dry_run=False)
    sys.exit(0)


if __name__ == "__main__":
    main()
