#!/bin/bash
# Fix AWS Credentials Helper
# Guides user through setting up valid AWS credentials

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                      ║${NC}"
echo -e "${BLUE}║         AWS Credentials Setup Helper                ║${NC}"
echo -e "${BLUE}║                                                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check current status
echo -e "${YELLOW}Step 1: Checking current AWS credentials...${NC}"
echo ""

if aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${GREEN}✓ AWS credentials are valid!${NC}"
    aws sts get-caller-identity
    echo ""
    echo "Your credentials are working. No action needed."
    exit 0
else
    echo -e "${RED}✗ AWS credentials are invalid or not set${NC}"
    echo ""
fi

# Step 2: Check .env.local
echo -e "${YELLOW}Step 2: Checking .env.local file...${NC}"
echo ""

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ .env.local exists${NC}"

    if grep -q "AWS_ACCESS_KEY_ID" .env.local && grep -q "AWS_SECRET_ACCESS_KEY" .env.local; then
        echo -e "${YELLOW}⚠ AWS credentials found in .env.local, but they appear to be invalid${NC}"
        echo ""
        echo "Current values (redacted):"
        grep "AWS_ACCESS_KEY_ID" .env.local | sed 's/=.*/=***REDACTED***/'
        grep "AWS_SECRET_ACCESS_KEY" .env.local | sed 's/=.*/=***REDACTED***/'
        grep "AWS_REGION" .env.local 2>/dev/null || echo "AWS_REGION=NOT_SET"
    else
        echo -e "${RED}✗ AWS credentials not found in .env.local${NC}"
    fi
else
    echo -e "${RED}✗ .env.local does not exist${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Step 3: Guide user
echo -e "${YELLOW}How to fix:${NC}"
echo ""
echo "Option 1: Get credentials from AWS IAM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Log into AWS Console: https://console.aws.amazon.com/"
echo "2. Go to IAM → Users → Your User → Security Credentials"
echo "3. Click 'Create access key'"
echo "4. Choose 'Command Line Interface (CLI)'"
echo "5. Copy the Access Key ID and Secret Access Key"
echo ""
echo "Option 2: Use existing credentials from ~/.aws/credentials"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "If you have credentials in ~/.aws/credentials, you can copy them:"
echo ""
if [ -f ~/.aws/credentials ]; then
    echo -e "${GREEN}✓ Found ~/.aws/credentials${NC}"
    echo ""
    echo "Available profiles:"
    grep '^\[' ~/.aws/credentials | sed 's/\[//g' | sed 's/\]//g' || echo "No profiles found"
    echo ""
    echo "To use a profile, run:"
    echo "  export AWS_PROFILE=<profile-name>"
else
    echo -e "${YELLOW}⚠ ~/.aws/credentials not found${NC}"
fi
echo ""

# Step 4: Interactive setup
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Where should secrets be stored?${NC}"
echo "1) Worf secure vault (~/.alexai-secrets/api-keys.env) [RECOMMENDED]"
echo "2) Local project only (.env.local)"
echo ""
read -p "Choice (1 or 2): " -n 1 -r storage_choice
echo ""
echo ""

read -p "Do you want to update secrets now? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Enter your AWS credentials:${NC}"
    echo ""

    read -p "AWS Access Key ID: " access_key
    read -s -p "AWS Secret Access Key: " secret_key
    echo ""
    read -p "AWS Region (default: us-east-2): " region
    region=${region:-us-east-2}

    echo ""

    # Determine target file based on choice
    if [[ "$storage_choice" == "1" ]]; then
        SECURE_VAULT="$HOME/.alexai-secrets/api-keys.env"
        mkdir -p "$HOME/.alexai-secrets"
        chmod 700 "$HOME/.alexai-secrets"

        echo -e "${YELLOW}Updating Worf secure vault...${NC}"

        # Backup existing vault
        if [ -f "$SECURE_VAULT" ]; then
            cp "$SECURE_VAULT" "$SECURE_VAULT.backup.$(date +%Y%m%d-%H%M%S)"
            echo -e "${GREEN}✓ Backed up existing vault${NC}"
        fi

        # Update vault (preserve existing secrets, update AWS ones)
        if [ -f "$SECURE_VAULT" ]; then
            # Remove old AWS secrets
            grep -v "^AWS_ACCESS_KEY_ID=" "$SECURE_VAULT" | \
            grep -v "^AWS_SECRET_ACCESS_KEY=" | \
            grep -v "^AWS_REGION=" > "$SECURE_VAULT.tmp"
        else
            touch "$SECURE_VAULT.tmp"
        fi

        # Add new AWS secrets
        cat >> "$SECURE_VAULT.tmp" << EOF

# AWS Configuration (updated $(date))
AWS_ACCESS_KEY_ID=$access_key
AWS_SECRET_ACCESS_KEY=$secret_key
AWS_REGION=$region
AWS_ACCOUNT_ID=860268930466
EC2_INSTANCE_ID=i-006cd2a8477f36489
EOF

        mv "$SECURE_VAULT.tmp" "$SECURE_VAULT"
        chmod 600 "$SECURE_VAULT"

        echo -e "${GREEN}✓ Updated Worf secure vault${NC}"
        echo ""
        echo -e "${BLUE}ℹ️  Your secrets are now in: ~/.alexai-secrets/api-keys.env${NC}"
        echo -e "${BLUE}ℹ️  They are automatically loaded via load_alex_ai_secrets() in ~/.zshrc${NC}"

        # Also update .env.local for immediate use
        echo ""
        echo -e "${YELLOW}Syncing to .env.local for immediate use...${NC}"
        cp "$SECURE_VAULT" .env.local
        chmod 600 .env.local
        echo -e "${GREEN}✓ Synced to .env.local${NC}"

    else
        echo -e "${YELLOW}Updating .env.local...${NC}"

        # Backup existing .env.local
        if [ -f ".env.local" ]; then
            cp .env.local ".env.local.backup.$(date +%Y%m%d-%H%M%S)"
            echo -e "${GREEN}✓ Backed up existing .env.local${NC}"
        fi

        # Update or create .env.local
        if [ -f ".env.local" ]; then
            # Update existing file
            sed -i.bak "s|^AWS_ACCESS_KEY_ID=.*|AWS_ACCESS_KEY_ID=$access_key|" .env.local
            sed -i.bak "s|^AWS_SECRET_ACCESS_KEY=.*|AWS_SECRET_ACCESS_KEY=$secret_key|" .env.local
            sed -i.bak "s|^AWS_REGION=.*|AWS_REGION=$region|" .env.local
            rm .env.local.bak
        else
            # Create new file
            cat > .env.local << EOF
# AWS Configuration
AWS_ACCESS_KEY_ID=$access_key
AWS_SECRET_ACCESS_KEY=$secret_key
AWS_REGION=$region
AWS_ACCOUNT_ID=860268930466
EC2_INSTANCE_ID=i-006cd2a8477f36489

# OpenRouter API (optional)
# OPENROUTER_API_KEY=sk-or-v1-...
EOF
        fi
        chmod 600 .env.local
        echo -e "${GREEN}✓ Updated .env.local${NC}"
    fi

    echo ""

    # Test credentials
    echo -e "${YELLOW}Testing credentials...${NC}"
    export AWS_ACCESS_KEY_ID=$access_key
    export AWS_SECRET_ACCESS_KEY=$secret_key
    export AWS_REGION=$region

    if aws sts get-caller-identity >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Credentials are valid!${NC}"
        echo ""
        aws sts get-caller-identity
        echo ""
        echo -e "${GREEN}✅ Setup complete!${NC}"
        echo ""
        if [[ "$storage_choice" == "1" ]]; then
            echo "Next steps:"
            echo "1. Reload your shell: source ~/.zshrc"
            echo "2. Deploy: ./scripts/deploy-app.sh"
            echo ""
            echo "Your secrets will be automatically loaded from Worf vault."
        else
            echo "Next step: ./scripts/deploy-app.sh"
        fi
    else
        echo -e "${RED}✗ Credentials are still invalid${NC}"
        echo ""
        echo "Please verify your credentials and try again."
        exit 1
    fi
else
    echo ""
    if [[ "$storage_choice" == "1" ]]; then
        echo "To manually update Worf secure vault:"
        echo "  Edit: ~/.alexai-secrets/api-keys.env"
    else
        echo "To manually update .env.local:"
        echo "  Edit: .env.local"
    fi
    echo ""
    echo "Add these lines:"
    echo "AWS_ACCESS_KEY_ID=your-access-key-here"
    echo "AWS_SECRET_ACCESS_KEY=your-secret-key-here"
    echo "AWS_REGION=us-east-2"
    echo ""
    echo "Then test: aws sts get-caller-identity"
fi

echo ""
