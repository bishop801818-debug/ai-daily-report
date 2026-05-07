# -*- coding: utf-8 -*-
"""
碳酸锂期货自动更新脚本
从 AkShare 获取广期所碳酸锂期货最新行情，写入 market_lc.json
"""
import json, datetime, sys, os
sys.path.insert(0, os.path.dirname(__file__))

try:
    import akshare as ak
    import pandas as pd
except ImportError:
    print("[ERROR] 请先安装: pip install akshare pandas")
    sys.exit(1)

OUT_FILE = os.path.join(os.path.dirname(__file__), "reports", "market_lc.json")


def find_active_contracts():
    """查找当前活跃的碳酸锂合约，返回按日期倒序排列"""
    today = datetime.date.today()
    contracts = []
    # 搜索未来12个月 + 当前年份
    for offset in range(13):
        m = (today.month + offset - 1) % 12 + 1
        y = today.year + (today.month + offset - 1) // 12
        code = f"LC{y%100:02d}{m:02d}"
        try:
            df = ak.futures_zh_daily_sina(symbol=code)
            if not df.empty:
                row = df.iloc[-1]
                contracts.append({
                    "code": code,
                    "date": str(row["date"])[:10],
                    "close": float(row["close"]),
                    "open": float(row["open"]),
                    "high": float(row["high"]),
                    "low": float(row["low"]),
                    "settle": float(row["settle"]) if "settle" in row else float(row["close"]),
                    "volume": int(row["volume"]) if "volume" in row else 0,
                    "hold": int(row["hold"]) if "hold" in row else 0,
                })
        except Exception:
            pass
    contracts.sort(key=lambda x: x["date"], reverse=True)
    return contracts[:12]  # 去重，最多保留12个


def build_contracts(ac_list):
    """把活跃合约列表格式化为 market_lc.json 的 contracts 数组"""
    result = []
    today = datetime.date.today()
    today_str = today.strftime("%Y%m%d")

    for item in ac_list[:8]:  # 最多8个合约
        date_str = item["date"].replace("-", "")  # "20260506"
        prev_date = None

        # 获取昨收：取同一合约前一交易日
        try:
            code_raw = item["code"]
            df_all = ak.futures_zh_daily_sina(symbol=code_raw)
            if not df_all.empty:
                df_all = df_all.sort_values("date")
                idx = df_all[df_all["date"] == item["date"]].index
                if len(idx) and idx[0] > 0:
                    prev_row = df_all.iloc[idx[0] - 1]
                    prev_date = str(prev_row["date"])[:10]
                    prev_close = float(prev_row["close"])
                else:
                    prev_close = item["close"]
            else:
                prev_close = item["close"]
        except Exception:
            prev_close = item["close"]

        change_pct = 0.0
        if prev_close and prev_close != 0:
            change_pct = round((item["close"] - prev_close) / prev_close * 100, 2)

        name_map = {
            "lc2701": "碳酸锂2701", "lc2702": "碳酸锂2702", "lc2703": "碳酸锂2703",
            "lc2704": "碳酸锂2704", "lc2705": "碳酸锂2705", "lc2706": "碳酸锂2706",
            "lc2707": "碳酸锂2707", "lc2708": "碳酸锂2708",
        }
        code_lower = item["code"].lower()
        display_name = name_map.get(code_lower, f"碳酸锂{item['code'][2:]}")

        trend = "up" if change_pct > 0 else ("down" if change_pct < 0 else "stable")

        result.append({
            "code": code_lower,
            "name": display_name,
            "price": item["close"],
            "change_pct": change_pct,
            "high": item["high"],
            "low": item["low"],
            "open": item["open"],
            "prev_close": prev_close,
            "secid": f"225.{code_lower}",
            "trend": trend,
            "detail": {
                "date": item["date"],
                "settle_price": item["settle"],
                "open_interest": item["hold"],
                "volume": item["volume"],
            }
        })

    # 补充主连和次主连（用最新有数据的合约）
    main = result[0] if result else None
    sub = result[1] if len(result) > 1 else None

    contracts = []
    if sub:
        contracts.append({
            "code": "lcs", "name": "碳酸锂次主连",
            "price": sub["price"], "change_pct": sub["change_pct"],
            "high": sub["high"], "low": sub["low"],
            "open": sub["open"], "prev_close": sub["prev_close"],
            "secid": "225.lcs", "trend": sub["trend"],
            "detail": sub["detail"]
        })
    if main:
        contracts.append({
            "code": "lcm", "name": "碳酸锂主连",
            "price": main["price"], "change_pct": main["change_pct"],
            "high": main["high"], "low": main["low"],
            "open": main["open"], "prev_close": main["prev_close"],
            "secid": "225.lcm", "trend": main["trend"],
            "detail": main["detail"]
        })
    contracts.extend(result)

    return contracts


def main():
    print("正在获取碳酸锂期货数据...")
    ac_list = find_active_contracts()
    if not ac_list:
        print("[ERROR] 未获取到任何合约数据，可能是网络问题或数据源维护")
        sys.exit(1)

    contracts = build_contracts(ac_list)
    data = {
        "update_time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "source": "AkShare-广期所",
        "contracts": contracts
    }

    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    main_contract = contracts[1] if len(contracts) > 1 else (contracts[0] if contracts else None)
    if main_contract:
        print(f"\n更新成功！")
        print(f"  主力合约: {main_contract['name']}")
        print(f"  最新价:   {main_contract['price']:,.0f} 元/吨")
        print(f"  涨跌幅:   {main_contract['change_pct']:+.2f}%")
        print(f"  日期:     {main_contract['detail']['date']}")
        print(f"  共获取 {len(contracts)} 个合约")
    else:
        print("更新完成，但未找到主力合约数据")


if __name__ == "__main__":
    main()
