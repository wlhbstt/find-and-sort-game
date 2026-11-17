"""Replace Capacitor web assets while retaining native IPA ZIP metadata."""

import argparse
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


parser = argparse.ArgumentParser()
parser.add_argument("base", type=Path, help="Unsigned IPA produced by the macOS build")
parser.add_argument("web", type=Path, help="Private Vite dist directory")
parser.add_argument("output", type=Path)
args = parser.parse_args()

web_root = args.web.resolve()
if not (web_root / "index.html").is_file():
    parser.error("web directory must contain index.html")
if args.output.exists():
    parser.error("output already exists")

public_prefix = "Payload/App.app/public/"
with ZipFile(args.base) as source, ZipFile(args.output, "x") as target:
    executable = source.getinfo("Payload/App.app/App")
    if not executable.external_attr >> 16 & 0o111:
        parser.error("base IPA has lost executable permissions")

    for entry in source.infolist():
        if entry.filename.startswith(public_prefix) and entry.filename != public_prefix:
            continue
        target.writestr(entry, source.read(entry))

    for file in sorted(web_root.rglob("*")):
        if not file.is_file():
            continue
        entry = ZipInfo(public_prefix + file.relative_to(web_root).as_posix())
        entry.create_system = 3
        entry.external_attr = 0o100644 << 16
        entry.compress_type = ZIP_DEFLATED
        target.writestr(entry, file.read_bytes())

with ZipFile(args.output) as package:
    if package.testzip() is not None:
        raise SystemExit("IPA failed CRC validation")
    print(f"Created {args.output} ({len(package.namelist())} entries)")
