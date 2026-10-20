#!/bin/sh
# Build and run all DeskKit tests (unit + real-browser end-to-end).
set -e
cd "$(dirname "$0")"
python3 build.py
node tests/make_pdfs.js
node tests/test_core.js
node tests/test_browser.js
