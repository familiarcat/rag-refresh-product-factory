#!/usr/bin/env bash
# =====================================================
# Lt. Worf Security System
# Centralized secrets management for Alex AI
# =====================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
MANIFEST="$SCRIPT_DIR/security-manifest.json"
AUDIT_LOG="$ROOT_DIR/.secrets/audit.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# =====================================================
# Utility Functions
# =====================================================

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
    local details="${2:-}"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local user=$(whoami)

    mkdir -p "$(dirname "$AUDIT_LOG")"
    echo "$timestamp | $user | $action | $details" >> "$AUDIT_LOG"
}

banner() {
    echo -e "${BOLD}${BLUE}"
    echo "╔═══════════════════════════════════════════════════╗"
    echo "║       Lt. Worf Security System v1.0.0             ║"
    echo "║   'Today is a good day to secure secrets'         ║"
    echo "╚═══════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

require_command() {
    local cmd="$1"
    if ! command -v "$cmd" &> /dev/null; then
        error "Required command not found: $cmd"
        error "Please install $cmd and try again"
        exit 1
    fi
}

confirm() {
    local prompt="$1"
    read -p "$(echo -e "${YELLOW}[Worf]${NC} $prompt (y/N): ")" -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# =====================================================
# Core Functions
# =====================================================

sync_from_shell() {
    log "Syncing secrets from ~/.zshrc..."
    audit "sync_from_shell" "Started"

    # Use existing TypeScript sync script
    npm run script:secrets:sync > /dev/null

    local out_file="$ROOT_DIR/.secrets/.env.local"
    if [[ -f "$out_file" ]]; then
        local secret_count=$(grep -c "^[A-Z]" "$out_file" || echo 0)
        log "✓ Synced $secret_count secrets to $out_file"
        audit "sync_from_shell" "Success: $secret_count secrets"
    else
        error "Sync failed - output file not created"
        audit "sync_from_shell" "Failed"
        exit 1
    fi
}

validate_secrets() {
    log "Validating secrets..."
    audit "validate_secrets" "Started"

    local env_file="$ROOT_DIR/.secrets/.env.local"
    [[ -f "$env_file" ]] || { error "Secrets file not found"; exit 1; }

    # Check required secrets
    local required=(
        "SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
    )

    local missing=()
    for key in "${required[@]}"; do
        if ! grep -q "^${key}=" "$env_file"; then
            missing+=("$key")
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        warn "Missing required secrets:"
        for key in "${missing[@]}"; do
            echo "  - $key"
        done
        audit "validate_secrets" "Failed: missing ${missing[*]}"
        return 1
    fi

    log "✓ All required secrets present"
    audit "validate_secrets" "Success"
}

copy_to_local_env() {
    log "Copying secrets to .env.local..."

    local src="$ROOT_DIR/.secrets/.env.local"
    local dest="$ROOT_DIR/.env.local"

    if [[ -f "$dest" ]]; then
        if ! confirm ".env.local already exists. Overwrite?"; then
            log "Skipped copying to .env.local"
            return 0
        fi
    fi

    cp "$src" "$dest"
    chmod 600 "$dest"

    log "✓ Copied to .env.local"
    audit "copy_to_local_env" "Success"
}

push_to_github() {
    log "Pushing secrets to GitHub Actions..."
    audit "push_to_github" "Started"

    require_command "gh"

    # Check if user is authenticated
    if ! gh auth status &> /dev/null; then
        error "Not authenticated with GitHub CLI"
        error "Run: gh auth login"
        exit 1
    fi

    if ! confirm "Push secrets to GitHub Actions?"; then
        log "Cancelled GitHub push"
        return 0
    fi

    # Use existing GitHub sync script
    bash "$ROOT_DIR/scripts/secrets/gh_sync_secrets.sh" "$ROOT_DIR/.secrets/.env.local"

    log "✓ Pushed to GitHub Actions"
    audit "push_to_github" "Success"
}

link_supabase() {
    log "Linking Supabase project..."
    audit "link_supabase" "Started"

    require_command "supabase"

    # Load secrets
    local env_file="$ROOT_DIR/.env.local"
    [[ -f "$env_file" ]] || { error "Run 'worf sync' first"; exit 1; }

    source "$env_file"

    # Extract project ref from URL
    local project_ref=$(echo "$SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co|\1|')

    if [[ -z "$project_ref" ]]; then
        error "Could not extract project ref from SUPABASE_URL"
        exit 1
    fi

    log "Project: $project_ref"

    # Check if already linked
    if supabase projects list 2>/dev/null | grep -q "$project_ref"; then
        log "✓ Already linked to Supabase project"
    else
        log "Linking to Supabase project..."
        supabase link --project-ref "$project_ref"
        log "✓ Linked to Supabase project"
    fi

    audit "link_supabase" "Success: $project_ref"
}

run_migrations() {
    log "Running Supabase migrations..."
    audit "run_migrations" "Started"

    require_command "supabase"

    # Check if linked
    if ! supabase projects list &> /dev/null; then
        error "Supabase not linked. Run: worf supabase:link"
        exit 1
    fi

    # Run migrations
    if supabase db push; then
        log "✓ Migrations completed"
        audit "run_migrations" "Success"
    else
        error "Migrations failed"
        audit "run_migrations" "Failed"
        exit 1
    fi
}

verify_connection() {
    log "Verifying Supabase connection..."
    audit "verify_connection" "Started"

    # Load env
    source "$ROOT_DIR/.env.local"

    # Quick connection test using curl
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        "$SUPABASE_URL/rest/v1/")

    if [[ "$response" =~ ^(200|404)$ ]]; then
        log "✓ Connected to Supabase"
        audit "verify_connection" "Success"
    else
        error "Connection failed (HTTP $response)"
        audit "verify_connection" "Failed: HTTP $response"
        exit 1
    fi
}

show_status() {
    log "Security Status:"
    echo ""

    # Check local secrets
    if [[ -f "$ROOT_DIR/.secrets/.env.local" ]]; then
        local count=$(grep -c "^[A-Z]" "$ROOT_DIR/.secrets/.env.local" || echo 0)
        echo "  ✓ Secrets vault: $count secrets"
    else
        echo "  ✗ Secrets vault: not found"
    fi

    # Check .env.local
    if [[ -f "$ROOT_DIR/.env.local" ]]; then
        echo "  ✓ .env.local: exists"
    else
        echo "  ✗ .env.local: not found"
    fi

    # Check GitHub auth
    if command -v gh &> /dev/null && gh auth status &> /dev/null; then
        echo "  ✓ GitHub CLI: authenticated"
    else
        echo "  ✗ GitHub CLI: not authenticated"
    fi

    # Check Supabase CLI
    if command -v supabase &> /dev/null; then
        echo "  ✓ Supabase CLI: installed"
        if supabase projects list &> /dev/null 2>&1; then
            echo "  ✓ Supabase: linked"
        else
            echo "  ✗ Supabase: not linked"
        fi
    else
        echo "  ✗ Supabase CLI: not installed"
    fi

    echo ""
}

show_audit_log() {
    if [[ -f "$AUDIT_LOG" ]]; then
        log "Recent audit log entries:"
        tail -n 20 "$AUDIT_LOG"
    else
        log "No audit log found"
    fi
}

# =====================================================
# Workflow Commands
# =====================================================

workflow_local_dev() {
    banner
    log "Workflow: Local Development Setup"
    echo ""

    sync_from_shell
    validate_secrets
    copy_to_local_env

    echo ""
    log "✓ Local development environment ready!"
    log "Next: npm run dev"
}

workflow_ci_setup() {
    banner
    log "Workflow: CI/CD Setup"
    echo ""

    sync_from_shell
    validate_secrets
    push_to_github

    echo ""
    log "✓ CI/CD secrets configured!"
}

workflow_supabase() {
    banner
    log "Workflow: Supabase Migration"
    echo ""

    sync_from_shell
    validate_secrets
    copy_to_local_env
    link_supabase
    run_migrations
    verify_connection

    echo ""
    log "✓ Supabase migrations complete!"
}

# =====================================================
# CLI Interface
# =====================================================

show_help() {
    banner
    echo "Usage: worf <command>"
    echo ""
    echo "Commands:"
    echo "  sync              Sync secrets from ~/.zshrc to .secrets/.env.local"
    echo "  validate          Validate secrets completeness"
    echo "  local             Copy secrets to .env.local for local dev"
    echo "  github            Push secrets to GitHub Actions"
    echo "  status            Show security status"
    echo "  audit             Show audit log"
    echo ""
    echo "Workflows:"
    echo "  dev               Setup local development (sync + validate + local)"
    echo "  ci                Setup CI/CD (sync + validate + github)"
    echo "  supabase          Run Supabase migrations (full workflow)"
    echo ""
    echo "Supabase Commands:"
    echo "  supabase:link     Link to Supabase project"
    echo "  supabase:migrate  Run database migrations"
    echo "  supabase:verify   Verify database connection"
    echo ""
    echo "Examples:"
    echo "  worf dev          # Setup local environment"
    echo "  worf ci           # Setup GitHub Actions secrets"
    echo "  worf supabase     # Run complete Supabase workflow"
    echo ""
}

main() {
    local command="${1:-help}"

    case "$command" in
        sync)
            banner
            sync_from_shell
            ;;
        validate)
            banner
            validate_secrets
            ;;
        local)
            banner
            copy_to_local_env
            ;;
        github)
            banner
            push_to_github
            ;;
        status)
            banner
            show_status
            ;;
        audit)
            banner
            show_audit_log
            ;;
        dev)
            workflow_local_dev
            ;;
        ci)
            workflow_ci_setup
            ;;
        supabase)
            workflow_supabase
            ;;
        supabase:link)
            banner
            link_supabase
            ;;
        supabase:migrate)
            banner
            run_migrations
            ;;
        supabase:verify)
            banner
            verify_connection
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
