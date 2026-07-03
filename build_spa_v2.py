#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
构建妙搭部署版本 V2：
- index.html 只含代码逻辑（不嵌入数据），体积 ~200KB
- data.js      含所有 JSON 数据，单独文件
- chart_data.js 含图表历史数据，单独文件
用法：python build_spa_v2.py
"""

import re, json, os, shutil, glob

BASE_DIR = "D:/trae/AI Daily report"
HTML_SRC  = f"{BASE_DIR}/index_v3.html"
DIST_DIR  = f"{BASE_DIR}/dist"
OUT_HTML  = f"{DIST_DIR}/index.html"
OUT_DATA  = f"{DIST_DIR}/data.js"
OUT_CHART = f"{DIST_DIR}/chart_data.js"

# ── 准备 dist 目录 ────────────────────────────────────────────────
os.makedirs(DIST_DIR, exist_ok=True)

# ── 1. 读取原 HTML ───────────────────────────────────────────────
with open(HTML_SRC, "r", encoding="utf-8") as f:
    html = f.read()

print(f"原始 HTML 大小: {len(html)/1024/1024:.2f} MB")

# ── 2. 收集所有需要的数据 ─────────────────────────────────────────
def load_json(file_path):
    fp = f"{BASE_DIR}/{file_path}"
    if not os.path.exists(fp):
        print(f"  ⚠️  文件不存在: {file_path}")
        return None
    with open(fp, "r", encoding="utf-8") as f:
        return json.load(f)

# 报告索引（使用 available_dates 字段）
index_data = load_json("reports/index.json") or {}
available_dates = index_data.get("available_dates", [])[:7]  # 只取最新7天

print(f"  可用报告日期: {available_dates[:3]}...")

# 只加载最新1天的报告数据（减少体积）
reports_data = {}
if available_dates:
    date_str = available_dates[0]
    fp = f"{BASE_DIR}/reports/{date_str}.json"
    if os.path.exists(fp):
        try:
            with open(fp, "r", encoding="utf-8") as f:
                reports_data[date_str] = json.load(f)
            print(f"  内嵌报告: {date_str}")
        except Exception as e:
            print(f"  ⚠️  读取 {date_str}.json 失败: {e}")

print(f"  内嵌报告数: {len(reports_data)}")

# 策略中心数据（小文件，保留）
policies_data = load_json("reports/policies.json") or []

# BU logo 数据（小文件，保留）
bu_logos_data = load_json("bu_logos.json") or {}

# 热点新闻数据（中等大小，保留）
hot_news_data = load_json("hot_news_data.json") or {}

# 锂电全景数据（大文件，不嵌入，改为运行时加载）
# lib_battery_data = load_json("lib_battery_all_data.json") or {}
lib_battery_data = {}  # 不嵌入，减小体积

# 各品种全景数据（大文件，不嵌入）
automotive_data = {}
carbonate_data = {}
electrolyte_data = {}
ternary_data = {}
recycling_data = {}

# ── 3. 生成 data.js（所有业务数据）────────────────────────────
now_str = __import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')
ver_str = __import__('datetime').datetime.now().strftime('%Y%m%d%H%M')

data_js = f"""// 数据文件（由 build_spa_v2.py 自动生成，请勿手动编辑）
// 生成时间：{now_str}

window.__EMBEDDED__ = {{
  // 报告索引
  index: {json.dumps(index_data, ensure_ascii=False)},
  
  // 最新报告数据（最近7天）
  reports: {json.dumps(reports_data, ensure_ascii=False)},
  
  // 策略中心
  policies: {json.dumps(policies_data, ensure_ascii=False)},
  
  // BU logo
  buLogos: {json.dumps(bu_logos_data, ensure_ascii=False)},
  
  // 热点新闻
  hotNews: {json.dumps(hot_news_data, ensure_ascii=False)},
  
  // 锂电全景
  libBattery: {json.dumps(lib_battery_data, ensure_ascii=False)},
  
  // 各品种全景数据
  automotive: {json.dumps(automotive_data, ensure_ascii=False)},
  carbonate: {json.dumps(carbonate_data, ensure_ascii=False)},
  electrolyte: {json.dumps(electrolyte_data, ensure_ascii=False)},
  ternary: {json.dumps(ternary_data, ensure_ascii=False)},
  recycling: {json.dumps(recycling_data, ensure_ascii=False)}
}};
"""

with open(OUT_DATA, "w", encoding="utf-8") as f:
    f.write(data_js)

print(f"✅ 生成 data.js: {len(data_js)/1024:.1f} KB")

# ── 4. 图表数据不嵌入（太大），改为运行时加载 ─────────
chart_data = {}  # 空，不从本地嵌入

chart_js = f"""// 图表数据文件（由 build_spa_v2.py 自动生成，请勿手动编辑）
// 生成时间：{now_str}
// 注意：图表数据不嵌入，改为运行时从原始路径加载

window.__CHART_DATA__ = {{}};
"""

with open(OUT_CHART, "w", encoding="utf-8") as f:
    f.write(chart_js)

print(f"✅ 生成 chart_data.js: {len(chart_js)/1024:.1f} KB (空，运行时加载)")

# ── 5. 修改 HTML：注入 data.js 和 chart_data.js 的引用 ────────
# 在 </head> 前插入 data.js 和 chart_data.js 的引用
inject_tag = f"""    <!-- 嵌入数据（妙搭部署版） -->
    <script src="data.js?v={ver_str}"></script>
    <script src="chart_data.js?v={ver_str}"></script>
    <script src="assets/ai_fab_inject.js?v=20260619"></script>
    <script src="feishu-jsapi.js?v=20260622"></script>
</head>"""

html = re.sub(r'</head>', inject_tag, html, count=1)

# 移除原 HTML 中可能存在的嵌入式数据脚本（如果有）
html = re.sub(r'<script id="__EMBEDDED_DATA__">.*?</script>', '', html, flags=re.DOTALL)

# ── 6. 注入 SPA 路由脚本（处理子页面跳转）────────────────────
spa_script = f"""
<script>
// SPA 路由：拦截子页面跳转，改为 hash 路由
(function() {{
    console.log('[SPA] 妙搭部署版已加载，版本: {ver_str}');
    
    // 拦截所有 fetch 请求，优先返回内嵌数据
    const origFetch = window.fetch;
    window.fetch = function(url, opts) {{
        // 报告索引
        if (url.includes('reports/index.json')) {{
            const data = window.__EMBEDDED__?.index;
            if (data) {{
                console.log('[DATA] 返回内嵌 index.json');
                return Promise.resolve(new Response(
                    JSON.stringify(data),
                    {{headers: {{'Content-Type': 'application/json'}}}}
                ));
            }}
        }}
        // 单日报告数据
        if (url.match(/reports\\/\\d{{4}}-\\d{{2}}-\\d{{2}}\\.json/)) {{
            const date = url.match(/(\\d{{4}}-\\d{{2}}-\\d{{2}})\\.json/)[1];
            const data = window.__EMBEDDED__?.reports?.[date];
            if (data) {{
                console.log('[DATA] 返回内嵌报告:', date);
                return Promise.resolve(new Response(
                    JSON.stringify(data),
                    {{headers: {{'Content-Type': 'application/json'}}}}
                ));
            }}
        }}
        // 策略中心
        if (url.includes('policies.json')) {{
            const data = window.__EMBEDDED__?.policies;
            if (data) {{
                console.log('[DATA] 返回内嵌 policies.json');
                return Promise.resolve(new Response(
                    JSON.stringify(data),
                    {{headers: {{'Content-Type': 'application/json'}}}}
                ));
            }}
        }}
        // BU logo
        if (url.includes('bu_logos.json')) {{
            const data = window.__EMBEDDED__?.buLogos;
            if (data) {{
                console.log('[DATA] 返回内嵌 bu_logos.json');
                return Promise.resolve(new Response(
                    JSON.stringify(data),
                    {{headers: {{'Content-Type': 'application/json'}}}}
                ));
            }}
        }}
        // 热点新闻
        if (url.includes('hot_news_data.json')) {{
            const data = window.__EMBEDDED__?.hotNews;
            if (data) {{
                console.log('[DATA] 返回内嵌 hot_news_data.json');
                return Promise.resolve(new Response(
                    JSON.stringify(data),
                    {{headers: {{'Content-Type': 'application/json'}}}}
                ));
            }}
        }}
        // 锂电全景
        if (url.includes('lib_battery_all_data.json')) {{
            const data = window.__EMBEDDED__?.libBattery;
            if (data) {{
                console.log('[DATA] 返回内嵌 lib_battery_all_data.json');
                return Promise.resolve(new Response(
                    JSON.stringify(data),
                    {{headers: {{'Content-Type': 'application/json'}}}}
                ));
            }}
        }}
        // 各品种全景数据
        for (const key of ['automotive', 'carbonate', 'electrolyte', 'ternary', 'recycling']) {{
            if (url.includes(key + '_all_data.json')) {{
                const data = window.__EMBEDDED__?.[key];
                if (data) {{
                    console.log('[DATA] 返回内嵌 ' + key + '_all_data.json');
                    return Promise.resolve(new Response(
                        JSON.stringify(data),
                        {{headers: {{'Content-Type': 'application/json'}}}}
                    ));
                }}
            }}
        }}
        // 图表数据
        if (url.includes('chart_') && url.includes('.json')) {{
            const key = url.split('/').pop().replace('.json','');
            const data = window.__CHART_DATA__?.[key];
            if (data) {{
                console.log('[DATA] 返回内嵌图表数据:', key);
                return Promise.resolve(new Response(
                    JSON.stringify(data),
                    {{headers: {{'Content-Type': 'application/json'}}}}
                ));
            }}
        }}
        return origFetch.apply(this, arguments);
    }};
    
    // 页面加载完成后检查数据
    document.addEventListener('DOMContentLoaded', function() {{
        console.log('[SPA] 数据检查:', {{
            index: !!window.__EMBEDDED__?.index,
            reports: Object.keys(window.__EMBEDDED__?.reports || {{}}).length,
            policies: !!window.__EMBEDDED__?.policies,
            hotNews: !!window.__EMBEDDED__?.hotNews,
            libBattery: !!window.__EMBEDDED__?.libBattery
        }});
    }});
}})();
</script>
"""

# 在 </body> 前插入 SPA 脚本
html = html.replace('</body>', spa_script + '\n</body>')

# ── 7. 写入最终 HTML ─────────────────────────────────────────────
with open(OUT_HTML, "w", encoding="utf-8") as f:
    f.write(html)

print(f"✅ 生成 index.html: {len(html)/1024:.1f} KB")
print(f"\n✅ 构建完成！文件清单：")
print(f"   - index.html  ({len(html)/1024:.1f} KB)")
print(f"   - data.js     ({len(data_js)/1024:.1f} KB)")
print(f"   - chart_data.js ({len(chart_js)/1024:.1f} KB)")
print(f"\n请执行以下命令发布到妙搭：")
print(f"  lark-cli apps html-publish app_4kes5hs86txbs -f {DIST_DIR}")

# ── 后处理：确保输出 HTML 是轻量化的（无内联大脚本）─────────────────
import subprocess, os
_optimize_script = os.path.join(BASE_DIR, "optimize_html.py")
_result = subprocess.run(
    f'python "{_optimize_script}" "{OUT_HTML}" "{DIST_DIR}"',
    shell=True, capture_output=True, text=True
)
if _result.returncode == 0:
    print("\n✅ 后处理完成：输出 HTML 已轻量化（内联脚本已提取为外部 JS）")
else:
    print(f"\n⚠️  后处理警告：{_result.stderr[:200]}")
