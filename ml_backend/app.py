"""
app.py — FastAPI Microservice Wrapper for the AgriVision ML Engine
==================================================================
Exposes a REST API that the Node.js backend calls over HTTP to get
crop predictions from the Scikit-Learn Random Forest model.
"""

import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model_pipeline import CropPredictor

# ------------------------------------------------------------------
# FastAPI Application
# ------------------------------------------------------------------
app = FastAPI(
    title="AgriVision ML Engine",
    version="2.0",
    description="Random Forest crop prediction microservice for the Adaptive Crop Recommendation System.",
)

# Allow the Node.js backend (and any local dev tool) to reach this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate the predictor once at startup (lazy-loads or trains the model)
predictor = CropPredictor()


# ------------------------------------------------------------------
# Pydantic Request Schema
# ------------------------------------------------------------------
class CropPredictionInput(BaseModel):
    """Soil nutrient levels and environmental conditions."""

    N: float = Field(..., ge=0, le=140, description="Nitrogen content (kg/ha)")
    P: float = Field(..., ge=5, le=145, description="Phosphorus content (kg/ha)")
    K: float = Field(..., ge=5, le=205, description="Potassium content (kg/ha)")
    temperature: float = Field(..., ge=8, le=50, description="Temperature (°C)")
    humidity: float = Field(..., ge=14, le=100, description="Relative humidity (%)")
    ph: float = Field(..., ge=3.5, le=10, description="Soil pH level")
    rainfall: float = Field(..., ge=20, le=300, description="Rainfall (mm)")


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def health_check():
    """Health check — confirms service is alive and reports model readiness."""
    model_loaded = predictor.model is not None
    return {
        "status": "running",
        "model_loaded": model_loaded,
        "service": "AgriVision ML Engine v2.0",
    }


@app.post("/predict", tags=["Prediction"])
async def predict_crop(payload: CropPredictionInput):
    """
    Accept soil/environmental parameters and return Top-3 crop predictions
    with confidence scores and feature-importance narratives.
    """
    try:
        input_data = payload.model_dump()

        result = predictor.predict_top_crops(input_data, top_n=3)

        return {
            "status": "success",
            "predictions": result["predictions"],
            "top_crop": result["top_crop"],
            "feature_importances": result["feature_importances"],
        }

    except Exception as exc:
        # Log full traceback for debugging; return sanitised error to client
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": f"Prediction failed: {str(exc)}",
            },
        )


# ------------------------------------------------------------------
# Global exception handler for unexpected errors
# ------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Catch-all handler returning a consistent JSON error envelope."""
    traceback.print_exc()
    return {
        "status": "error",
        "message": f"Internal server error: {str(exc)}",
    }


# ------------------------------------------------------------------
# Entrypoint — run with: python app.py
# ------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
