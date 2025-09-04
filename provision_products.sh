#!/bin/bash

# ECOSYSTEMCL.AI Product Provisioning Script
# Creates three product tiers via Whop API with idempotent behavior

set -euo pipefail

# Configuration
WHOP_API_ENDPOINT="https://api.whop.com/v2/products"
SCRIPT_NAME="provision_products.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} ${timestamp} - $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} ${timestamp} - $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} ${timestamp} - $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - $message"
            ;;
    esac
}

# Check if API key is set
check_api_key() {
    if [[ -z "${WHOP_SECRET_API_KEY:-}" ]]; then
        log "ERROR" "WHOP_SECRET_API_KEY environment variable is not set"
        log "INFO" "Please set your Whop API key: export WHOP_SECRET_API_KEY=your_key_here"
        exit 1
    fi
    log "INFO" "API key is configured"
}

# Check if required tools are installed
check_dependencies() {
    local deps=("curl" "jq")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log "ERROR" "Required dependency '$dep' is not installed"
            exit 1
        fi
    done
    log "INFO" "All dependencies are available"
}

# Make API request with proper error handling
make_api_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local response_file=$(mktemp)
    local http_code
    
    log "INFO" "Making $method request to $endpoint"
    
    if [[ "$method" == "POST" ]]; then
        http_code=$(curl -s -w "%{http_code}" -o "$response_file" \
            -X POST \
            -H "Authorization: Bearer $WHOP_SECRET_API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$endpoint")
    else
        http_code=$(curl -s -w "%{http_code}" -o "$response_file" \
            -H "Authorization: Bearer $WHOP_SECRET_API_KEY" \
            "$endpoint")
    fi
    
    local response_body=$(cat "$response_file")
    rm "$response_file"
    
    echo "$http_code|$response_body"
}

# Check if product already exists by name
product_exists() {
    local product_name="$1"
    local response=$(make_api_request "GET" "$WHOP_API_ENDPOINT" "")
    local http_code=$(echo "$response" | cut -d'|' -f1)
    local body=$(echo "$response" | cut -d'|' -f2-)
    
    if [[ "$http_code" == "200" ]]; then
        # Check if product with this name exists
        local existing_product=$(echo "$body" | jq -r ".data[]? | select(.title == \"$product_name\") | .id" 2>/dev/null || echo "")
        if [[ -n "$existing_product" && "$existing_product" != "null" ]]; then
            echo "$existing_product"
            return 0
        fi
    fi
    
    return 1
}

# Create a product with idempotent behavior
create_product() {
    local product_name="$1"
    local product_data="$2"
    
    log "INFO" "Checking if product '$product_name' already exists..."
    
    if existing_id=$(product_exists "$product_name"); then
        log "SUCCESS" "Product '$product_name' already exists with ID: $existing_id"
        return 0
    fi
    
    log "INFO" "Creating new product: $product_name"
    
    local response=$(make_api_request "POST" "$WHOP_API_ENDPOINT" "$product_data")
    local http_code=$(echo "$response" | cut -d'|' -f1)
    local body=$(echo "$response" | cut -d'|' -f2-)
    
    case "$http_code" in
        200|201)
            local product_id=$(echo "$body" | jq -r '.id // .data.id' 2>/dev/null || echo "unknown")
            log "SUCCESS" "Product '$product_name' created successfully (ID: $product_id)"
            return 0
            ;;
        400)
            local error_msg=$(echo "$body" | jq -r '.message // .error // "Bad request"' 2>/dev/null)
            log "WARNING" "Product '$product_name' creation failed (400): $error_msg"
            # Check if it's a duplicate error
            if echo "$error_msg" | grep -qi "already exists\|duplicate"; then
                log "INFO" "Product appears to already exist, continuing..."
                return 0
            fi
            return 1
            ;;
        401)
            log "ERROR" "Authentication failed. Please check your WHOP_SECRET_API_KEY"
            return 1
            ;;
        *)
            local error_msg=$(echo "$body" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "Unknown error")
            log "ERROR" "Product '$product_name' creation failed ($http_code): $error_msg"
            return 1
            ;;
    esac
}

# Define product configurations
create_developer_plan() {
    local product_data='{
        "title": "ECOSYSTEMCL.AI Developer Plan",
        "description": "Free tier for individual developers getting started with AI-powered development workflows",
        "price": 0,
        "currency": "USD",
        "billing_period": "monthly",
        "features": [
            "Basic AI agent assistance",
            "Up to 5 projects",
            "Community support",
            "Core workflow automation"
        ],
        "metadata": {
            "tier": "developer",
            "trial_days": 0,
            "max_projects": 5,
            "support_level": "community"
        }
    }'
    
    create_product "ECOSYSTEMCL.AI Developer Plan" "$product_data"
}

create_architect_plan() {
    local product_data='{
        "title": "ECOSYSTEMCL.AI Architect Plan",
        "description": "Professional tier for senior developers and teams with advanced AI orchestration capabilities",
        "price": 10000,
        "currency": "USD",
        "billing_period": "monthly",
        "trial_period_days": 7,
        "features": [
            "Advanced AI agent team orchestration",
            "Unlimited projects",
            "Priority support",
            "Custom agent personalities",
            "Advanced workflow automation",
            "Integration APIs",
            "Team collaboration features"
        ],
        "metadata": {
            "tier": "architect",
            "trial_days": 7,
            "max_projects": -1,
            "support_level": "priority"
        }
    }'
    
    create_product "ECOSYSTEMCL.AI Architect Plan" "$product_data"
}

create_enterprise_plan() {
    local product_data='{
        "title": "ECOSYSTEMCL.AI Enterprise Plan",
        "description": "Enterprise solution with custom AI agent teams, dedicated support, and white-label options",
        "price": 0,
        "currency": "USD",
        "billing_period": "custom",
        "features": [
            "Custom AI agent development",
            "Dedicated infrastructure",
            "White-label solutions",
            "24/7 dedicated support",
            "Custom integrations",
            "On-premise deployment options",
            "SLA guarantees",
            "Training and onboarding"
        ],
        "metadata": {
            "tier": "enterprise",
            "trial_days": 0,
            "max_projects": -1,
            "support_level": "dedicated",
            "contact_sales": true
        }
    }'
    
    create_product "ECOSYSTEMCL.AI Enterprise Plan" "$product_data"
}

# Main execution
main() {
    log "INFO" "Starting ECOSYSTEMCL.AI product provisioning..."
    
    # Pre-flight checks
    check_dependencies
    check_api_key
    
    # Create products
    local success_count=0
    local total_products=3
    
    log "INFO" "Creating Developer Plan (Free tier)..."
    if create_developer_plan; then
        ((success_count++))
    fi
    
    log "INFO" "Creating Architect Plan (\$100/month with 7-day trial)..."
    if create_architect_plan; then
        ((success_count++))
    fi
    
    log "INFO" "Creating Enterprise Plan (Contact sales)..."
    if create_enterprise_plan; then
        ((success_count++))
    fi
    
    # Summary
    log "INFO" "Product provisioning complete: $success_count/$total_products products processed"
    
    if [[ $success_count -eq $total_products ]]; then
        log "SUCCESS" "All products have been successfully provisioned!"
        exit 0
    else
        log "WARNING" "Some products may have failed to provision. Check logs above for details."
        exit 1
    fi
}

# Error handler
handle_error() {
    local exit_code=$?
    log "ERROR" "Script failed with exit code $exit_code on line $1"
    exit $exit_code
}

# Set up error handling
trap 'handle_error $LINENO' ERR

# Execute main function
main "$@"