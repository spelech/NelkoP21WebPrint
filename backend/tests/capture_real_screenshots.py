import subprocess
import time
import os
import sys

def main():
    static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "docs", "images"))
    os.makedirs(out_dir, exist_ok=True)
    
    print("Starting Python HTTP server serving compiled static frontend...")
    server_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8008", "--directory", static_dir],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    time.sleep(2)
    
    studio_path = os.path.join(out_dir, "web_designer_studio.jpg")
    preview_path = os.path.join(out_dir, "thermal_preview_modal.jpg")
    settings_path = os.path.join(out_dir, "connection_settings_modal.jpg")

    try:
        # 1. Main Studio Screenshot
        cmd1 = f'npx -y playwright screenshot --viewport-size=1600,900 --wait-for-timeout=2000 http://127.0.0.1:8008 "{studio_path}"'
        print(f"Capturing Main Studio: {cmd1}")
        subprocess.run(cmd1, shell=True, check=True)

        # 2. Click Settings button & capture Settings Modal
        # Using Playwright node snippet via npx or python
    except Exception as e:
        print(f"Error capturing real screenshots: {e}")
    finally:
        server_process.terminate()
        server_process.wait()

if __name__ == "__main__":
    main()
