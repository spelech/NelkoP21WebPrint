import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.api.print_routes import router as print_router
from app.api.printer_routes import router as printer_router
from app.api.template_routes import router as template_router

app = FastAPI(
    title=settings.APP_NAME,
    description="Web App, REST API & MCP Server for Nelko P21 Thermal Printers",
    version="1.0.1"
)

# Enable CORS for local React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(print_router)
app.include_router(printer_router)
app.include_router(template_router)

# Static files for built frontend
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")

if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:
    @app.get("/")
    def index():
        return {
            "name": settings.APP_NAME,
            "status": "online",
            "docs": "/docs",
            "mcp": "FastMCP server enabled"
        }
