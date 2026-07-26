import subprocess
import time
import os
import sys
from playwright.sync_api import sync_playwright

def main():
    static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "docs", "images"))
    os.makedirs(out_dir, exist_ok=True)
    
    server_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8012", "--directory", static_dir],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    time.sleep(2)
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1600, "height": 900})
            
            page.goto("http://127.0.0.1:8012")
            page.wait_for_timeout(1500)
            
            # 1. Main Studio Screenshot
            studio_path = os.path.join(out_dir, "web_designer_studio.jpg")
            page.screenshot(path=studio_path)
            print(f"1. Captured Main Studio: {studio_path}")
            
            # 2. Switch to Server Bridge mode to open Settings Modal
            page.click("button:has-text('Server Bridge')")
            page.wait_for_timeout(400)
            page.click("button:has-text('Server Bridge:')")
            page.wait_for_timeout(600)
            settings_path = os.path.join(out_dir, "connection_settings_modal.jpg")
            page.screenshot(path=settings_path)
            print(f"2. Captured Settings Modal: {settings_path}")
            
            # Close Settings Modal
            page.click("button:has-text('Cancel')")
            page.wait_for_timeout(400)
            
            # 3. Thermal Preview Modal
            page.click("button:has-text('Preview')")
            page.wait_for_timeout(600)
            preview_path = os.path.join(out_dir, "thermal_preview_modal.jpg")
            page.screenshot(path=preview_path)
            print(f"3. Captured Preview Modal: {preview_path}")
            
            browser.close()
    except Exception as e:
        print(f"Playwright error: {e}")
    finally:
        server_process.terminate()
        server_process.wait()

if __name__ == "__main__":
    main()
