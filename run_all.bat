@echo off
echo =========================================================================
echo  AI-Based Early Warning and Landslide Risk Monitoring System in NER
echo  Smart India Hackathon 2026 Submission (SIH26001)
echo =========================================================================
echo.
echo [1/2] Starting Python FastAPI AI Risk Engine on http://127.0.0.1:8000 ...
start cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting React Leaflet GIS Command Dashboard on http://localhost:5173 ...
start cmd /k "cd frontend && npm run dev"

echo.
echo System initialized! Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo =========================================================================
