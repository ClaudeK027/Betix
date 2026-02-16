"""
BETIX Backend — Point d'entrée FastAPI
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import get_settings
from app.routers import matches, predictions, system
from app.services.ingestion.orchestrator import IngestionOrchestrator

logger = logging.getLogger("app.main")
settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    logger.info("=== Starting BETIX Backend ===")
    
    # Configuration du Scheduler
    scheduler = AsyncIOScheduler()
    orchestrator = IngestionOrchestrator()
    
    # Planification du rafraîchissement live toutes les 5 minutes
    scheduler.add_job(
        orchestrator.run_live_sync, 
        "interval", 
        minutes=5,
        id="live_match_refresh",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Planificateur (APScheduler) démarré : Rafraîchissement live toutes les 5 minutes.")
    
    yield
    
    # --- Shutdown ---
    logger.info("=== Stopping BETIX Backend ===")
    scheduler.shutdown()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API Backend pour BETIX — Plateforme de Pronostics Sportifs IA",
    lifespan=lifespan,
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Health Check ---
@app.get("/api/health")
async def health_check():
    """Vérification de l'état du serveur."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# --- Routers ---
# app.include_router(sports.router, prefix="/api/sports", tags=["Sports"])
app.include_router(matches.router, prefix="/api/matches", tags=["Matches"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(system.router, prefix="/api/system", tags=["System"])
