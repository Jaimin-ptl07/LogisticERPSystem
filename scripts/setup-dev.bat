@echo off
REM Development environment setup script for Logistics ERP (Windows)

echo 🚀 Setting up Logistics ERP development environment...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is required but not installed
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is required but not installed
    exit /b 1
)

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is required but not installed
    exit /b 1
)

echo ✅ All requirements satisfied

REM Install Python dependencies
echo 🐍 Installing Python dependencies...

REM Install Poetry if not present
poetry --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Poetry...
    curl -sSL https://install.python-poetry.org | python -
)

REM Install dependencies for each service
for /d %%d in (services\*) do (
    if exist "%%d\pyproject.toml" (
        echo Installing dependencies for %%~nd...
        cd %%d
        poetry install
        cd ..\..
    )
)

REM Install root dependencies
poetry install
echo ✅ Python dependencies installed

REM Install Node.js dependencies
echo 📦 Installing Node.js dependencies...
if exist frontend (
    cd frontend
    npm ci
    cd ..
    echo ✅ Frontend dependencies installed
)

REM Set up pre-commit hooks
echo 🔧 Setting up pre-commit hooks...
pre-commit --version >nul 2>&1
if %errorlevel% neq 0 (
    pip install pre-commit
)
pre-commit install
echo ✅ Pre-commit hooks installed

REM Create environment files
echo 📝 Creating environment files...
if not exist .env (
    copy .env.example .env
    echo ✅ Created .env from template
)

REM Create service-specific .env files
for /d %%d in (services\*) do (
    if not exist "%%d\.env" (
        if exist .env.example (
            copy .env.example "%%d\.env"
            echo ✅ Created %%~nd\.env
        )
    )
)

if exist frontend (
    if not exist frontend\.env.local (
        (
            echo # Frontend environment variables
            echo NEXT_PUBLIC_API_URL=http://localhost:8000
            echo NEXT_PUBLIC_WS_URL=ws://localhost:8000
        ) > frontend\.env.local
        echo ✅ Created frontend\.env.local
    )
)

REM Start infrastructure services
echo 🏗️ Starting infrastructure services...
docker-compose up -d postgres timescaledb redis kafka zookeeper minio elasticsearch
echo ⏳ Waiting for services to be ready...
timeout /t 10 >nul
echo ✅ Infrastructure services started

REM Show next steps
echo.
echo 🎉 Setup complete! Here's what you can do next:
echo.
echo 1. Review and update .env files with your configuration
echo 2. Start the development services:
echo    docker-compose up -d
echo.
echo 3. Run individual services:
echo    cd services/auth ^&^& poetry run python -m src.main
echo    cd services/orders ^&^& poetry run python -m src.main
echo.
echo 4. Start the frontend:
echo    cd frontend ^&^& npm run dev
echo.
echo 5. Run tests:
echo    poetry run pytest
echo.
echo 6. View service documentation:
echo    Auth Service: http://localhost:8001/docs
echo    Frontend: http://localhost:3000
echo.
echo Happy coding! 🚀

pause