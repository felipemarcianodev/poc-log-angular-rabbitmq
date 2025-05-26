#!/bin/bash

set -e

echo "=== Stopping ELK Stack Logging System ==="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="docker-compose.yml"
COMPOSE_FILE_ALT="../docker-compose.yml"

# Find docker-compose file
find_compose_file() {
    if [ -f "$COMPOSE_FILE" ]; then
        echo "$COMPOSE_FILE"
    elif [ -f "$COMPOSE_FILE_ALT" ]; then
        echo "$COMPOSE_FILE_ALT"
    else
        echo ""
    fi
}

# Stop services gracefully
stop_services() {
    local compose_file=$(find_compose_file)
    
    if [ -z "$compose_file" ]; then
        echo -e "${RED}✗ docker-compose.yml not found${NC}"
        echo "Attempting to stop services by name..."
        
        # Try to stop containers by name
        docker stop elasticsearch kibana logstash 2>/dev/null || true
        echo -e "${YELLOW}⚠ Stopped containers by name${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}Stopping services using $compose_file...${NC}"
    
    # Stop services in order (reverse of startup)
    echo "Stopping Kibana..."
    docker-compose -f "$compose_file" stop kibana
    
    echo "Stopping Logstash..."
    docker-compose -f "$compose_file" stop logstash
    
    echo "Stopping Elasticsearch..."
    docker-compose -f "$compose_file" stop elasticsearch
    
    echo -e "${GREEN}✓ All services stopped${NC}"
}

# Remove containers
remove_containers() {
    local compose_file=$(find_compose_file)
    local remove_containers=""
    
    read -p "Remove containers? (This will delete container data but preserve volumes) [y/N]: " remove_containers
    
    if [[ $remove_containers =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Removing containers...${NC}"
        
        if [ -n "$compose_file" ]; then
            docker-compose -f "$compose_file" rm -f
        else
            docker rm -f elasticsearch kibana logstash 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✓ Containers removed${NC}"
    fi
}

# Clean up volumes
cleanup_volumes() {
    local cleanup_volumes=""
    
    read -p "Remove data volumes? (WARNING: This will delete all log data) [y/N]: " cleanup_volumes
    
    if [[ $cleanup_volumes =~ ^[Yy]$ ]]; then
        echo -e "${RED}WARNING: This will permanently delete all log data!${NC}"
        read -p "Are you sure? Type 'DELETE' to confirm: " confirm
        
        if [ "$confirm" = "DELETE" ]; then
            echo -e "${YELLOW}Removing volumes...${NC}"
            
            # Remove named volumes
            docker volume rm elasticsearch-data kibana-data logstash-data 2>/dev/null || true
            
            # Remove any dangling volumes
            docker volume prune -f
            
            echo -e "${GREEN}✓ Volumes removed${NC}"
        else
            echo -e "${YELLOW}Volume cleanup cancelled${NC}"
        fi
    fi
}

# Clean up network
cleanup_network() {
    echo -e "${YELLOW}Cleaning up network...${NC}"
    
    # Remove custom networks
    docker network rm elk-network 2>/dev/null || true
    
    # Prune unused networks
    docker network prune -f
    
    echo -e "${GREEN}✓ Network cleanup completed${NC}"
}

# Show final status
show_status() {
    echo ""
    echo "Final status:"
    echo "============="
    
    # Check if any ELK containers are still running
    running_containers=$(docker ps --filter "name=elasticsearch\|kibana\|logstash" --format "{{.Names}}" 2>/dev/null || true)
    
    if [ -z "$running_containers" ]; then
        echo -e "${GREEN}✓ No ELK containers running${NC}"
    else
        echo -e "${YELLOW}⚠ Still running: $running_containers${NC}"
    fi
    
    # Show disk space freed
    echo ""
    echo "Disk usage:"
    docker system df
}

# Backup logs before stopping (optional)
backup_logs() {
    local backup_logs=""
    
    read -p "Backup current logs before stopping? [y/N]: " backup_logs
    
    if [[ $backup_logs =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Creating logs backup...${NC}"
        
        local backup_dir="logs_backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        
        # Export current indices
        if docker ps --filter "name=elasticsearch" --format "{{.Names}}" | grep -q elasticsearch; then
            echo "Exporting Elasticsearch indices..."
            
            # Use elasticdump if available, otherwise just save index info
            if command -v elasticdump &> /dev/null; then
                elasticdump --input=http://localhost:9200/user-logs-* --output="$backup_dir/user-logs.json" --type=data 2>/dev/null || true
            fi
            
            # Save index mappings and settings
            curl -s "http://localhost:9200/user-logs-*/_mapping" > "$backup_dir/mappings.json" 2>/dev/null || true
            curl -s "http://localhost:9200/user-logs-*/_settings" > "$backup_dir/settings.json" 2>/dev/null || true
            
            echo -e "${GREEN}✓ Backup created in $backup_dir${NC}"
        else
            echo -e "${YELLOW}⚠ Elasticsearch not running, skipping backup${NC}"
        fi
    fi
}

# Main function
main() {
    echo "Stopping ELK Stack logging system..."
    echo "===================================="
    
    # Optional backup
    backup_logs
    
    echo ""
    echo "Stopping services..."
    echo "==================="
    stop_services
    
    echo ""
    echo "Cleanup options..."
    echo "=================="
    remove_containers
    cleanup_volumes
    cleanup_network
    
    echo ""
    show_status
    
    echo ""
    echo -e "${GREEN}✓ ELK Stack logging system stopped!${NC}"
    echo ""
    echo "To restart the system:"
    echo "- Run: docker-compose up -d"
    echo "- Or use your start script"
}

# Handle script arguments
case "${1:-}" in
    --force)
        echo "Force stopping all ELK containers..."
        docker stop elasticsearch kibana logstash 2>/dev/null || true
        docker rm -f elasticsearch kibana logstash 2>/dev/null || true
        echo -e "${GREEN}✓ Force stop completed${NC}"
        ;;
    --help|-h)
        echo "Usage: $0 [--force|--help]"
        echo ""
        echo "Options:"
        echo "  --force    Force stop and remove containers without prompts"
        echo "  --help     Show this help message"
        ;;
    "")
        main "$@"
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac