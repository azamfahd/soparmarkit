import shutil
import subprocess
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
URL = "http://localhost:3001"


def make_driver(width: int, height: int):
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--hide-scrollbars")
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(width, height)
    return driver


def capture(name: str, width: int, height: int, wait: float):
    tmp = PUBLIC / f"{name}.raw.png"
    output = PUBLIC / f"{name}.png"
    driver = make_driver(width, height)
    try:
        driver.get(URL)
        time.sleep(wait)
        try:
            driver.execute_script("document.querySelectorAll('button').forEach(b => { if ((b.innerText || '').includes('إغلاق')) b.click(); });")
        except Exception:
            pass
        driver.save_screenshot(str(tmp))
    finally:
        driver.quit()
    # Fit without cropping and fill any viewport-height difference with the app background.
    width_out, height_out = (1280, 720) if name == 'screenshot-wide' else (540, 1170)
    js = f"""
const sharp = require('sharp');
sharp('{tmp}')
  .resize({width_out}, {height_out}, {{ fit: 'contain', background: {{ r: 15, g: 23, b: 42, alpha: 1 }} }})
  .png()
  .toFile('{output}')
  .then(() => console.log('{output}'))
  .catch((error) => {{ console.error(error); process.exit(1); }});
"""
    subprocess.run(["node", "-e", js], check=True)
    tmp.unlink(missing_ok=True)


capture('screenshot-wide', 1280, 720, 4.0)
capture('screenshot-narrow', 540, 1170, 4.0)
capture('screenshot-narrow-loading', 540, 1170, 0.2)
