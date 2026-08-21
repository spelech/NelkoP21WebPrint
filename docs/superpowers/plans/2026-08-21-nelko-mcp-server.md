# SDD Plan: Nelko P21 Label Printer MCP Server

## Goal
Implement a complete Model Context Protocol (MCP) server for Nelko P21 WebPrint, exposing connection diagnostics, rich formatting resources, printing and batch tools with unique barcodes, and full TinyAuth / PocketID authentication integration.

---

### Task 1: TCP Driver Probing & Bridge Connectivity Diagnostics
- **Files:**
  - `backend/app/drivers/base_driver.py`
  - `backend/app/drivers/tcp_driver.py`
  - `backend/tests/test_tcp_driver_probe.py`
- **Actions:**
  1. Add `probe_connection() -> Dict[str, Any]` to `BasePrinterDriver` and `TCPPrinterDriver` that performs a non-blocking TCP socket check to test if the ESP32 print bridge is listening.
  2. Differentiate between:
     - Bridge unreachable (connection refused, host unreachable, timeout).
     - Bridge reachable, but printer offline/unpaired.
     - Printer ready.
  3. Write unit tests in `backend/tests/test_tcp_driver_probe.py`.
  4. Verify all tests pass with `python3 backend/tests/run_tests.py`.

---

### Task 2: FastMCP Tools, Resources, Prompts & FastAPI Mount
- **Files:**
  - `backend/app/mcp/server.py`
  - `backend/app/main.py`
  - `backend/tests/test_mcp_server.py`
- **Actions:**
  1. Implement FastMCP tools in `backend/app/mcp/server.py`:
     - `check_printer_status()`: Calls `driver.probe_connection()` and returns detailed diagnostics.
     - `list_presets()`: Returns physical roll presets.
     - `list_templates()`: Returns saved layout templates.
     - `print_simple_label(title, subtitle, barcode_value, barcode_type, width_mm, height_mm, copies, density)`: Formats and prints label.
     - `print_template_label(template_id, variables_json, copies, density)`: Populates template and prints.
     - `print_custom_label(elements_json, width_mm, height_mm, gap_mm, copies, density)`: Renders custom vector elements and prints.
     - `print_batch(items_json, template_id, auto_barcode_prefix, width_mm, height_mm, copies_per_item, density)`: Prints series of labels with auto-generated unique sequential/timestamped barcodes.
     - `preview_label(title, subtitle, barcode_value, elements_json, template_id, variables_json, width_mm, height_mm)`: Returns Base64 PNG URL + ASCII preview.
  2. Implement FastMCP resources:
     - `nelko://specs/printer`: Returns complete hardware specs (203 DPI, 8 dots/mm, coordinate math, element schema, contrast guidelines).
     - `nelko://presets`: Returns preset dimensions and dot counts.
     - `nelko://templates`: Returns template schemas.
  3. Implement FastMCP prompt `label_designer`.
  4. Mount FastMCP SSE and HTTP apps in `backend/app/main.py` at `/sse` and `/mcp`.
  5. Write unit tests in `backend/tests/test_mcp_server.py`.
  6. Verify backend tests pass with `python3 backend/tests/run_tests.py`.

---

### Task 3: Caddy Route Configuration, Docker Compose & MCP Auto-Discovery
- **Files:**
  - `webservices/caddy/Caddyfile`
  - `productivity/docker-compose.yaml`
- **Actions:**
  1. In `webservices/caddy/Caddyfile`, update `labelprint.wileyriley.com` block with selective TinyAuth forward auth:
     ```caddyfile
     labelprint.wileyriley.com {
     	import cloudflare

     	@protected {
     		not path /sse*
     		not path /mcp*
     		not path /health
     		not path /api/printer/status
     	}
     	forward_auth @protected http://tinyauth:3000 {
     		uri /api/auth/nginx
     		copy_headers Remote-User Remote-Groups Remote-Email Remote-Name
     		@401 status 401
     		handle_response @401 {
     			redir https://sso-gateway.wileyriley.com/login?redirect_uri={scheme}://{host}{uri}&login_for=app 302
     		}
     	}

     	reverse_proxy nelko-p21-print:8000
     }
     ```
  2. Format and validate Caddyfile:
     `docker compose -f /containers/webservices/docker-compose.yaml exec caddy caddy fmt --overwrite /etc/caddy/Caddyfile`
     `docker compose -f /containers/webservices/docker-compose.yaml exec caddy caddy validate --config /etc/caddy/Caddyfile`
  3. In `productivity/docker-compose.yaml`, connect `nelko-p21-print` to `net_mcp` and add MCP discovery labels:
     ```yaml
     - mcp.enabled=true
     - mcp.id=nelko
     - mcp.displayName=Nelko Label Printer
     - mcp.port=8000
     - mcp.type=sse
     - mcp.path=/sse
     - mcp.categories=hardware,productivity
     - kuma.nelko-mcp.http.name=Nelko MCP
     - kuma.nelko-mcp.http.url=http://nelko-p21-print:8000/sse
     - kuma.nelko-mcp.http.group=Infrastructure
     - kuma.nelko-mcp.http.accepted_statuscodes=["200-299","404","405"]
     ```
  4. Validate compose files with `docker compose config --quiet`.

---

### Task 4: Build, Deploy & Verify
- **Files:**
  - Target image: `ghcr.io/spelech/nelkop21webprint:latest`
  - Container: `nelko-p21-print`
- **Actions:**
  1. Commit and push changes to `spelech/NelkoP21WebPrint` master via worktree sync.
  2. Build local docker image `docker build -t ghcr.io/spelech/nelkop21webprint:latest /containers/nelkop21webprint`.
  3. Recreate container: `docker compose -f /containers/productivity/docker-compose.yaml up -d --force-recreate nelko-p21-print`.
  4. Restart Caddy: `docker compose -f /containers/webservices/docker-compose.yaml restart caddy`.
  5. Empirically verify:
     - `GET http://127.0.0.1:8410/api/printer/status`
     - `GET http://127.0.0.1:8410/sse`
     - `curl -k --resolve labelprint.wileyriley.com:443:10.0.0.10 https://labelprint.wileyriley.com/` -> 302 TinyAuth redirect.
     - `curl -k --resolve labelprint.wileyriley.com:443:10.0.0.10 https://labelprint.wileyriley.com/sse` -> clean MCP SSE stream.
