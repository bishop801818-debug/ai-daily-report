# -*- coding: utf-8 -*-
"""
碳酸锂期货历史K线数据生成器
自动按月切换合约，拼接成连续历史数据
"""
import json, datetime, sys, os

try:
    import akshare as ak
    import pandas as pd
except ImportError:
    print("[ERROR] Please install: pip install akshare pandas")
    sys.exit(1)

OUT_DIR = os.path.join(os.path.dirname(__file__), "reports")
OUT_FILE = os.path.join(OUT_DIR, "lc_futures_history.json")

# 目标时间范围
START_DATE = "2026-01-01"
END_DATE   = datetime.date.today().strftime("%Y-%m-%d")

# 月份 -> 合约代码映射（覆盖2026全年 + 提前查相邻年份）
CONTRACT_RULES = [
    # (年月, 合约前缀)
    ("2025-11", "LC2511"), ("2025-12", "LC2512"),
    ("2026-01", "LC2605"),  # 1月主力: LC2605（2026年5月到期）
    ("2026-02", "LC2605"),
    ("2026-03", "LC2605"),
    ("2026-04", "LC2605"),
    ("2026-05", "LC2606"),  # 5月主力: LC2606（2026年6月到期）
    ("2026-06", "LC2606"),
    ("2026-07", "LC2607"),
    ("2026-08", "LC2608"),
    ("2026-09", "LC2609"),
    ("2026-10", "LC2610"),
    ("2026-11", "LC2611"),
    ("2026-12", "LC2612"),
    ("2027-01", "LC2701"),
    ("2027-02", "LC2701"),
    ("2027-03", "LC2701"),
    ("2027-04", "LC2701"),
    ("2027-05", "LC2705"),
]


def fetch_contract(symbol):
    """获取某合约全部历史数据"""
    try:
        df = ak.futures_zh_daily_sina(symbol=symbol)
        if df.empty:
            return None
        df = df.copy()
        df.columns = [c.strip() for c in df.columns]
        col_map = {c: c for c in df.columns}
        for c in df.columns:
            cl = c.lower()
            if 'date' in cl: col_map[c] = 'date'
            elif 'open' in cl: col_map[c] = 'open'
            elif 'high' in cl: col_map[c] = 'high'
            elif 'low' in cl: col_map[c] = 'low'
            elif 'close' in cl: col_map[c] = 'close'
            elif 'volume' in cl: col_map[c] = 'volume'
            elif 'hold' in cl or 'interest' in cl: col_map[c] = 'hold'
            elif 'settle' in cl: col_map[c] = 'settle'
        df = df.rename(columns=col_map)
        if 'close' not in df.columns:
            return None
        df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
        df = df.sort_values('date').reset_index(drop=True)
        return df
    except Exception as e:
        print(f"  [{symbol}] fetch failed: {e}")
        return None


def build_history():
    """按月规则拼接连续合约"""
    # 收集所有需要的合约
    needed_codes = set()
    for ym, code in CONTRACT_RULES:
        needed_codes.add(code)
    # 额外加当前主力（可能有新合约未在规则中）
    for m in range(1, 13):
        y = 2026
        code = f"LC{y%100:02d}{m:02d}"
        needed_codes.add(code)
        code2 = f"LC{y%100+1:02d}{m:02d}"
        needed_codes.add(code2)

    print("Fetching contract data...")
    all_contracts = {}
    for code in sorted(needed_codes):
        df = fetch_contract(code)
        if df is not None and len(df) > 0:
            all_contracts[code] = df
            print(f"  OK {code}: {len(df)} rows")

    if not all_contracts:
        print("[ERROR] all contracts fetch failed")
        sys.exit(1)

    # 按月规则取数据并拼接
    start_dt = datetime.datetime.strptime(START_DATE, "%Y-%m-%d")
    end_dt   = datetime.datetime.strptime(END_DATE,   "%Y-%m-%d")

    rows = []
    current_dt = start_dt

    while current_dt <= end_dt:
        ym_key = current_dt.strftime("%Y-%m")
        ym_rule = next((code for ym, code in CONTRACT_RULES if ym == ym_key), None)

        if ym_rule and ym_rule in all_contracts:
            df_c = all_contracts[ym_rule]
            date_str = current_dt.strftime("%Y-%m-%d")
            match = df_c[df_c['date'] == date_str]
            if not match.empty:
                row = match.iloc[0]
                rows.append({
                    "date":   date_str,
                    "open":   float(row.get("open", 0)),
                    "high":   float(row.get("high", 0)),
                    "low":    float(row.get("low",  0)),
                    "close":  float(row.get("close", 0)),
                    "volume": int(row.get("volume", 0)),
                    "settle": float(row.get("settle", row.get("close", 0))),
                    "contract": ym_rule,
                })

        current_dt += datetime.timedelta(days=1)

    # 去重（保留首次出现的，即优先更早到期的合约）
    seen = {}
    for r in rows:
        seen[r["date"]] = r
    result = sorted(seen.values(), key=lambda x: x["date"])

    return result


def main():
    print(f"Generating LC futures K-line")
    print(f"Date range: {START_DATE} ~ {END_DATE}")
    print()

    data = build_history()

    if not data:
        print("[ERROR] no data fetched")
        sys.exit(1)

    closes = [r["close"] for r in data]
    max_p  = max(closes) if closes else 0
    min_p  = min(closes) if closes else 0
    latest = data[-1] if data else {}

    result = {
        "symbol":      "碳酸锂期货主连",
        "contract":     latest.get("contract", ""),
        "update_time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "source":      "AkShare-广州期货交易所",
        "start_date":  data[0]["date"],
        "end_date":    data[-1]["date"],
        "data_points": len(data),
        "min_price":   min_p,
        "max_price":   max_p,
        "latest": {
            "date":    latest.get("date", ""),
            "open":    latest.get("open", 0),
            "high":    latest.get("high", 0),
            "low":     latest.get("low",  0),
            "close":   latest.get("close", 0),
            "volume":  latest.get("volume", 0),
            "contract": latest.get("contract", ""),
        },
        "history": data,
    }

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print()
    print("Generate OK!")
    print(f"  File: reports/lc_futures_history.json")
    print(f"  Data points: {len(data)} trading days")
    print(f"  Range: {data[0]['date']} ~ {data[-1]['date']}")
    print(f"  Latest: {latest.get('date')} close {latest.get('close'):,.0f} ({latest.get('contract')})")
    print(f"  Max: {max_p:,.0f} | Min: {min_p:,.0f}")


if __name__ == "__main__":
    main()
