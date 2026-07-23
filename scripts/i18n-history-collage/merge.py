#!/usr/bin/env python3
"""Merge an aiHistoryCollage translation block into a messages/<locale>.json file.

Usage: python3 scripts/i18n-history-collage/merge.py <locale>
Reads scripts/i18n-history-collage/<locale>.json ({"nav": ..., "namespace": {...}})
and inserts:
  - top-level "aiHistoryCollage" right after "aiKiss" (or appended)
  - common.navigation.dropdown.aiHistoryCollage right after aiKiss
"""
import json
import sys
from pathlib import Path

def insert_after(d: dict, after_key: str, new_key: str, value) -> dict:
    out = {}
    inserted = False
    for k, v in d.items():
        out[k] = v
        if k == after_key:
            out[new_key] = value
            inserted = True
    if not inserted:
        out[new_key] = value
    return out

def main() -> None:
    locale = sys.argv[1]
    root = Path(__file__).resolve().parents[2]
    block = json.loads((Path(__file__).parent / f"{locale}.json").read_text())
    target = root / "messages" / f"{locale}.json"
    data = json.loads(target.read_text())

    if "aiHistoryCollage" in data:
        print(f"{locale}: aiHistoryCollage already present, replacing")
        data["aiHistoryCollage"] = block["namespace"]
    else:
        data = insert_after(data, "aiKiss", "aiHistoryCollage", block["namespace"])

    dropdown = data["common"]["navigation"]["dropdown"]
    data["common"]["navigation"]["dropdown"] = insert_after(
        dropdown, "aiKiss", "aiHistoryCollage", block["nav"]
    )

    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(f"{locale}: merged OK")

if __name__ == "__main__":
    main()
