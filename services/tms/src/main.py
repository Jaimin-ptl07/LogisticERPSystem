"""FastAPI application entry point for TMS Service"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from contextlib import asynccontextmanager
import logging

from src.config import settings
from src.database import engine, Base
from src.api.endpoints import trips, orders, resources
from src.middleware import (
    AuthenticationMiddleware,
    TenantContextMiddleware,
    TenantIsolationMiddleware,
    SecurityHeadersMiddleware,
    AuditLoggingMiddleware,
    RateLimitMiddleware,
)

# Configure logging
logging.basicConfig(
    level=getattr(settings, 'log_level', 'INFO'),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Configure audit logger
audit_logger = logging.getLogger("tms_audit")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting TMS Service...")
    # Create tables (in production, use Alembic migrations)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified")

    yield

    # Shutdown
    logger.info("Shutting down TMS Service...")


# Create FastAPI app
app = FastAPI(
    title="TMS Service",
    description="Transport Management System API",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=getattr(settings, 'allowed_origins', ["*"]),
    allow_credentials=True,
    allow_methods=getattr(settings, 'allowed_methods', ["*"]),
    allow_headers=getattr(settings, 'allowed_headers', ["*"]),
    expose_headers=getattr(settings, 'expose_headers', []),
)

# Add security middleware (order is important)
if getattr(settings, 'enable_audit_trail', True):
    app.add_middleware(AuditLoggingMiddleware)

if getattr(settings, 'enable_rate_limiting', True):
    app.add_middleware(RateLimitMiddleware)

if getattr(settings, 'enable_security_headers', True):
    app.add_middleware(SecurityHeadersMiddleware)

# Authentication and authorization middleware
app.add_middleware(
    AuthenticationMiddleware,
    skip_paths=[
        "/",
        "/health",
        "/ready",
        "/metrics",
        "/docs",
        "/openapi.json",
        "/redoc",
        "/favicon.ico"
    ]
)

# Tenant isolation middleware
app.add_middleware(TenantContextMiddleware)
app.add_middleware(TenantIsolationMiddleware)

# Include API routers
app.include_router(trips.router, prefix="/api/v1/trips", tags=["trips"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["orders"])
app.include_router(resources.router, prefix="/api/v1/resources", tags=["resources"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "TMS Service is running",
        "version": "0.1.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "tms"}


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    # Initialize metrics if not already done
    if not hasattr(app, '_metrics_initialized'):
        from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, CollectorRegistry, Counter, Histogram, Gauge

        app.metrics_registry = CollectorRegistry()

        # Define basic metrics
        app.http_requests_total = Counter(
            'tms_http_requests_total',
            'Total HTTP requests',
            ['method', 'endpoint', 'status_code'],
            registry=app.metrics_registry
        )

        app.http_request_duration = Histogram(
            'tms_http_request_duration_seconds',
            'HTTP request duration in seconds',
            ['method', 'endpoint'],
            registry=app.metrics_registry
        )

        app.trips_created = Counter(
            'tms_trips_created_total',
            'Total trips created',
            registry=app.metrics_registry
        )

        app.active_trips = Gauge(
            'tms_active_trips',
            'Number of active trips',
            registry=app.metrics_registry
        )

        app._metrics_initialized = True

        # Re-import for the return statement
        from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

    return Response(generate_latest(app.metrics_registry), media_type=CONTENT_TYPE_LATEST)


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Global HTTP exception handler"""
    logger.error(f"HTTP {exc.status_code}: {exc.detail}")
    return {
        "error": exc.detail,
        "status_code": exc.status_code
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=getattr(settings, 'service_host', '0.0.0.0'),
        port=getattr(settings, 'service_port', 8004),
        reload=True,
        log_level=getattr(settings, 'log_level', 'info').lower()
    )