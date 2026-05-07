#!/usr/bin/env python3
import json

with open("reports/2026-04-12.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for bu_id, dept in data["departments"].items():
    lead = dept.get("lead", "?")
    headline = dept.get("headline", "?")
    total = dept.get("_meta", {}).get("total_items", 0)
    high = dept.get("_meta", {}).get("high_confidence", 0)
    print(f"=== {bu_id} (总:{total} 高:{high}) ===")
    print(f"  headline: {headline[:55]}")
    print(f"  lead: {lead[:130]}")
    print()