#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Ghost Window — Script de instalação
# ─────────────────────────────────────────────────────────────
set -e

UUID="ghost-window@ghostwindow.local"
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
SCHEMA_DIR="$INSTALL_DIR/schemas"

echo ""
echo "👻 Ghost Window — Instalador"
echo "────────────────────────────"

# 1. Cria diretório de destino
echo "→ Criando diretório da extensão..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$SCHEMA_DIR"

# 2. Copia arquivos
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "→ Copiando arquivos..."
cp "$SCRIPT_DIR/metadata.json"  "$INSTALL_DIR/"
cp "$SCRIPT_DIR/extension.js"   "$INSTALL_DIR/"
cp "$SCRIPT_DIR/prefs.js"       "$INSTALL_DIR/"
cp "$SCRIPT_DIR/schemas/"*.xml  "$SCHEMA_DIR/"

# 3. Compila o schema GSettings
echo "→ Compilando schema GSettings..."
glib-compile-schemas "$SCHEMA_DIR"

echo ""
echo "✅ Extensão instalada em:"
echo "   $INSTALL_DIR"
echo ""
echo "─────────────────────────────────────────────────────────"
echo "PRÓXIMOS PASSOS:"
echo ""
echo "  1. Recarregue o GNOME Shell:"
echo ""
echo "     • Se estiver no X11:"
echo "       Pressione Alt+F2, digite 'r' e Enter"
echo ""
echo "     • Se estiver no Wayland:"
echo "       Faça logout e login novamente"
echo ""
echo "  2. Ative a extensão:"
echo "     gnome-extensions enable $UUID"
echo ""
echo "  3. Use os atalhos:"
echo "     Super+\`        → esconde a janela ativa"
echo "     Super+Shift+\`  → abre lista para restaurar"
echo "     👻 no painel   → clique para ver/restaurar janelas"
echo ""
echo "  4. (Opcional) Configure atalhos personalizados:"
echo "     gnome-extensions prefs $UUID"
echo "─────────────────────────────────────────────────────────"
