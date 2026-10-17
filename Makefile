UUID = ghost-window@ghostwindow.local
INSTALL_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)
SCHEMA_DIR = $(INSTALL_DIR)/schemas
ICONS_DIR = $(INSTALL_DIR)/icons

.PHONY: all install uninstall enable disable prefs pack clean

all: install

install:
	@echo "Installing $(UUID)..."
	@mkdir -p "$(INSTALL_DIR)"
	@mkdir -p "$(SCHEMA_DIR)"
	@mkdir -p "$(ICONS_DIR)"
	@cp metadata.json extension.js prefs.js "$(INSTALL_DIR)/"
	@cp -f stylesheet.css "$(INSTALL_DIR)/" 2>/dev/null || true
	@cp -f schemas/*.xml "$(SCHEMA_DIR)/"
	@cp -f icons/*.svg "$(ICONS_DIR)/" 2>/dev/null || true
	@echo "Compiling GSettings schemas..."
	@glib-compile-schemas "$(SCHEMA_DIR)"
	@echo "Installed successfully to $(INSTALL_DIR)"

uninstall:
	@echo "Uninstalling $(UUID)..."
	@rm -rf "$(INSTALL_DIR)"
	@echo "Uninstalled."

enable:
	@gnome-extensions enable $(UUID)

disable:
	@gnome-extensions disable $(UUID)

prefs:
	@gnome-extensions prefs $(UUID)

pack:
	@echo "Packaging extension..."
	@gnome-extensions pack --force \
		--extra-source=stylesheet.css \
		--extra-source=icons/ \
		--out-dir=.
	@echo "Package created."

clean:
	@rm -f schemas/gschemas.compiled
	@rm -f $(UUID).shell-extension.zip
	@echo "Clean completed."
