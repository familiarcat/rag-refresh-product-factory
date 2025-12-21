#!/bin/bash

# RAG Product Factory - Repository Status Script
# Provides comprehensive status of the RAG implementation

echo "╔════════════════════════════════════════════════════════╗"
echo "║      RAG Product Factory - Repository Status          ║"
echo "╚════════════════════════════════════════════════════════╝"

echo ""
echo "📊 GIT STATUS:"
git status --short

echo ""
echo "🐍 PYTHON ENVIRONMENT:"
if command -v poetry &> /dev/null; then
    poetry env info --short
else
    echo "❌ Poetry not installed"
fi

echo ""
echo "🚀 RAG SERVER STATUS:"
if pgrep -f "src.rag_factory.server" > /dev/null; then
    echo "✅ RAG server is running"
else
    echo "⚠️  RAG server is not running"
fi

echo ""
echo "📦 DEPENDENCIES:"
if [ -f "pyproject.toml" ]; then
    echo "✅ Project configuration found"
    poetry show --latest | head -n 10
else
    echo "❌ pyproject.toml not found"
fi

echo ""
echo "🧪 TEST STATUS:"
if [ -d "tests/" ]; then
    TEST_COUNT=$(find tests -name "test_*.py" | wc -l)
    echo "✅ $TEST_COUNT test files found"
else
    echo "❌ Tests directory not found"
fi

echo ""
echo "📝 MEMORY STATUS:"
if [ -d "data/" ]; then
    echo "✅ Data directory exists"
else
    echo "ℹ️  Data directory not created yet"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              Status Check Complete                    ║"
echo "╚════════════════════════════════════════════════════════╝"
