#!/bin/bash
set -e

echo "============================================"
echo "  DeepSeek Coder - VS Code Local AI Setup (Linux)"
echo "============================================"
echo

# Step 1: Check Ollama
echo "[Step 1] Checking Ollama..."
if ! command -v ollama &> /dev/null; then
    echo "  ERROR: Ollama is not installed."
    echo "  Please install it by running: curl -fsSL https://ollama.com/install.sh | sh"
    exit 1
fi
echo "  Ollama is installed. ✅"
echo

# Step 2: Pull models
read -p "   Download deepseek-coder:6.7b (~3.8 GB)? (y/n): " download_ds
if [[ "$download_ds" =~ ^[Yy]$ ]]; then
    ollama pull deepseek-coder:6.7b
else
    echo "  Skipped deepseek-coder:6.7b."
fi
echo

read -p "   Download qwen2.5-coder:7b (~4.7 GB) - Recommended? (y/n): " download_qwen
if [[ "$download_qwen" =~ ^[Yy]$ ]]; then
    ollama pull qwen2.5-coder:7b
else
    echo "  Skipped qwen2.5-coder:7b."
fi
echo

read -p "   Download qwen2.5-coder:0.5b (~400 MB) - Fast autocomplete? (y/n): " download_fast
if [[ "$download_fast" =~ ^[Yy]$ ]]; then
    ollama pull qwen2.5-coder:0.5b
else
    echo "  Skipped qwen2.5-coder:0.5b."
fi
echo

read -p "   Download nomic-embed-text (~274 MB) - Code search? (y/n): " download_embed
if [[ "$download_embed" =~ ^[Yy]$ ]]; then
    ollama pull nomic-embed-text:latest
else
    echo "  Skipped nomic-embed-text."
fi
echo

# Step 3: Continue Extension Setup
echo "============================================"
echo "  VS Code - Continue Extension Setup"
echo "============================================"
echo "[Step 3] Installing Continue extension..."
if command -v code &> /dev/null; then
    code --install-extension Continue.continue
    echo "  Continue extension installation attempted. ✅"
else
    echo "  VS Code CLI 'code' command not found. Please install Continue manually from the extension marketplace."
fi
echo

# Step 4: GitHub Copilot Local Setup
echo "============================================"
echo "  VS Code - GitHub Copilot Local Setup"
echo "============================================"
echo "[Step 4] Copying configurations..."

CONFIG_DIR="$HOME/.config/Code/User"
mkdir -p "$CONFIG_DIR"

if [ -f "$CONFIG_DIR/settings.json" ]; then
    echo "  Backing up existing settings.json to settings.json.backup..."
    cp "$CONFIG_DIR/settings.json" "$CONFIG_DIR/settings.json.backup"
fi

# Merge or copy settings.json
cp copilot-vscode-settings.json "$CONFIG_DIR/settings.json"
cp copilot-chatLanguageModels.json "$CONFIG_DIR/chatLanguageModels.json"
echo "  Copilot configuration copied to $CONFIG_DIR ✅"
echo

echo "============================================"
echo "  DONE - Setup Complete!"
echo "============================================"
echo
echo "Available Ollama models:"
ollama list
echo
echo "=== How to Use in VS Code ==="
echo "  1. Restart VS Code."
echo "  2. COPILOT CHAT (Ctrl+Shift+I):"
echo "     - Select model dropdown and choose 'DeepSeek Coder 6.7B (Local)' or 'Qwen Coder 7B (Local)'"
echo "  3. CONTINUE EXTENSION (Ctrl+L):"
echo "     - Select model dropdown and choose the local model."
echo
