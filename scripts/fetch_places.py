"""Fetch real, popular places from Wikipedia.

One MediaWiki query per city: category members of "Tourist attractions in
<City>" with coordinates, intro extracts, and langlinkscount — how many
language editions cover the article, a strong "world-famous / pop culture"
popularity signal. Top N per city by that count lands in world_places.json.

Gentle by design: ~12 requests total, proper User-Agent, sleeps between calls.
Run:  backend\\.venv\\Scripts\\python.exe scripts\\fetch_places.py
"""
import json
import time
from pathlib import Path

import requests

UA = {"User-Agent": "AtlasExplorer/0.1 (local development seed; contact: harsh)"}
API = "https://en.wikipedia.org/w/api.php"
OUT = Path(__file__).resolve().parents[1] / "backend" / "app" / "seed" / "world_places.json"

CITIES = {
    "delhi": "Tourist attractions in Delhi",
    "mumbai": "Tourist attractions in Mumbai",
    "jaipur": "Tourist attractions in Jaipur",
    "kolkata": "Tourist attractions in Kolkata",
    "new_york": "Tourist attractions in New York City",
    "london": "Tourist attractions in London",
    "paris": "Tourist attractions in Paris",
    "tokyo": "Tourist attractions in Tokyo",
    "dubai": "Tourist attractions in Dubai",
    "singapore": "Tourist attractions in Singapore",
}
TOP_PER_CITY = 30


def get(params: dict) -> dict:
    for attempt in range(5):
        r = requests.get(API, params=params, headers=UA, timeout=30)
        if r.status_code == 429:
            wait = int(r.headers.get("Retry-After", 30))
            print(f"    429 — sleeping {wait}s")
            time.sleep(wait)
            continue
        r.raise_for_status()
        return r.json()
    raise RuntimeError(f"rate limited repeatedly for {params}")


def member_titles(category: str) -> list[str]:
    titles, cont = [], None
    while True:
        params = {
            "action": "query", "format": "json", "list": "categorymembers",
            "cmtitle": f"Category:{category}", "cmtype": "page", "cmlimit": 500,
        }
        if cont:
            params["cmcontinue"] = cont
        data = get(params)
        titles += [m["title"] for m in data.get("query", {}).get("categorymembers", [])]
        cont = data.get("continue", {}).get("cmcontinue")
        if not cont:
            return titles
        time.sleep(0.3)


def fetch_city(category: str) -> list[dict]:
    titles = member_titles(category)
    out = []
    for i in range(0, len(titles), 10):
        data = get({
            "action": "query", "format": "json",
            "prop": "coordinates|extracts|langlinkscount",
            "titles": "|".join(titles[i:i + 10]),
            "exintro": 1, "explaintext": 1, "exlimit": "max", "redirects": 1,
        })
        for p in (data.get("query", {}).get("pages") or {}).values():
            coords = (p.get("coordinates") or [{}])[0]
            extract = (p.get("extract") or "").strip()
            if "lat" in coords and extract and not p["title"].startswith("List of"):
                out.append({
                    "title": p["title"],
                    "lat": coords["lat"],
                    "lng": coords["lon"],
                    "extract": extract,
                    "langs": p.get("langlinkscount") or 0,
                })
        time.sleep(0.3)
    return out


def categorize(title: str, extract: str) -> str:
    text = f"{title} {extract}".lower()
    checks = [
        (("museum", "gallery"), "Museum"),
        (("park", "garden"), "Park"),
        (("temple", "mosque", "church", "shrine", "cathedral", "gurudwara", "synagogue", "basilica"), "Culture"),
        (("beach", "island", "forest", "waterfall", "zoo", "lake"), "Nature"),
        (("market", "bazaar", "square", "street"), "Street"),
        (("tower", "bridge", "observation", "skywalk", "viewpoint"), "Viewpoint"),
        (("fort", "palace", "monument", "memorial", "tomb", "castle", "minar"), "Monument"),
    ]
    for words, cat in checks:
        if any(w in text for w in words):
            return cat
    return "Landmark"


def main():
    places = []
    for city, category in CITIES.items():
        members = fetch_city(category)
        members.sort(key=lambda m: m["langs"], reverse=True)
        kept = 0
        for m in members:
            if kept >= TOP_PER_CITY:
                break
            places.append({
                "name": m["title"],
                "category": categorize(m["title"], m["extract"]),
                "description": m["extract"][:280],
                "lat": round(m["lat"], 5),
                "lng": round(m["lng"], 5),
                "city": city,
                "langs": m["langs"],
            })
            kept += 1
        print(f"[{city}] {len(members)} candidates, kept top {kept}")
        time.sleep(0.5)

    OUT.write_text(json.dumps(places, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"total: {len(places)} places -> {OUT}")


if __name__ == "__main__":
    main()
