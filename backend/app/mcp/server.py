from typing import Optional
from fastmcp import FastMCP
from app.core.config import settings
from app.api.print_routes import render_simple_label_image, PrintTextRequest, get_driver
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

if __name__ == "__main__":
    mcp.run()
