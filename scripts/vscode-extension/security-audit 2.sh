#!/bin/bash
#
# Alex AI VS Code Extension - Security Audit
# Ensures no secrets are published to the marketplace
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
EXTENSION_DIR="$PROJECT_ROOT/vscode-extension"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       🔒 Alex AI Extension - Security Audit                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

ISSUES=0
WARNINGS=0

# Check function
check() {
  local status="$1"
  local message="$2"
  if [ "$status" == "pass" ]; then
    echo -e "${GREEN}✓${NC} $message"
  elif [ "$status" == "fail" ]; then
    echo -e "${RED}✗${NC} $message"
    ISSUES=$((ISSUES + 1))
  elif [ "$status" == "warn" ]; then
    echo -e "${YELLOW}⚠${NC} $message"
    WARNINGS=$((WARNINGS + 1))
  fi
}

echo -e "${YELLOW}1. Checking for hardcoded secrets in source files...${NC}"
echo ""

cd "$EXTENSION_DIR"

# Check for hardcoded API keys
HARDCODED_KEYS=$(rg -l "sk-or-[a-zA-Z0-9]+" --type ts --type js -g '!node_modules/*' 2>/dev/null || true)
if [ -z "$HARDCODED_KEYS" ]; then
  check "pass" "No hardcoded OpenRouter API keys found"
else
  check "fail" "Hardcoded API keys found in: $HARDCODED_KEYS"
fi

# Check for hardcoded secrets patterns
SECRET_PATTERNS=$(rg -l "(password|secret|token)\s*[:=]\s*['\"][^'\"]{10,}" --type ts --type js -g '!node_modules/*' -i 2>/dev/null || true)
if [ -z "$SECRET_PATTERNS" ]; then
  check "pass" "No hardcoded password/secret/token values found"
else
  check "fail" "Potential hardcoded secrets in: $SECRET_PATTERNS"
fi

# Check for AWS credentials
AWS_CREDS=$(rg -l "(AKIA|aws_access_key|aws_secret)" --type ts --type js -g '!node_modules/*' -i 2>/dev/null || true)
if [ -z "$AWS_CREDS" ]; then
  check "pass" "No AWS credentials found"
else
  check "fail" "AWS credentials found in: $AWS_CREDS"
fi

echo ""
echo -e "${YELLOW}2. Checking files included in VSIX package...${NC}"
echo ""

# Check for .env files
if ls .env* 1>/dev/null 2>&1; then
  check "fail" ".env files exist - ensure they're in .vscodeignore"
else
  check "pass" "No .env files found"
fi

# Check .vscodeignore exists
if [ -f ".vscodeignore" ]; then
  check "pass" ".vscodeignore file exists"
  
  # Check critical exclusions
  if grep -q "\.env" .vscodeignore 2>/dev/null; then
    check "pass" ".env files excluded in .vscodeignore"
  else
    check "warn" "Consider adding .env* to .vscodeignore"
  fi
else
  check "warn" "No .vscodeignore file - all files may be included"
fi

# List what will be in the package
echo ""
echo -e "${YELLOW}3. Files that will be published:${NC}"
echo ""
npx vsce ls 2>/dev/null | grep -v "node_modules" | head -30
TOTAL_FILES=$(npx vsce ls 2>/dev/null | wc -l)
echo "   ... ($TOTAL_FILES total files)"

echo ""
echo -e "${YELLOW}4. Checking credential handling...${NC}"
echo ""

# Check VS Code settings are properly defined
if grep -q "alexAi.openRouterApiKey" package.json 2>/dev/null; then
  check "pass" "VS Code settings UI for API key is defined"
else
  check "fail" "VS Code settings UI for API key is NOT defined"
fi

# Check if there's a setup command
if grep -q "alexAi.configure" package.json 2>/dev/null; then
  check "pass" "Configuration command available for users"
else
  check "warn" "Consider adding a configuration command for first-time setup"
fi

# Check credentials.ts for proper handling
if [ -f "src/credentials.ts" ]; then
  # Check priority order (VS Code settings should be first)
  if grep -q "getConfiguration.*first\|Check VS Code settings first" src/credentials.ts 2>/dev/null; then
    check "pass" "VS Code settings are checked first (before local shell config)"
  else
    check "warn" "Verify VS Code settings take priority over local shell config"
  fi
  
  # Check for secret storage usage
  if grep -q "context.secrets" src/credentials.ts 2>/dev/null; then
    check "pass" "Uses VS Code secure secret storage"
  else
    check "warn" "Consider using VS Code's secure secret storage"
  fi
fi

echo ""
echo -e "${YELLOW}5. Checking for sensitive file patterns...${NC}"
echo ""

# Check for private keys
PRIVATE_KEYS=$(find . -name "*.pem" -o -name "*.key" -o -name "id_rsa*" 2>/dev/null | grep -v node_modules || true)
if [ -z "$PRIVATE_KEYS" ]; then
  check "pass" "No private key files found"
else
  check "fail" "Private key files found: $PRIVATE_KEYS"
fi

# Check for credential files
CRED_FILES=$(find . -name "*credentials*" -o -name "*secret*" 2>/dev/null | grep -v node_modules | grep -v "credentials.ts" || true)
if [ -z "$CRED_FILES" ]; then
  check "pass" "No suspicious credential files found"
else
  check "warn" "Check these files: $CRED_FILES"
fi

echo ""
echo -e "${YELLOW}6. Runtime security checks...${NC}"
echo ""

# Check that API key is read at runtime, not build time
if grep -q "process.env.OPENROUTER_API_KEY" src/*.ts 2>/dev/null; then
  check "pass" "API key is read from environment at runtime"
else
  check "warn" "Verify API key is obtained at runtime"
fi

# Check for console.log of sensitive data
CONSOLE_SECRETS=$(rg "console\.(log|info|debug).*api.?key" --type ts -i -g '!node_modules/*' 2>/dev/null || true)
if [ -z "$CONSOLE_SECRETS" ]; then
  check "pass" "No console logging of API keys"
else
  check "fail" "API keys may be logged to console"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}🔒 SECURITY AUDIT PASSED${NC}"
  echo ""
  echo "   No security issues found. Extension is safe to publish."
elif [ $ISSUES -eq 0 ]; then
  echo -e "${YELLOW}⚠️  SECURITY AUDIT PASSED WITH WARNINGS${NC}"
  echo ""
  echo "   $WARNINGS warning(s) found. Review before publishing."
else
  echo -e "${RED}🚨 SECURITY AUDIT FAILED${NC}"
  echo ""
  echo "   $ISSUES critical issue(s) found. DO NOT PUBLISH."
  echo "   $WARNINGS warning(s) found."
  exit 1
fi

echo ""
echo -e "${BLUE}Recommendations for marketplace publishing:${NC}"
echo "   1. Users must configure API key via VS Code Settings"
echo "   2. Local shell config extraction is for YOUR testing only"
echo "   3. Run 'npm run vscode:audit' before every publish"
echo ""


