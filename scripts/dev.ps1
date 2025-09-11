# Discord Bot Development Scripts for Windows PowerShell

# Parameters must be at the top of the script
param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Service
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        Write-Error "Docker is not running. Please start Docker first."
        return $false
    }
}

# Start only PostgreSQL for development
function Start-DevDB {
    if (-not (Test-Docker)) { return }
    Write-Status "Starting PostgreSQL for development..."
    docker-compose up -d postgres
    Write-Success "PostgreSQL is running on port 5432"
    Write-Status "Database: discord_bot"
    Write-Status "User: discord_user"
    Write-Status "Password: discord_password"
}

# Start PostgreSQL with pgAdmin
function Start-DevDBAdmin {
    if (-not (Test-Docker)) { return }
    Write-Status "Starting PostgreSQL with pgAdmin..."
    docker-compose --profile admin up -d postgres pgadmin
    Write-Success "PostgreSQL is running on port 5432"
    Write-Success "pgAdmin is running on http://localhost:8080"
    Write-Status "pgAdmin login: admin@discord-bot.local / admin"
}

# Start full stack (DB + Bot)
function Start-All {
    if (-not (Test-Docker)) { return }
    Write-Status "Starting full Discord Bot stack..."
    docker-compose up -d
    Write-Success "All services are running"
}

# Stop all services
function Stop-All {
    if (-not (Test-Docker)) { return }
    Write-Status "Stopping all services..."
    docker-compose down
    Write-Success "All services stopped"
}

# View logs
function Show-Logs {
    param([string]$Service = "discordembedbot")
    if (-not (Test-Docker)) { return }
    Write-Status "Showing logs for $Service..."
    docker-compose logs -f $Service
}

# Database shell
function Connect-DBShell {
    if (-not (Test-Docker)) { return }
    Write-Status "Connecting to PostgreSQL shell..."
    docker-compose exec postgres psql -U discord_user -d discord_bot
}

# Reset database (WARNING: This will delete all data!)
function Reset-Database {
    if (-not (Test-Docker)) { return }
    $confirmation = Read-Host "Are you sure you want to reset the database? This will delete ALL data! (y/N)"
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
        Write-Warning "Resetting database..."
        docker-compose down
        docker volume rm discord-embed-bot_postgres_data 2>$null
        docker-compose up -d postgres
        Write-Success "Database reset complete"
    }
    else {
        Write-Status "Database reset cancelled"
    }
}

# Build and restart bot
function Restart-Bot {
    if (-not (Test-Docker)) { return }
    Write-Status "Rebuilding and restarting bot..."
    docker-compose build discordembedbot
    docker-compose up -d discordembedbot
    Write-Success "Bot rebuilt and restarted"
}

# Show help
function Show-Help {
    Write-Host "Discord Bot Development Scripts for PowerShell" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\scripts\dev.ps1 [command]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor White
    Write-Host "  dev-db        Start only PostgreSQL for development" -ForegroundColor Gray
    Write-Host "  dev-db-admin  Start PostgreSQL with pgAdmin" -ForegroundColor Gray
    Write-Host "  start         Start full stack (DB + Bot)" -ForegroundColor Gray
    Write-Host "  stop          Stop all services" -ForegroundColor Gray
    Write-Host "  logs [service] Show logs (default: discordembedbot)" -ForegroundColor Gray
    Write-Host "  db-shell      Connect to PostgreSQL shell" -ForegroundColor Gray
    Write-Host "  reset-db      Reset database (WARNING: deletes all data!)" -ForegroundColor Gray
    Write-Host "  rebuild       Rebuild and restart bot" -ForegroundColor Gray
    Write-Host "  help          Show this help message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\scripts\dev.ps1 dev-db       # Start only database" -ForegroundColor Gray
    Write-Host "  .\scripts\dev.ps1 logs postgres # Show postgres logs" -ForegroundColor Gray
    Write-Host "  .\scripts\dev.ps1 rebuild      # Rebuild bot" -ForegroundColor Gray
}

# Main script logic
switch ($Command) {
    "dev-db" { Start-DevDB }
    "dev-db-admin" { Start-DevDBAdmin }
    "start" { Start-All }
    "stop" { Stop-All }
    "logs" { Show-Logs -Service $Service }
    "db-shell" { Connect-DBShell }
    "reset-db" { Reset-Database }
    "rebuild" { Restart-Bot }
    default { Show-Help }
}
