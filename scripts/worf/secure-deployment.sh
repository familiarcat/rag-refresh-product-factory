#!/usr/bin/env bash
# =====================================================
# Worf Secure Deployment Workflow
# Ensures secrets are managed securely during deployment
# =====================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

banner() {
    echo -e "${BOLD}${BLUE}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║                                                        ║"
    echo "║    🛡️  Worf Secure Deployment System                  ║"
    echo "║    'A secure deployment is a successful deployment'   ║"
    echo "║                                                        ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log() {
    echo -e "${GREEN}[Worf]${NC} $*"
}

warn() {
    echo -e "${YELLOW}[Worf]${NC} ⚠️  $*"
}

error() {
    echo -e "${RED}[Worf]${NC} ❌ $*" >&2
}

audit() {
    local action="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local user=$(whoami)
    local audit_log="$ROOT_DIR/.secrets/audit.log"

    mkdir -p "$(dirname "$audit_log")"
    echo "$timestamp | $user | DEPLOYMENT | $action" >> "$audit_log"
}

# =====================================================
# Security Checks
# =====================================================

check_secrets_source() {
    log "Checking secrets source..."

    local SECURE_VAULT="$HOME/.alexai-secrets/api-keys.env"
    local PROJECT_ENV="$ROOT_DIR/.env.local"

    if [ -f "$SECURE_VAULT" ]; then
        echo -e "  ${GREEN}✓${NC} Worf secure vault found: ~/.alexai-secrets/api-keys.env"
        echo -e "  ${GREEN}✓${NC} Using centralized secure storage"
        return 0
    elif [ -f "$PROJECT_ENV" ]; then
        warn "Using project .env.local (not centrally managed)"
        echo -e "  ${YELLOW}ℹ️${NC}  Consider migrating to Worf vault: ./scripts/fix-aws-credentials.sh"
        return 0
    else
        error "No secrets found!"
        echo ""
        echo "Run one of:"
        echo "  ./scripts/fix-aws-credentials.sh  # Setup AWS credentials"
        echo "  ./scripts/worf/worf.sh dev        # Setup all development secrets"
        exit 1
    fi
}

validate_aws_credentials() {
    log "Validating AWS credentials..."

    # Load from secure vault if available
    if [ -f "$HOME/.alexai-secrets/api-keys.env" ]; then
        set -a
        source "$HOME/.alexai-secrets/api-keys.env"
        set +a
    elif [ -f "$ROOT_DIR/.env.local" ]; then
        set -a
        source "$ROOT_DIR/.env.local"
        set +a
    fi

    # Check credentials are set
    if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
        error "AWS credentials not set"
        exit 1
    fi

    # Validate credentials work
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        error "AWS credentials are invalid or expired"
        echo ""
        echo "Fix with: ./scripts/fix-aws-credentials.sh"
        exit 1
    fi

    # Get account info
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local user_arn=$(aws sts get-caller-identity --query Arn --output text)

    echo -e "  ${GREEN}✓${NC} Credentials valid"
    echo -e "  ${BLUE}ℹ️${NC}  Account: $account_id"
    echo -e "  ${BLUE}ℹ️${NC}  User: $user_arn"

    audit "AWS_CREDENTIALS_VALIDATED: $user_arn"
}

check_sensitive_files() {
    log "Checking for sensitive files in git..."

    local sensitive_patterns=(
        "*.env"
        "*.env.local"
        "*api-keys*"
        "*credentials*"
        ".secrets/*"
    )

    local found_sensitive=false

    for pattern in "${sensitive_patterns[@]}"; do
        if git ls-files | grep -q "$pattern"; then
            warn "Sensitive file in git: $pattern"
            found_sensitive=true
        fi
    done

    if [ "$found_sensitive" = true ]; then
        error "Sensitive files found in git repository!"
        echo ""
        echo "These should be in .gitignore:"
        git ls-files | grep -E "\.env|api-keys|credentials"
        echo ""
        echo "Fix with:"
        echo "  git rm --cached <file>"
        echo "  echo '<pattern>' >> .gitignore"
        exit 1
    fi

    echo -e "  ${GREEN}✓${NC} No sensitive files in git"
}

verify_gitignore() {
    log "Verifying .gitignore coverage..."

    local required_patterns=(
        ".env.local"
        ".secrets/"
        "*.env"
    )

    local missing=()

    for pattern in "${required_patterns[@]}"; do
        if ! grep -q "^${pattern}$" .gitignore 2>/dev/null; then
            missing+=("$pattern")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        warn "Missing .gitignore patterns:"
        for pattern in "${missing[@]}"; do
            echo "  - $pattern"
        done

        echo ""
        read -p "Add missing patterns to .gitignore? (y/N) " -n 1 -r
        echo ""

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for pattern in "${missing[@]}"; do
                echo "$pattern" >> .gitignore
            done
            echo -e "${GREEN}✓${NC} Updated .gitignore"
        fi
    else
        echo -e "  ${GREEN}✓${NC} .gitignore properly configured"
    fi
}

# =====================================================
# Deployment Functions
# =====================================================

pre_deployment_security_check() {
    banner
    log "Running pre-deployment security checks..."
    echo ""

    check_secrets_source
    validate_aws_credentials
    check_sensitive_files
    verify_gitignore

    echo ""
    log "✅ All security checks passed!"
    audit "PRE_DEPLOYMENT_CHECKS_PASSED"
    echo ""
}

secure_deploy() {
    banner

    # Pre-deployment security
    pre_deployment_security_check

    # Execute deployment
    log "Executing secure deployment..."
    echo ""

    audit "DEPLOYMENT_STARTED"

    if "$ROOT_DIR/scripts/deploy-app.sh"; then
        echo ""
        log "✅ Deployment successful!"
        audit "DEPLOYMENT_SUCCESS"
    else
        error "Deployment failed!"
        audit "DEPLOYMENT_FAILED"
        exit 1
    fi
}

show_deployment_status() {
    banner
    log "Deployment Security Status"
    echo ""

    # Check secrets location
    if [ -f "$HOME/.alexai-secrets/api-keys.env" ]; then
        echo -e "  ${GREEN}✓${NC} Secrets: Worf secure vault (~/.alexai-secrets)"
    elif [ -f "$ROOT_DIR/.env.local" ]; then
        echo -e "  ${YELLOW}⚠${NC}  Secrets: Local project only (.env.local)"
    else
        echo -e "  ${RED}✗${NC} Secrets: Not configured"
    fi

    # Check AWS credentials
    if aws sts get-caller-identity >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} AWS credentials: Valid"
    else
        echo -e "  ${RED}✗${NC} AWS credentials: Invalid or missing"
    fi

    # Check git status
    if git status --porcelain | grep -q ".env"; then
        echo -e "  ${RED}✗${NC} Git: Sensitive files staged"
    else
        echo -e "  ${GREEN}✓${NC} Git: No sensitive files staged"
    fi

    # Check audit log
    if [ -f "$ROOT_DIR/.secrets/audit.log" ]; then
        local recent_count=$(tail -n 10 "$ROOT_DIR/.secrets/audit.log" | wc -l)
        echo -e "  ${GREEN}✓${NC} Audit log: $recent_count recent entries"
    else
        echo -e "  ${YELLOW}⚠${NC}  Audit log: Not initialized"
    fi

    echo ""
}

show_help() {
    banner
    echo "Usage: worf-deploy <command>"
    echo ""
    echo "Commands:"
    echo "  check         Run pre-deployment security checks"
    echo "  deploy        Secure deployment with validation"
    echo "  status        Show deployment security status"
    echo ""
    echo "Examples:"
    echo "  worf-deploy check    # Validate security before deploy"
    echo "  worf-deploy deploy   # Full secure deployment"
    echo "  worf-deploy status   # Check current security status"
    echo ""
}

# =====================================================
# Main
# =====================================================

main() {
    local command="${1:-help}"

    case "$command" in
        check)
            pre_deployment_security_check
            ;;
        deploy)
            secure_deploy
            ;;
        status)
            show_deployment_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
