# hooks/ — Git 钩子同步目录
# ================================
# .git/hooks/ 被 .gitignore 排除，无法直接提交。
# 本目录跟踪所有钩子源码，每次修改后：
#   1. 更新 hooks/pre-commit 或 hooks/post-checkout
#   2. git commit + git push
#   3. 其他成员执行同步脚本：
#        python _sync_hooks.py
#      或手动复制：
#        cp hooks/pre-commit    .git/hooks/pre-commit
#        cp hooks/post-checkout .git/hooks/post-checkout
#        chmod +x .git/hooks/pre-commit .git/hooks/post-checkout
