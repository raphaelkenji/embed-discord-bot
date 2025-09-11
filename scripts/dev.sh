#!/bin/bash

# Discord Bot Development Scripts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Start only PostgreSQL for development
dev_db() {
    check_docker
    print_status "Starting PostgreSQL for development..."
    docker-compose up -d postgres
    print_success "PostgreSQL is running on port 5432"
    print_status "Database: discord_bot"
    print_status "User: discord_user"
    print_status "Password: discord_password"
}

# Start PostgreSQL with pgAdmin
dev_db_admin() {
    check_docker
    print_status "Starting PostgreSQL with pgAdmin..."
    docker-compose --profile admin up -d postgres pgadmin
    print_success "PostgreSQL is running on port 5432"
    print_success "pgAdmin is running on http://localhost:8080"
    print_status "pgAdmin login: admin@discord-bot.local / admin"
}

# Start full stack (DB + Bot)
start_all() {
    check_docker
    print_status "Starting full Discord Bot stack..."
    docker-compose up -d
    print_success "All services are running"
}

# Stop all services
stop_all() {
    check_docker
    print_status "Stopping all services..."
    docker-compose down
    print_success "All services stopped"
}

# View logs
logs() {
    service=${1:-discordembedbot}
    print_status "Showing logs for $service..."
    docker-compose logs -f $service
}

# Database shell
db_shell() {
    check_docker
    print_status "Connecting to PostgreSQL shell..."
    docker-compose exec postgres psql -U discord_user -d discord_bot
}

# Reset database (WARNING: This will delete all data!)
reset_db() {
    check_docker
    read -p "Are you sure you want to reset the database? This will delete ALL data! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Resetting database..."
        docker-compose down
        docker volume rm discord-embed-bot_postgres_data 2>/dev/null || true
        docker-compose up -d postgres
        print_success "Database reset complete"
    else
        print_status "Database reset cancelled"
    fi
}

# Build and restart bot
rebuild_bot() {
    check_docker
    print_status "Rebuilding and restarting bot..."
    docker-compose build discordembedbot
    docker-compose up -d discordembedbot
    print_success "Bot rebuilt and restarted"
}

# Show help
show_help() {
    echo "Discord Bot Development Scripts"
    echo ""
    echo "Usage: ./scripts/dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev-db        Start only PostgreSQL for development"
    echo "  dev-db-admin  Start PostgreSQL with pgAdmin"
    echo "  start         Start full stack (DB + Bot)"
    echo "  stop          Stop all services"
    echo "  logs [service] Show logs (default: discordembedbot)"
    echo "  db-shell      Connect to PostgreSQL shell"
    echo "  reset-db      Reset database (WARNING: deletes all data!)"
    echo "  rebuild       Rebuild and restart bot"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/dev.sh dev-db       # Start only database"
    echo "  ./scripts/dev.sh logs postgres # Show postgres logs"
    echo "  ./scripts/dev.sh rebuild      # Rebuild bot"
}

# Main script logic
case "${1:-help}" in
    "dev-db")
        dev_db
        ;;
    "dev-db-admin")
        dev_db_admin
        ;;
    "start")
        start_all
        ;;
    "stop")
        stop_all
        ;;
    "logs")
        logs $2
        ;;
    "db-shell")
        db_shell
        ;;
    "reset-db")
        reset_db
        ;;
    "rebuild")
        rebuild_bot
        ;;
    "help"|*)
        show_help
        ;;
esac
