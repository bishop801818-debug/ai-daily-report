# hooks/ — Git 钩子同步目录
# ================================
# 本目录用于跟踪钩子源码（.git/hooks/ 自身不受版本控制）。
#
# 修改钩子后：
#   1. 编辑 hooks/pre-commit
#   2. git commit + git push
#   3. 部署到本地仓库：
#        cp hooks/pre-commit .git/hooks/pre-commit
#        chmod +x .git/hooks/pre-commit
#   注：仓库中【不存在】_sync_hooks.py，请用上面的手动 cp 方式部署。
#   注：hooks/post-checkout 仍为未跟踪的旧副本（2026-08-31，CRLF），
#       尚未与本目录规范同步，暂勿直接部署。
#
# 运行依赖（pre-commit v3 起）
#   hooks/pre-commit          数据保护钩子本体
#   _db_guard.py              磁盘基线守护：核心数据文件（约 41MB）不在 git 跟踪
#                             范围，回退保护由它承担；阈值见脚本头部说明
#   _db_guard_baseline.json   基线快照（首次运行自动生成，检查通过后自动刷新，
#                             不入库；被 .gitignore 的 `_*` 规则忽略）
#   protect_html.py           HTML 轻量化检查
#
# 逃生舱（仅环境故障时应急）
#   SKIP_DATA_GUARD=1 git commit ...       跳过全部数据保护检查
#   DB_GUARD_MAX_SHRINK / DB_GUARD_MAX_LAG 调整 db-guard 阈值
#
# 变更记录
#   v3  2026-09-18  PATH 自愈 + 工具缺失 fail-closed；静态 tr 守卫改为「相对 HEAD
#                   增量」判定（原逻辑对该文件任何改动都拦）；新增第 2b 节接入
#                   _db_guard.py；体积统计修正；颜色改用 printf 展开
#   v2  2026-09-18  草稿（未部署到本目录）
#   v1  ≤2026-08-31 原版
