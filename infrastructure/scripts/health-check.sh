#!/bin/bash

set -e

echo "=== ELK Stack Health Check ==="
echo "Checking services health..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ELASTICSEARCH_URL="http://localhost:9200"
KIBANA_URL="http://localhost:5601"
LOGSTASH_URL="http://localhost:9600"

# Function to check HTTP status
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $service_name... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Function to check Elasticsearch cluster health
check_elasticsearch_health() {
    echo -n "Checking Elasticsearch cluster health... "
    
    health=$(curl -s "$ELASTICSEARCH_URL/_cluster/health" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    case $health in
        "green")
            echo -e "${GREEN}✓ GREEN${NC}"
            return 0
            ;;
        "yellow")
            echo -e "${YELLOW}⚠ YELLOW${NC}"
            return 0
            ;;
        "red")
            echo -e "${RED}✗ RED${NC}"
            return 1
            ;;
        *)
            echo -e "${RED}✗ UNKNOWN${NC}"
            return 1
            ;;
    esac
}

# Function to check if indices exist
check_indices() {
    echo -n "Checking user-logs indices... "
    
    indices=$(curl -s "$ELASTICSEARCH_URL/_cat/indices/user-logs-*?h=index" | wc -l)
    
    if [ "$indices" -gt 0 ]; then
        echo -e "${GREEN}✓ Found $indices indices${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ No indices found${NC}"
        return 0
    fi
}

# Function to check Logstash pipeline
check_logstash_pipeline() {
    echo -n "Checking Logstash pipeline... "
    
    if curl -s "$LOGSTASH_URL/_node/stats/pipeline" | grep -q "\"events\""; then
        echo -e "${GREEN}✓ Pipeline active${NC}"
        return 0
    else
        echo -e "${RED}✗ Pipeline not active${NC}"
        return 1
    fi
}

# Function to test log ingestion
test_log_ingestion() {
    echo -n "Testing log ingestion... "
    
    # Send test log to Logstash
    test_log='{
        "userId": "health-check-user",
        "sessionId": "health-check-session",
        "eventName": "health_check",
        "page": "/health-check",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
        "data": {
            "test": true
        },
        "userAgent": "health-check/1.0"
    }'
    
    if echo "$test_log" | nc -w 5 localhost 5044; then
        echo -e "${GREEN}✓ Test log sent${NC}"
        sleep 2
        
        # Check if test log was indexed
        if curl -s "$ELASTICSEARCH_URL/user-logs-*/_search?q=eventName:health_check&size=1" | grep -q "health_check"; then
            echo -e "${GREEN}✓ Test log indexed${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ Test log not found in index${NC}"
            return 0
        fi
    else
        echo -e "${RED}✗ Failed to send test log${NC}"
        return 1
    fi
}

# Main health check
main() {
    local exit_code=0
    
    echo "Starting health checks..."
    echo "=========================="
    
    # Basic service checks
    check_service "Elasticsearch" "$ELASTICSEARCH_URL" || exit_code=1
    check_service "Kibana" "$KIBANA_URL" || exit_code=1
    check_service "Logstash" "$LOGSTASH_URL/_node/stats" || exit_code=1
    
    echo ""
    echo "Detailed checks..."
    echo "=================="
    
    # Detailed checks
    check_elasticsearch_health || exit_code=1
    check_indices
    check_logstash_pipeline || exit_code=1
    
    echo ""
    echo "Integration tests..."
    echo "==================="
    
    # Integration tests
    test_log_ingestion || exit_code=1
    
    echo ""
    echo "=========================="
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ All health checks passed!${NC}"
    else
        echo -e "${RED}✗ Some health checks failed!${NC}"
    fi
    
    # Show resource usage
    echo ""
    echo "Resource usage:"
    echo "==============="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "(elasticsearch|kibana|logstash)"
    
    exit $exit_code
}

# Run health check if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi