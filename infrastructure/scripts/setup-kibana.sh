#!/bin/bash

set -e

echo "=== Setting up Kibana Dashboards and Index Patterns ==="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
KIBANA_URL="http://localhost:5601"
ELASTICSEARCH_URL="http://localhost:9200"

# Wait for Kibana to be ready
wait_for_kibana() {
    echo -e "${YELLOW}Waiting for Kibana to be ready...${NC}"
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$KIBANA_URL/api/status" | grep -q "available"; then
            echo -e "${GREEN}✓ Kibana is ready${NC}"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts - Kibana not ready yet..."
        sleep 10
        ((attempt++))
    done
    
    echo -e "${RED}✗ Kibana failed to become ready${NC}"
    exit 1
}

# Create index pattern
create_index_pattern() {
    echo -e "${YELLOW}Creating index pattern for user-logs...${NC}"
    
    local index_pattern='{
        "attributes": {
            "title": "user-logs-*",
            "timeFieldName": "timestamp",
            "fields": "[{\"name\":\"@timestamp\",\"type\":\"date\",\"searchable\":true,\"aggregatable\":true},{\"name\":\"userId\",\"type\":\"string\",\"searchable\":true,\"aggregatable\":true},{\"name\":\"sessionId\",\"type\":\"string\",\"searchable\":true,\"aggregatable\":true},{\"name\":\"eventName\",\"type\":\"string\",\"searchable\":true,\"aggregatable\":true},{\"name\":\"page\",\"type\":\"string\",\"searchable\":true,\"aggregatable\":true},{\"name\":\"timestamp\",\"type\":\"date\",\"searchable\":true,\"aggregatable\":true},{\"name\":\"data\",\"type\":\"object\",\"searchable\":false,\"aggregatable\":false},{\"name\":\"userAgent\",\"type\":\"string\",\"searchable\":true,\"aggregatable\":false},{\"name\":\"level\",\"type\":\"string\",\"searchable\":true,\"aggregatable\":true},{\"name\":\"source\",\"type\":\"string\",\"searchable\":true,\"aggregatable\":true}]"
        }
    }'
    
    if curl -s -X POST "$KIBANA_URL/api/saved_objects/index-pattern/user-logs-pattern" \
        -H "Content-Type: application/json" \
        -H "kbn-xsrf: true" \
        -d "$index_pattern" | grep -q '"id"'; then
        echo -e "${GREEN}✓ Index pattern created${NC}"
    else
        echo -e "${YELLOW}⚠ Index pattern may already exist${NC}"
    fi
}

# Import dashboards
import_dashboards() {
    echo -e "${YELLOW}Importing dashboards...${NC}"
    
    # Check if dashboard files exist
    if [ -f "../kibana/dashboards/performance-dashboard.json" ]; then
        echo "Importing performance dashboard..."
        curl -s -X POST "$KIBANA_URL/api/saved_objects/_import" \
            -H "kbn-xsrf: true" \
            -F file=@../kibana/dashboards/performance-dashboard.json \
            > /dev/null && echo -e "${GREEN}✓ Performance dashboard imported${NC}"
    fi
    
    if [ -f "../kibana/dashboards/user-actions-dashboard.json" ]; then
        echo "Importing user actions dashboard..."
        curl -s -X POST "$KIBANA_URL/api/saved_objects/_import" \
            -H "kbn-xsrf: true" \
            -F file=@../kibana/dashboards/user-actions-dashboard.json \
            > /dev/null && echo -e "${GREEN}✓ User actions dashboard imported${NC}"
    fi
}

# Create index template in Elasticsearch
create_index_template() {
    echo -e "${YELLOW}Creating index template in Elasticsearch...${NC}"
    
    if [ -f "../elasticsearch/index-templates/user-logs-template.json" ]; then
        if curl -s -X PUT "$ELASTICSEARCH_URL/_index_template/user-logs-template" \
            -H "Content-Type: application/json" \
            -d @../elasticsearch/index-templates/user-logs-template.json | grep -q "acknowledged"; then
            echo -e "${GREEN}✓ Index template created${NC}"
        else
            echo -e "${RED}✗ Failed to create index template${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Index template file not found${NC}"
    fi
}

# Create initial index with mapping
create_initial_index() {
    echo -e "${YELLOW}Creating initial index with mapping...${NC}"
    
    local today=$(date +%Y.%m.%d)
    local index_name="user-logs-$today"
    
    if [ -f "../elasticsearch/mappings/user-logs-mapping.json" ]; then
        if curl -s -X PUT "$ELASTICSEARCH_URL/$index_name" \
            -H "Content-Type: application/json" \
            -d @../elasticsearch/mappings/user-logs-mapping.json | grep -q "acknowledged"; then
            echo -e "${GREEN}✓ Initial index created: $index_name${NC}"
        else
            echo -e "${YELLOW}⚠ Index may already exist: $index_name${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Mapping file not found${NC}"
    fi
}

# Setup index lifecycle policy
setup_ilm_policy() {
    echo -e "${YELLOW}Setting up Index Lifecycle Management policy...${NC}"
    
    local ilm_policy='{
        "policy": {
            "phases": {
                "hot": {
                    "actions": {
                        "rollover": {
                            "max_size": "1GB",
                            "max_age": "7d"
                        }
                    }
                },
                "warm": {
                    "min_age": "7d",
                    "actions": {
                        "shrink": {
                            "number_of_shards": 1
                        }
                    }
                },
                "cold": {
                    "min_age": "30d"
                },
                "delete": {
                    "min_age": "90d"
                }
            }
        }
    }'
    
    if curl -s -X PUT "$ELASTICSEARCH_URL/_ilm/policy/user-logs-policy" \
        -H "Content-Type: application/json" \
        -d "$ilm_policy" | grep -q "acknowledged"; then
        echo -e "${GREEN}✓ ILM policy created${NC}"
    else
        echo -e "${YELLOW}⚠ ILM policy may already exist${NC}"
    fi
}

# Main setup function
main() {
    echo "Starting Kibana setup..."
    echo "======================="
    
    wait_for_kibana
    sleep 5
    
    echo ""
    echo "Setting up Elasticsearch components..."
    echo "===================================="
    create_index_template
    create_initial_index
    setup_ilm_policy
    
    echo ""
    echo "Setting up Kibana components..."
    echo "==============================="
    create_index_pattern
    sleep 2
    import_dashboards
    
    echo ""
    echo "==========================="
    echo -e "${GREEN}✓ Kibana setup completed!${NC}"
    echo ""
    echo "You can now access:"
    echo "- Kibana: $KIBANA_URL"
    echo "- Performance Dashboard: $KIBANA_URL/app/dashboards#/view/performance-dashboard"
    echo "- User Actions Dashboard: $KIBANA_URL/app/dashboards#/view/user-actions-dashboard"
}

# Run setup if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi