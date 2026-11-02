import csv
from pathlib import Path

import requests

ACCESS_TOKEN = "EAAeqyB5yLz0BPSvRPkakAhdPU8lZB8o34wCGZAi4kEjTBgQYP4XrWL1baRLZA2PixEbMwrs0UIZBfhZBXwjWJ5yKR3x9MnTZCdQAHzNvqf2qXK8fnTb3dr36kjoQZBfSYOj0eZByZBzbJleBvO0sptIfbRYKBrFzbnd2wZAQ4XroN6t69WE0RHOwqLdHnepK0bLcNZBTwZDZD"

HERE = Path(__file__).parent
INPUT_FILE = HERE / "waba_input.csv"
OUTPUT_FILE = HERE / "output_category.csv"


def fetch_templates(waba_id):
    url = f"https://graph.facebook.com/v26.0/{waba_id}/message_templates"
    params = {"limit": 1000, "fields": "name,previous_category,category"}
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    while url:
        response = requests.get(url, params=params, headers=headers, timeout=60)
        response.raise_for_status()
        result = response.json()
        yield from result.get("data", [])
        # The next URL already carries the cursor and fields.
        url = result.get("paging", {}).get("next")
        params = None


with open(INPUT_FILE, newline="", encoding="utf-8-sig") as f:
    waba_ids = [row["waba_id"].strip() for row in csv.DictReader(f) if row["waba_id"].strip()]

with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as out:
    writer = csv.writer(out)
    writer.writerow(["waba_id", "name", "previous_category", "category"])
    for waba_id in waba_ids:
        try:
            count = 0
            for t in fetch_templates(waba_id):
                writer.writerow([waba_id, t.get("name"), t.get("previous_category") or "null", t.get("category")])
                count += 1
            print(f"{waba_id}: {count} templates")
        except requests.RequestException as e:
            body = getattr(e.response, "text", "")
            print(f"{waba_id}: FAILED - {e} {body}")

print(f"\nWrote {OUTPUT_FILE}")
