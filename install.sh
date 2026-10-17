#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Ghost Window — Installer Script
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

UUID="ghost-window@ghostwindow.local"
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
SCHEMA_DIR="$INSTALL_DIR/schemas"
ICONS_DIR="$INSTALL_DIR/icons"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "👻 Installing Ghost Window ($UUID)..."

# 1. Prepare target directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$SCHEMA_DIR"
mkdir -p "$ICONS_DIR"

# 2. Copy extension files
cp "$SCRIPT_DIR/metadata.json"  "$INSTALL_DIR/"
cp "$SCRIPT_DIR/extension.js"   "$INSTALL_DIR/"
cp "$SCRIPT_DIR/prefs.js"       "$INSTALL_DIR/"
cp "$SCRIPT_DIR/stylesheet.css" "$INSTALL_DIR/" 2>/dev/null || true
cp "$SCRIPT_DIR/schemas/"*.xml  "$SCHEMA_DIR/"
cp "$SCRIPT_DIR/icons/"*.svg    "$ICONS_DIR/" 2>/dev/null || true

# 3. Compile schemas
echo "→ Compiling GSettings schemas..."
glib-compile-schemas "$SCHEMA_DIR"

echo "✅ Extension installed successfully at:"
echo "   $INSTALL_DIR"
echo ""
echo "Next steps:"
echo "  • Wayland: Log out and log back in."
echo "  • X11: Press Alt+F2, type 'r', and press Enter."
echo "  • Enable extension: gnome-extensions enable $UUID"
echo "  • Default shortcuts:"
echo "      Ctrl+Alt+J      → Conceal active window"
echo "      Ctrl+Alt+Escape → Panic Mode (Conceal all open windows)"
echo "      Ctrl+Alt+K      → Open restore menu"
