import subprocess
import time
import os
import sys

def main():
    static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "docs", "images"))
    os.makedirs(out_dir, exist_ok=True)
    
    server_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8005", "--directory", static_dir],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    time.sleep(2)
    
    studio_path = os.path.join(out_dir, "web_designer_studio.jpg")
    preview_path = os.path.join(out_dir, "thermal_preview_modal.jpg")
    settings_path = os.path.join(out_dir, "connection_settings_modal.jpg")

    try:
        # Main Studio
        cmd = f'npx -y playwright screenshot --viewport-size=1600,900 --wait-for-timeout=2000 http://127.0.0.1:8005 "{studio_path}"'
        subprocess.run(cmd, shell=True, check=True)
        print(f"Captured real Main Studio screenshot: {studio_path}")
    except Exception as e:
        print(f"Error capturing real screenshot: {e}")
    finally:
        server_process.terminate()
        server_process.wait()

if __name__ == "__main__":
    main()
