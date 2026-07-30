from typing import Optional
from fastmcp import FastMCP
from app.core.config import settings
from app.api.print_routes import render_simple_label_image, PrintTextRequest, get_driver, load_template_data, render_template_image
from app.core.rasterizer import dither_image
from app.core.tspl_builder import TSPLStreamBuilder

mcp = FastMCP("Nelko P21 Label Printer MCP")

@mcp.tool()
def print_simple_label(
    text: str,
    subtitle: Optional[str] = None,
    barcode: Optional[str] = None,
    width_mm: float = 14.0,
    height_mm: float = 40.0,
    copies: int = 1
) -> str:
    """
    Print a simple text label with optional subtitle and QR/barcode on the Nelko P21 thermal printer.
    
    Args:
        text: Main text title to print on the label.
        subtitle: Optional secondary text underneath.
        barcode: Optional barcode or QR code text payload.
        width_mm: Width of label in millimeters (default 14.0mm).
        height_mm: Length/Height of label in millimeters (default 40.0mm).
        copies: Number of label copies to print (default 1).
    """
    req = PrintTextRequest(
        text=text,
        subtitle=subtitle,
        barcode=barcode,
        width_mm=width_mm,
        height_mm=height_mm,
        copies=copies
    )
    img = render_simple_label_image(req)
    mono_img = dither_image(img)
    
    builder = TSPLStreamBuilder(width_mm=width_mm, height_mm=height_mm, gap_mm=5.0)
    builder.set_copies(copies)
    payload = builder.build_from_image(mono_img)
    
    driver = get_driver()
    success = driver.send_bytes(payload)
    driver.disconnect()
    
    if success:
        return f"Successfully sent print job ('{text}') to Nelko P21 printer ({copies} copies)."
    else:
        return f"Error: Failed to transmit print job to printer driver."

@mcp.tool()
def get_printer_status() -> str:
    """Check connection status and configuration of the Nelko P21 printer."""
    driver = get_driver()
    status = driver.get_status()
    return f"Driver: {settings.DEFAULT_DRIVER_TYPE} | Connected: {status.get('connected')} | Details: {status}"

@mcp.tool()
def list_label_presets() -> str:
    """List available label presets and physical dimensions for Nelko P21."""
    lines = ["Available Label Presets:"]
    for p in settings.PRESETS:
        lines.append(f"- {p['name']}: {p['width']}mm x {p['height']}mm (Gap: {p['gap']}mm)")
    return "\n".join(lines)

@mcp.tool()
def list_templates() -> str:
    """List available templates (saved label layouts) that can be printed."""
    import os
    from app.api.template_routes import TEMPLATES_DIR
    lines = ["Available Templates:"]
    for fname in os.listdir(TEMPLATES_DIR):
        if fname.endswith(".json"):
            tid = fname[:-5]
            lines.append(f"- {tid}")
    return "\n".join(lines)

@mcp.tool()
def print_template_label(
    template_id: str,
    variables_json: str,
    copies: int = 1
) -> str:
    """
    Print a label using a pre-saved layout template and variable replacement.
    
    Args:
        template_id: The ID of the template to use (e.g. 'asset_tag').
        variables_json: JSON string of variables to substitute, e.g. '{"name": "Server-01", "url": "http://10.0.0.10"}'
        copies: Number of copies to print.
    """
    import json
    try:
        variables = json.loads(variables_json)
    except Exception as e:
        return f"Error: Invalid variables JSON: {e}"
        
    try:
        template_data = load_template_data(template_id)
        img = render_template_image(template_data, variables)
        mono_img = dither_image(img)
        
        width_mm = template_data.get("width_mm", 40.0)
        height_mm = template_data.get("height_mm", 14.0)
        gap_mm = template_data.get("gap_mm", 5.0)
        
        builder = TSPLStreamBuilder(width_mm=width_mm, height_mm=height_mm, gap_mm=gap_mm)
        builder.set_copies(copies)
        payload = builder.build_from_image(mono_img)
        
        driver = get_driver()
        success = driver.send_bytes(payload)
        driver.disconnect()
        
        if success:
            return f"Successfully printed template '{template_id}' with variables {variables} ({copies} copies)."
        else:
            return "Error: Failed to transmit payload to printer."
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def print_batch_labels(
    template_id: str,
    jobs_json: str
) -> str:
    """
    Print a batch of labels sequentially using a template and a list of job variables.
    
    Args:
        template_id: The ID of the template to use (e.g. 'asset_tag').
        jobs_json: JSON string of a list of job dicts, e.g. '[{"variables": {"name": "S1", "url": "U1"}, "copies": 1}, {"variables": {"name": "S2", "url": "U2"}}]'
    """
    import json
    try:
        jobs = json.loads(jobs_json)
    except Exception as e:
        return f"Error: Invalid jobs JSON: {e}"
        
    try:
        template_data = load_template_data(template_id)
        width_mm = template_data.get("width_mm", 40.0)
        height_mm = template_data.get("height_mm", 14.0)
        gap_mm = template_data.get("gap_mm", 5.0)
        
        driver = get_driver()
        total_printed = 0
        
        for idx, job in enumerate(jobs):
            variables = job.get("variables", {})
            copies = job.get("copies", 1)
            
            img = render_template_image(template_data, variables)
            mono_img = dither_image(img)
            
            builder = TSPLStreamBuilder(width_mm=width_mm, height_mm=height_mm, gap_mm=gap_mm)
            builder.set_copies(copies)
            payload = builder.build_from_image(mono_img)
            
            success = driver.send_bytes(payload)
            if not success:
                driver.disconnect()
                return f"Error: Failed to print job #{idx + 1} in batch (printed {total_printed} total copies so far)."
                
            total_printed += copies
            
        driver.disconnect()
        return f"Successfully printed batch of {len(jobs)} jobs (total {total_printed} copies) using template '{template_id}'."
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    mcp.run()

