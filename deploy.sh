#!/bin/bash
set -e

PROJECT="/Users/sachinrajyaguru/Desktop/sachin/random-file-opener-vs-code-extension"
VSIX="$PROJECT/random-file-opener-17.2.23.vsix"
EXTENSION_ID="sachinrajyaguru.random-file-opener"  # ← update to your publisher.name

echo "📦 Building extension..."
cd "$PROJECT"
vsce package

echo "🗑  Uninstalling old version..."
code --uninstall-extension "$EXTENSION_ID" || true   # 'true' so it won't fail if not installed

echo "⚙️  Installing new version..."
code --install-extension "$VSIX"

echo "✅ Done! Reload VS Code window to activate (Cmd+Shift+P → 'Reload Window')"
