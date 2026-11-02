import csv
import re
from pathlib import Path

HERE = Path(__file__).parent
EXCLUDE_FILE = HERE / "exclude_templates.sql"
INPUT_FILE = HERE / "output_category.csv"
OUTPUT_FILE = HERE / "clean_category.csv"

# Pull every ('name') out of the SQL VALUES list, skipping commented-out lines like --('c2_stop_comm').
excluded = set()
for line in EXCLUDE_FILE.read_text(encoding="utf-8").splitlines():
    code = line.split("--")[0]
    excluded.update(re.findall(r"\('([^']*)'\)", code))
if not excluded:
    raise SystemExit(f"No template names found in {EXCLUDE_FILE} - paste the old_template VALUES list into it first.")

kept = dropped = 0
with open(INPUT_FILE, newline="", encoding="utf-8") as f, open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as out:
    reader = csv.DictReader(f)
    writer = csv.DictWriter(out, fieldnames=reader.fieldnames)
    writer.writeheader()
    for row in reader:
        if row["name"] in excluded:
            dropped += 1
        else:
            writer.writerow(row)
            kept += 1

print(f"{len(excluded)} excluded names, dropped {dropped} rows, kept {kept} rows -> {OUTPUT_FILE}")
