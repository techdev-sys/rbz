@echo off
echo ========================================
echo RBZ System - Product Catalog Initializer
echo ========================================
echo.
echo Waiting for backend to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Initializing product catalog...
curl -X POST http://localhost:8080/api/products/initialize-catalog

echo.
echo.
echo ========================================
echo Checking catalog...
echo ========================================
curl http://localhost:8080/api/products/catalog

echo.
echo.
echo ========================================
echo Done! You should see 19 products above.
echo ========================================
pause
