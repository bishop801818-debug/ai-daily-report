import sys
sys.path.insert(0, r"D:\trae\AI Daily report")
try:
    from generate_html_report import build_search_tasks, load_bu_configs
    configs = load_bu_configs()
    print(f"configs loaded: {len(configs)} BUs")
    tasks = build_search_tasks()
    print(f"tasks: {type(tasks)} len={len(tasks) if tasks else 0}")
    if tasks:
        for t in tasks[:2]:
            print(f"  - {t['id']}: {t['query'][:60]}...")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()