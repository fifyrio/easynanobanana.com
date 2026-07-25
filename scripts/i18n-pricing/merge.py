#!/usr/bin/env python3
"""Merge translated pricing features into messages/<locale>.json.
Usage: python3 scripts/i18n-pricing/merge.py <locale>
Reads scripts/i18n-pricing/<locale>.json: {"subscriptions": {Basic|Pro|Max: {"0"..}}, "faq1": {question, answer}}
"""
import json, sys
from pathlib import Path
locale = sys.argv[1]
root = Path(__file__).resolve().parents[2]
block = json.loads((Path(__file__).parent / f"{locale}.json").read_text())
target = root / "messages" / f"{locale}.json"
d = json.loads(target.read_text())
for plan, feats in block["subscriptions"].items():
    d["pricing"]["plans"]["subscriptions"][plan]["features"] = feats
d["pricing"]["faq"]["items"]["1"] = block["faq1"]
target.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n")
print(f"{locale}: merged OK")
