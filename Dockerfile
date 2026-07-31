# Multi-stage Dockerfile for NelkoP21WebPrint

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Stage 2: Python FastAPI Backend + Served Static Frontend
FROM python:3.11-slim AS final
WORKDIR /app

# Install system dependencies for Bluetooth and image rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    bluez \
    bluetooth \
    libbluetooth-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy VERSION file & backend code
COPY VERSION ./VERSION
COPY backend/app ./app

# Copy built frontend static assets into backend/static
COPY --from=frontend-builder /app/backend/static ./static

EXPOSE 8000

ENV PRINTER_DRIVER=tcp
ENV PRINTER_TCP_HOST=127.0.0.1
ENV PRINTER_TCP_PORT=9100

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
