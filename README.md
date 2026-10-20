# DeskKit

Free, private office tools: PDF, image and spreadsheet converters plus everyday calculators. Every tool runs 100% in the browser, so files never leave the user's device.

Live: https://deskkit-f18.pages.dev

- `python3 build.py`: generates the static site into `dist/`
- `./test_all.sh`: builds the site, then runs unit tests (`tests/test_core.js`) and real-Chrome end-to-end tests (`tests/test_browser.js`) against the sample files in `tests/samples/`
- Set `BASE=https://deskkit-f18.pages.dev node tests/test_browser.js` to test the live site.
