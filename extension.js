/**
 * Ghost Window — GNOME Shell Extension
 *
 * Conceals active windows from Alt+Tab, Dash, and Overview while
 * keeping processes and audio running in the background.
 *
 * Supported GNOME Shell versions: 45, 46, 47 (Wayland & X11)
 */

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Workspace from 'resource:///org/gnome/shell/ui/workspace.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const SCHEMA_KEY_HIDE = 'hide-shortcut';
const SCHEMA_KEY_RESTORE = 'restore-shortcut';
const SCHEMA_KEY_PANIC = 'panic-shortcut';

// ─────────────────────────────────────────────────────────────────────────────
// GhostIndicator (Top Panel Button & Popup Menu)
// ─────────────────────────────────────────────────────────────────────────────
const GhostIndicator = GObject.registerClass(
  class GhostIndicator extends PanelMenu.Button {
    _init(extension) {
      super._init(0.0, 'Ghost Window');
      this._extension = extension;

      // Status bar icon
      const iconFile = extension.dir
        .get_child('icons')
        .get_child('ghost-symbolic.svg');
      this._iconFile = Gio.FileIcon.new(iconFile);

      this._statusIcon = new St.Icon({
        gicon: this._iconFile,
        style_class: 'system-status-icon',
      });
      this.add_child(this._statusIcon);

      // Concealed windows counter badge
      this._counterBadge = new St.Label({
        text: '',
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'ghost-badge',
      });
      this._counterBadge.hide();
      this.add_child(this._counterBadge);

      this._setupMenu();

      // Refresh list whenever menu is opened
      this.menu.connect('open-state-changed', (_menu, isOpen) => {
        if (isOpen) {
          this._renderMenuList();
        }
      });
    }

    /**
     * Constructs the static layout of the popup menu.
     */
    _setupMenu() {
      // 1. Header Section
      const headerItem = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
        can_focus: false,
      });

      const headerContainer = new St.BoxLayout({
        vertical: false,
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'ghost-header-box',
      });

      const headerIcon = new St.Icon({
        gicon: this._iconFile,
        icon_size: 16,
        style: 'margin-right: 8px;',
      });

      const headerTitle = new St.Label({
        text: 'Ghost Window',
        style_class: 'ghost-header-title',
        y_align: Clutter.ActorAlign.CENTER,
      });

      this._headerSubtitle = new St.Label({
        text: 'No concealed windows',
        style_class: 'dim-label',
        style: 'font-size: 11px; margin-left: 12px;',
        x_expand: true,
        x_align: Clutter.ActorAlign.END,
        y_align: Clutter.ActorAlign.CENTER,
      });

      headerContainer.add_child(headerIcon);
      headerContainer.add_child(headerTitle);
      headerContainer.add_child(this._headerSubtitle);
      headerItem.add_child(headerContainer);
      this.menu.addMenuItem(headerItem);

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      // 2. Dynamic Window List Section
      this._windowListSection = new PopupMenu.PopupMenuSection();
      this.menu.addMenuItem(this._windowListSection);

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      // 3. Action: Conceal all visible (Panic Mode)
      const panicItem = new PopupMenu.PopupBaseMenuItem();
      const panicBox = new St.BoxLayout({
        vertical: false,
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
      });
      const panicIcon = new St.Icon({
        icon_name: 'view-conceal-symbolic',
        icon_size: 14,
        style: 'margin-right: 8px;',
        style_class: 'dim-label',
      });
      const panicLabel = new St.Label({
        text: 'Panic: Conceal all open windows',
        style_class: 'dim-label',
        y_align: Clutter.ActorAlign.CENTER,
      });
      panicBox.add_child(panicIcon);
      panicBox.add_child(panicLabel);
      panicItem.add_child(panicBox);
      panicItem.connect('activate', () => {
        this.menu.close();
        this._extension.triggerPanicMode();
      });
      this.menu.addMenuItem(panicItem);

      // 4. Action: Release all windows
      const restoreAllItem = new PopupMenu.PopupBaseMenuItem();
      const restoreAllBox = new St.BoxLayout({
        vertical: false,
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
      });
      const restoreAllIcon = new St.Icon({
        icon_name: 'edit-undo-symbolic',
        icon_size: 14,
        style: 'margin-right: 8px;',
        style_class: 'ghost-action-accent',
      });
      const restoreAllLabel = new St.Label({
        text: 'Release all windows',
        style_class: 'ghost-action-accent',
        y_align: Clutter.ActorAlign.CENTER,
      });
      restoreAllBox.add_child(restoreAllIcon);
      restoreAllBox.add_child(restoreAllLabel);
      restoreAllItem.add_child(restoreAllBox);
      restoreAllItem.connect('activate', () => {
        this._extension.restoreAll();
        this.menu.close();
      });
      this.menu.addMenuItem(restoreAllItem);

      // 5. Action: Open Preferences
      const preferencesItem = new PopupMenu.PopupBaseMenuItem();
      const preferencesBox = new St.BoxLayout({
        vertical: false,
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
      });
      const preferencesIcon = new St.Icon({
        icon_name: 'preferences-system-symbolic',
        icon_size: 14,
        style: 'margin-right: 8px;',
        style_class: 'dim-label',
      });
      const preferencesLabel = new St.Label({
        text: 'Settings',
        style_class: 'dim-label',
        style: 'font-size: 11px;',
        y_align: Clutter.ActorAlign.CENTER,
      });
      preferencesBox.add_child(preferencesIcon);
      preferencesBox.add_child(preferencesLabel);
      preferencesItem.add_child(preferencesBox);
      preferencesItem.connect('activate', () => {
        this.menu.close();
        this._extension.openPreferences();
      });
      this.menu.addMenuItem(preferencesItem);

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      // 6. Action: Disable Extension
      const disableItem = new PopupMenu.PopupBaseMenuItem();
      const disableBox = new St.BoxLayout({
        vertical: false,
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
      });
      const disableIcon = new St.Icon({
        icon_name: 'system-shutdown-symbolic',
        icon_size: 14,
        style: 'margin-right: 8px;',
        style_class: 'ghost-action-danger',
      });
      const disableLabel = new St.Label({
        text: 'Disable Ghost Window',
        style_class: 'ghost-action-danger',
        y_align: Clutter.ActorAlign.CENTER,
      });
      disableBox.add_child(disableIcon);
      disableBox.add_child(disableLabel);
      disableItem.add_child(disableBox);
      disableItem.connect('activate', () => {
        this.menu.close();
        this._extension.restoreAll();
        Main.extensionManager.disableExtension(this._extension.uuid);
      });
      this.menu.addMenuItem(disableItem);
    }

    /**
     * Renders active list of concealed windows or empty placeholder.
     */
    _renderMenuList() {
      this._windowListSection.removeAll();
      const hiddenWindows = this._extension.getHiddenWindows();

      if (this._headerSubtitle) {
        this._headerSubtitle.set_text(
          hiddenWindows.length === 0
            ? 'No concealed windows'
            : `${hiddenWindows.length} concealed`
        );
      }

      // Empty state
      if (hiddenWindows.length === 0) {
        const emptyItem = new PopupMenu.PopupBaseMenuItem({
          reactive: false,
          can_focus: false,
        });
        const emptyBox = new St.BoxLayout({
          vertical: true,
          style_class: 'ghost-empty-box',
          x_expand: true,
          x_align: Clutter.ActorAlign.CENTER,
        });

        const emptyIcon = new St.Icon({
          icon_name: 'view-conceal-symbolic',
          icon_size: 28,
          style_class: 'dim-label',
        });
        const emptyTitle = new St.Label({
          text: 'No concealed windows',
          style_class: 'dim-label',
          style: 'font-weight: bold; font-size: 12px; margin-top: 8px;',
        });
        const emptyHint = new St.Label({
          text: 'Press Ctrl+Alt+J to conceal active window',
          style_class: 'dim-label',
          style: 'font-size: 10px; margin-top: 2px;',
        });

        emptyBox.add_child(emptyIcon);
        emptyBox.add_child(emptyTitle);
        emptyBox.add_child(emptyHint);
        emptyItem.add_child(emptyBox);
        this._windowListSection.addMenuItem(emptyItem);
        return;
      }

      // Render items for each concealed window
      hiddenWindows.forEach(({ window, appName, title }) => {
        const menuItem = new PopupMenu.PopupBaseMenuItem();

        const rowContainer = new St.BoxLayout({
          vertical: false,
          x_expand: true,
          y_align: Clutter.ActorAlign.CENTER,
          style_class: 'ghost-item-row',
        });

        // App Icon
        let appIconWidget;
        try {
          const tracker = Shell.WindowTracker.get_default();
          const app = tracker.get_window_app(window);
          if (app) {
            appIconWidget = app.create_icon_texture(22);
            appIconWidget.set_style('margin-right: 10px; min-width: 22px;');
          }
        } catch (_) {}

        if (!appIconWidget) {
          appIconWidget = new St.Icon({
            icon_name: 'application-x-executable-symbolic',
            icon_size: 20,
            style: 'margin-right: 10px; min-width: 20px;',
            style_class: 'dim-label',
            y_align: Clutter.ActorAlign.CENTER,
          });
        }

        // Window Details (App Name + Document Title)
        const textBox = new St.BoxLayout({
          vertical: true,
          x_expand: true,
          y_align: Clutter.ActorAlign.CENTER,
        });

        const appLabel = new St.Label({
          text: appName,
          style_class: 'ghost-app-name',
        });
        appLabel.clutter_text.ellipsize = 3;

        const cleanTitle = title
          ? title
              .replace(` — ${appName}`, '')
              .replace(` - ${appName}`, '')
              .trim()
          : '';

        textBox.add_child(appLabel);

        if (cleanTitle) {
          const titleLabel = new St.Label({
            text: cleanTitle,
            style_class: 'ghost-app-title dim-label',
          });
          titleLabel.clutter_text.ellipsize = 3;
          textBox.add_child(titleLabel);
        }

        // Close window button
        const closeIcon = new St.Icon({
          icon_name: 'window-close-symbolic',
          icon_size: 13,
        });
        const closeButton = new St.Button({
          child: closeIcon,
          style_class: 'ghost-close-btn',
          y_align: Clutter.ActorAlign.CENTER,
          x_align: Clutter.ActorAlign.END,
        });

        closeButton.connect('clicked', () => {
          try {
            window.delete(global.get_current_time());
          } catch (_) {}
          this._extension.cleanupWindow(window);
          this.menu.close();
        });

        rowContainer.add_child(appIconWidget);
        rowContainer.add_child(textBox);
        rowContainer.add_child(closeButton);
        menuItem.add_child(rowContainer);

        // Click row to restore window
        menuItem.connect('activate', () => {
          this._extension.restoreWindow(window);
          this.menu.close();
        });

        this._windowListSection.addMenuItem(menuItem);
      });
    }

    /**
     * Updates numeric badge displayed next to the panel icon.
     * @param {number} count Number of concealed windows
     */
    updateBadge(count) {
      if (count > 0) {
        this._counterBadge.set_text(String(count));
        this._counterBadge.show();
      } else {
        this._counterBadge.hide();
      }
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GhostWindowExtension (Main Extension Class)
// ─────────────────────────────────────────────────────────────────────────────
export default class GhostWindowExtension extends Extension {
  enable() {
    this._settings = this.getSettings();
    this._hiddenWindows = [];
    this._indicator = null;
    this._registeredKeybindings = [];
    this._settingsSignalIds = [];

    this._createIndicator();
    this._registerKeybindings();
    this._patchAltTabSwitcher();
    this._patchOverview();

    // Rebind shortcuts if preferences change
    this._settingsSignalIds.push(
      this._settings.connect(`changed::${SCHEMA_KEY_HIDE}`, () =>
        this._registerKeybindings()
      ),
      this._settings.connect(`changed::${SCHEMA_KEY_RESTORE}`, () =>
        this._registerKeybindings()
      ),
      this._settings.connect(`changed::${SCHEMA_KEY_PANIC}`, () =>
        this._registerKeybindings()
      )
    );

    console.log('[GhostWindow] Enabled successfully');
  }

  disable() {
    // 1. Disconnect settings watchers
    if (this._settings) {
      this._settingsSignalIds.forEach(signalId => {
        try {
          this._settings.disconnect(signalId);
        } catch (_) {}
      });
      this._settingsSignalIds = [];
    }

    // 2. Unregister keyboard shortcuts
    this._unregisterKeybindings();

    // 3. Remove switcher and overview patches
    this._unpatchAltTabSwitcher();
    this._unpatchOverview();

    // 4. Restore any concealed windows
    this.restoreAll();

    // 5. Remove indicator from status bar
    this._destroyIndicator();

    // 6. Clean up state
    this._hiddenWindows = [];
    this._settings = null;

    console.log('[GhostWindow] Disabled successfully');
  }

  // ── Alt+Tab Switcher Filter ───────────────────────────────────────────────
  _patchAltTabSwitcher() {
    // Keep window minimized if it requests attention while concealed
    this._attentionSignalId = global.display.connect(
      'window-demands-attention',
      (_display, window) => {
        if (this._isWindowHidden(window)) {
          try {
            window.minimize();
          } catch (_) {}
        }
      }
    );

    // Filter concealed windows out of Alt+Tab list
    this._originalGetTabList = global.display.get_tab_list.bind(global.display);
    global.display.get_tab_list = (type, workspace) => {
      const windowList = this._originalGetTabList(type, workspace);
      return windowList.filter(win => !this._isWindowHidden(win));
    };
  }

  _unpatchAltTabSwitcher() {
    if (this._originalGetTabList) {
      global.display.get_tab_list = this._originalGetTabList;
      this._originalGetTabList = null;
    }

    if (this._attentionSignalId) {
      try {
        global.display.disconnect(this._attentionSignalId);
      } catch (_) {}
      this._attentionSignalId = null;
    }
  }

  // ── Overview (Activities / Super Key) Concealment ─────────────────────────
  _patchOverview() {
    const self = this;

    // 1. Intercept Overview window clone check
    this._originalIsOverviewWindow = Workspace.Workspace.prototype._isOverviewWindow;
    Workspace.Workspace.prototype._isOverviewWindow = function (window) {
      if (self._isWindowHidden(window)) {
        return false;
      }
      return self._originalIsOverviewWindow.call(this, window);
    };

    // 2. Intercept Workspace window ownership check
    this._originalIsMyWindow = Workspace.Workspace.prototype._isMyWindow;
    Workspace.Workspace.prototype._isMyWindow = function (window) {
      if (self._isWindowHidden(window)) {
        return false;
      }
      return self._originalIsMyWindow.call(this, window);
    };
  }

  _unpatchOverview() {
    if (this._originalIsOverviewWindow) {
      Workspace.Workspace.prototype._isOverviewWindow = this._originalIsOverviewWindow;
      this._originalIsOverviewWindow = null;
    }

    if (this._originalIsMyWindow) {
      Workspace.Workspace.prototype._isMyWindow = this._originalIsMyWindow;
      this._originalIsMyWindow = null;
    }
  }

  _syncOverviewWindow(window, isHidden) {
    try {
      const workspacesDisplay =
        Main.overview?._overview?.controls?.workspacesDisplay;
      const workspacesViews = workspacesDisplay?._workspacesViews || [];

      for (const view of workspacesViews) {
        if (!view._workspaces) continue;
        for (const ws of view._workspaces) {
          if (isHidden) {
            ws._doRemoveWindow?.(window);
          } else {
            ws._doAddWindow?.(window);
          }
        }
      }
    } catch (_) {}
  }

  _isWindowHidden(window) {
    return this._hiddenWindows.some(item => item.window === window);
  }

  // ── Indicator Management ──────────────────────────────────────────────────
  _createIndicator() {
    this._indicator = new GhostIndicator(this);
    Main.panel.addToStatusArea(this.uuid, this._indicator, 1, 'right');
  }

  _destroyIndicator() {
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
  }

  // ── Keybindings ───────────────────────────────────────────────────────────
  _registerKeybindings() {
    this._unregisterKeybindings();

    const shortcutActions = {
      [SCHEMA_KEY_HIDE]: () => this._hideActiveWindow(),
      [SCHEMA_KEY_RESTORE]: () => this._indicator?.menu.toggle(),
      [SCHEMA_KEY_PANIC]: () => this.triggerPanicMode(),
    };

    for (const [shortcutKey, actionHandler] of Object.entries(shortcutActions)) {
      try {
        Main.wm.addKeybinding(
          shortcutKey,
          this._settings,
          Meta.KeyBindingFlags.NONE,
          Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
          actionHandler
        );
        this._registeredKeybindings.push(shortcutKey);
      } catch (err) {
        console.error(`[GhostWindow] Failed to register shortcut "${shortcutKey}": ${err.message}`);
      }
    }
  }

  _unregisterKeybindings() {
    for (const shortcutKey of this._registeredKeybindings) {
      try {
        Main.wm.removeKeybinding(shortcutKey);
      } catch (_) {}
    }
    this._registeredKeybindings = [];
  }

  // ── Window Actions ────────────────────────────────────────────────────────
  _concealWindow(window) {
    if (!window || this._isWindowHidden(window)) {
      return false;
    }

    const windowType = window.get_window_type();
    const isSpecialType = [
      Meta.WindowType.DESKTOP,
      Meta.WindowType.DOCK,
      Meta.WindowType.DIALOG,
      Meta.WindowType.MODAL_DIALOG,
    ].includes(windowType);

    if (isSpecialType) {
      return false;
    }

    const appName = this._getAppName(window);
    const title = window.get_title() || '';

    try {
      window.minimize();
    } catch (_) {
      return false;
    }

    // Auto-cleanup if window is closed externally
    const unmanagedSignalId = window.connect('unmanaged', () =>
      this.cleanupWindow(window)
    );

    this._hiddenWindows.push({
      window,
      appName,
      title,
      signalId: unmanagedSignalId,
    });

    this._syncOverviewWindow(window, true);
    this._syncBadge();
    return true;
  }

  _hideActiveWindow() {
    const activeWindow = global.display.focus_window;
    if (!activeWindow) return;

    const appName = this._getAppName(activeWindow);
    const concealed = this._concealWindow(activeWindow);

    if (concealed) {
      try {
        Main.notify('Ghost Window', `${appName} concealed (Ctrl+Alt+K to release)`);
      } catch (_) {}
      console.log(`[GhostWindow] Concealed: ${appName}`);
    }
  }

  /**
   * Boss Key / Panic Mode: Instantly conceals all normal visible windows.
   */
  triggerPanicMode() {
    const activeWorkspace = global.workspace_manager.get_active_workspace();
    const visibleWindows = global.display.get_tab_list(Meta.TabList.NORMAL, activeWorkspace);

    let concealedCount = 0;
    for (const win of visibleWindows) {
      if (this._concealWindow(win)) {
        concealedCount++;
      }
    }

    if (concealedCount > 0) {
      try {
        Main.notify(
          'Ghost Window — Panic Mode',
          `${concealedCount} window${concealedCount > 1 ? 's' : ''} concealed`
        );
      } catch (_) {}
      console.log(`[GhostWindow] Panic Mode activated: ${concealedCount} windows concealed`);
    }
  }

  restoreWindow(window) {
    const itemIndex = this._hiddenWindows.findIndex(item => item.window === window);
    if (itemIndex === -1) return;

    const { signalId, appName } = this._hiddenWindows[itemIndex];
    try {
      window.disconnect(signalId);
    } catch (_) {}

    try {
      window.unminimize();
      window.activate(global.get_current_time());
    } catch (_) {}

    this._hiddenWindows.splice(itemIndex, 1);
    this._syncOverviewWindow(window, false);
    this._syncBadge();
    console.log(`[GhostWindow] Restored: ${appName}`);
  }

  restoreAll() {
    [...this._hiddenWindows].forEach(({ window }) => this.restoreWindow(window));
  }

  cleanupWindow(window) {
    const itemIndex = this._hiddenWindows.findIndex(item => item.window === window);
    if (itemIndex !== -1) {
      const { signalId } = this._hiddenWindows[itemIndex];
      try {
        window.disconnect(signalId);
      } catch (_) {}
      this._hiddenWindows.splice(itemIndex, 1);
      this._syncOverviewWindow(window, false);
      this._syncBadge();
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getHiddenWindows() {
    return [...this._hiddenWindows];
  }

  _getAppName(window) {
    try {
      const tracker = Shell.WindowTracker.get_default();
      const app = tracker.get_window_app(window);
      if (app) return app.get_name();
    } catch (_) {}

    return window.get_wm_class() || 'Window';
  }

  _syncBadge() {
    this._indicator?.updateBadge(this._hiddenWindows.length);
  }
}
