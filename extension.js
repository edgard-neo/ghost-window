/**
 * Ghost Window — GNOME Shell Extension
 * Compatível com GNOME Shell 45, 46, 47 — Wayland + X11
 * uuid: ghost-window@ghostwindow.local
 */

import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

// ─────────────────────────────────────────────────────────────
// INDICATOR
// ─────────────────────────────────────────────────────────────
const GhostIndicator = GObject.registerClass(
  class GhostIndicator extends PanelMenu.Button {
    _init(extension) {
      super._init(0.0, 'Ghost Window');
      this._ext = extension;

      this._icon = new St.Label({
        text: '👻',
        y_align: Clutter.ActorAlign.CENTER,
        style: 'font-size: 14px; padding: 0 4px;',
      });
      this.add_child(this._icon);

      this._badge = new St.Label({
        text: '',
        y_align: Clutter.ActorAlign.CENTER,
        style:
          'font-size:9px;font-weight:bold;color:#fff;background-color:#e03030;border-radius:8px;padding:1px 5px;margin-left:-4px;',
      });
      this._badge.hide();
      this.add_child(this._badge);

      this._buildMenu();
      this.menu.connect('open-state-changed', (_m, open) => {
        if (open) this._refreshMenu();
      });
    }

    _buildMenu() {
      // ── Header ──────────────────────────────────────────────
      const header = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
        can_focus: false,
      });
      const headerBox = new St.BoxLayout({
        vertical: false,
        style: 'padding: 4px 2px 6px 2px;',
      });

      const headerIcon = new St.Label({
        text: '👻',
        style: 'font-size:15px; margin-right:8px;',
        y_align: Clutter.ActorAlign.CENTER,
      });

      const headerTextBox = new St.BoxLayout({ vertical: true });

      const headerTitle = new St.Label({
        text: 'Ghost Window',
        style: 'font-weight:bold; font-size:12px; color:#ffffff;',
      });

      this._headerSub = new St.Label({
        text: 'No hidden windows',
        style: 'font-size:10px; color:#666;',
      });

      headerTextBox.add_child(headerTitle);
      headerTextBox.add_child(this._headerSub);
      headerBox.add_child(headerIcon);
      headerBox.add_child(headerTextBox);
      header.add_child(headerBox);
      this.menu.addMenuItem(header);

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      // ── Lista dinâmica de janelas ────────────────────────────
      this._section = new PopupMenu.PopupMenuSection();
      this.menu.addMenuItem(this._section);

      // ── Footer ──────────────────────────────────────────────
      this._footerSep = new PopupMenu.PopupSeparatorMenuItem();
      this.menu.addMenuItem(this._footerSep);

      // Mostrar todas
      const restoreAll = this.menu.addAction('↩  Release all', () => {
        this._ext.restoreAll();
        this.menu.close();
      });
      restoreAll.label.set_style('font-size:11px; color:#89b4fa;');

      // Dica de atalhos
      const hint = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
        can_focus: false,
      });
      const hintLabel = new St.Label({
        text: '⌨  Ctrl+Alt+J  hide   ·   Ctrl+Alt+K  release',
        style: 'font-size:9px; color:#444; padding: 2px 0 4px 0;',
      });
      hint.add_child(hintLabel);
      this.menu.addMenuItem(hint);

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      // Desativar
      const disable = this.menu.addAction('⏻  Disable Ghost Window', () => {
        this.menu.close();
        this._ext.restoreAll();
        Main.extensionManager.disableExtension(
          'ghost-window@ghostwindow.local'
        );
      });
      disable.label.set_style('font-size:11px; color:#f38ba8;');
    }

    _refreshMenu() {
      this._section.removeAll();
      const hidden = this._ext.getHiddenWindows();

      // Atualiza subtítulo do header
      if (this._headerSub) {
        this._headerSub.set_text(
          hidden.length === 0
            ? 'No hidden windows'
            : `${hidden.length} hidden window${hidden.length > 1 ? 's' : ''}`
        );
      }

      if (hidden.length === 0) {
        const empty = new PopupMenu.PopupBaseMenuItem({
          reactive: false,
          can_focus: false,
        });
        const emptyBox = new St.BoxLayout({
          vertical: true,
          style: 'padding: 10px 4px;',
          x_align: Clutter.ActorAlign.CENTER,
        });
        const emptyIcon = new St.Label({
          text: '✦',
          style: 'font-size:20px; color:#2a2a2a;',
        });
        const emptyLabel = new St.Label({
          text: 'Press Ctrl+Alt+J to hide a window',
          style: 'font-size:10px; color:#444; margin-top:6px;',
        });
        emptyBox.add_child(emptyIcon);
        emptyBox.add_child(emptyLabel);
        empty.add_child(emptyBox);
        this._section.addMenuItem(empty);
        return;
      }

      hidden.forEach(({ win, appName, title }) => {
        const item = new PopupMenu.PopupBaseMenuItem({ style_class: '' });

        const row = new St.BoxLayout({
          vertical: false,
          x_expand: true,
          style: 'padding: 3px 0;',
        });

        // ── Ícone real do app ──────────────────────────────────
        let appIconWidget;
        try {
          const tracker = Shell.WindowTracker.get_default();
          const app = tracker.get_window_app(win);
          if (app) {
            appIconWidget = app.create_icon_texture(20);
            appIconWidget.set_style('margin-right:10px; min-width:20px;');
          }
        } catch (_) {}

        // Fallback: emoji genérico
        if (!appIconWidget) {
          appIconWidget = new St.Label({
            text: '▣',
            style:
              'font-size:16px; color:#555; margin-right:10px; min-width:20px;',
            y_align: Clutter.ActorAlign.CENTER,
          });
        }

        // ── Textos (nome + título separados) ───────────────────
        const textBox = new St.BoxLayout({
          vertical: true,
          x_expand: true,
          y_align: Clutter.ActorAlign.CENTER,
        });

        const appLabel = new St.Label({
          text: appName,
          style: 'font-size:12px; color:#e0e0e0; font-weight:bold;',
        });
        appLabel.clutter_text.ellipsize = 3; // PANGO_ELLIPSIZE_END

        const windowTitle = title
          ? title
              .replace(` — ${appName}`, '')
              .replace(` - ${appName}`, '')
              .trim()
          : '';

        textBox.add_child(appLabel);

        if (windowTitle) {
          const titleLabel = new St.Label({
            text: windowTitle,
            style: 'font-size:10px; color:#555; margin-top:1px;',
          });
          titleLabel.clutter_text.ellipsize = 3;
          textBox.add_child(titleLabel);
        }

        // ── Botão ✕ fechar (fecha a janela) ───────────────────
        const closeBtn = new St.Button({
          label: '✕',
          style: `
            font-size:11px;
            color:#444;
            background:transparent;
            border:none;
            padding: 2px 6px;
            border-radius:4px;
            margin-left:6px;
          `,
          y_align: Clutter.ActorAlign.CENTER,
          x_align: Clutter.ActorAlign.END,
        });

        closeBtn.connect('clicked', () => {
          try {
            win.delete(global.get_current_time());
          } catch (_) {}
          this._ext._cleanup(win);
          this.menu.close();
        });

        closeBtn.connect('enter-event', () => {
          closeBtn.set_style(`
            font-size:11px;
            color:#f38ba8;
            background:rgba(243,139,168,0.12);
            border:none;
            padding: 2px 6px;
            border-radius:4px;
            margin-left:6px;
          `);
        });

        closeBtn.connect('leave-event', () => {
          closeBtn.set_style(`
            font-size:11px;
            color:#444;
            background:transparent;
            border:none;
            padding: 2px 6px;
            border-radius:4px;
            margin-left:6px;
          `);
        });

        row.add_child(appIconWidget);
        row.add_child(textBox);
        row.add_child(closeBtn);
        item.add_child(row);

        // Clicar no item = restaurar
        item.connect('activate', () => {
          this._ext.restoreWindow(win);
          this.menu.close();
        });

        // Hover no item inteiro
        item.connect('notify::active', () => {
          appLabel.set_style(
            item.active
              ? 'font-size:12px; color:#89b4fa; font-weight:bold;'
              : 'font-size:12px; color:#e0e0e0; font-weight:bold;'
          );
        });

        this._section.addMenuItem(item);
      });
    }

    updateBadge(count) {
      if (count > 0) {
        this._badge.set_text(String(count));
        this._badge.show();
      } else {
        this._badge.hide();
      }
    }
  }
);

// ─────────────────────────────────────────────────────────────
// EXTENSION
// ─────────────────────────────────────────────────────────────
export default class GhostWindowExtension extends Extension {
  enable() {
    this._settings = this.getSettings();
    this._hidden = [];
    this._indicator = null;
    this._keybindings = [];

    this._addIndicator();
    this._bindKeys();
    this._patchWindowTracker();

    console.log('[GhostWindow] enabled');
  }

  disable() {
    this._unbindKeys();
    this._unpatchWindowTracker();
    this._removeIndicator();
    this.restoreAll();

    this._hidden.forEach(({ win, signalId }) => {
      try {
        win.disconnect(signalId);
      } catch (_) {}
    });

    this._hidden = [];
    this._settings = null;

    console.log('[GhostWindow] disabled');
  }

  // ── PATCH: filtra janelas escondidas do Alt+Tab e Overview ──
  // Técnica do hide-minimized: sobrescreve o filtro de janelas
  // no WindowTracker que o GNOME usa para montar o switcher
  _patchWindowTracker() {
    const self = this;

    // Guarda referência ao método original de filtragem
    this._origGetApp = Shell.WindowTracker.prototype.get_window_app;

    // Intercepta todas as consultas de janelas do workspace
    // O truque: quando uma janela está na nossa lista _hidden,
    // fazemos ela parecer "minimizada" para o switcher não exibi-la
    this._displaySignal = global.display.connect(
      'window-demands-attention',
      (_display, win) => {
        // Não deixa janelas escondidas voltarem por notificação
        if (self._hidden.find(e => e.win === win)) {
          win.minimize();
        }
      }
    );

    // Patch no overview: esconde janelas da nossa lista
    const workspace = global.workspace_manager;
    this._workspaceSignal = workspace.connect(
      'workspace-added',
      () => {} // placeholder — o filtro real está no _isHidden
    );

    // Patch principal: filtra o AppSwitcher
    // Sobrescreve o método que lista janelas no Alt+Tab
    this._origGetTabList = global.display.get_tab_list.bind(global.display);
    global.display.get_tab_list = (type, workspace) => {
      const windows = self._origGetTabList(type, workspace);
      return windows.filter(w => !self._isHidden(w));
    };
  }

  _unpatchWindowTracker() {
    // Restaura get_tab_list
    if (this._origGetTabList) {
      global.display.get_tab_list = this._origGetTabList;
      this._origGetTabList = null;
    }

    if (this._displaySignal) {
      global.display.disconnect(this._displaySignal);
      this._displaySignal = null;
    }

    if (this._workspaceSignal) {
      global.workspace_manager.disconnect(this._workspaceSignal);
      this._workspaceSignal = null;
    }
  }

  _isHidden(win) {
    return !!this._hidden.find(e => e.win === win);
  }

  // ── INDICATOR ───────────────────────────────────────────────
  _addIndicator() {
    this._indicator = new GhostIndicator(this);
    Main.panel.addToStatusArea(this.uuid, this._indicator, 1, 'right');
  }

  _removeIndicator() {
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
  }

  // ── KEYBINDINGS ─────────────────────────────────────────────
  _bindKeys() {
    const map = {
      'hide-shortcut': () => this._hideActive(),
      'restore-shortcut': () => this._indicator?.menu.toggle(),
    };

    for (const [name, handler] of Object.entries(map)) {
      try {
        Main.wm.addKeybinding(
          name,
          this._settings,
          Meta.KeyBindingFlags.NONE,
          Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
          handler
        );
        this._keybindings.push(name);
        console.log(`[GhostWindow] keybinding: ${name} OK`);
      } catch (e) {
        console.error(`[GhostWindow] keybinding ${name} ERRO: ${e.message}`);
      }
    }
  }

  _unbindKeys() {
    this._keybindings.forEach(k => {
      try {
        Main.wm.removeKeybinding(k);
      } catch (_) {}
    });
    this._keybindings = [];
  }

  // ── HIDE ────────────────────────────────────────────────────
  _hideActive() {
    const win = global.display.focus_window;
    if (!win) return;

    const type = win.get_window_type();
    if (
      [
        Meta.WindowType.DESKTOP,
        Meta.WindowType.DOCK,
        Meta.WindowType.DIALOG,
        Meta.WindowType.MODAL_DIALOG,
      ].includes(type)
    )
      return;

    if (this._isHidden(win)) return;

    const appName = this._getAppName(win);
    const title = win.get_title() || '';

    win.minimize();

    const signalId = win.connect('unmanaged', () => this._cleanup(win));
    this._hidden.push({ win, appName, title, signalId });
    this._updateBadge();

    try {
      Main.notify(`👻 ${appName}`, 'Hidden — Ctrl+Alt+K to release');
    } catch (_) {}
    console.log(`[GhostWindow] hidden: ${appName}`);
  }

  // ── RESTORE ─────────────────────────────────────────────────
  restoreWindow(win) {
    const idx = this._hidden.findIndex(e => e.win === win);
    if (idx === -1) return;

    const { signalId, appName } = this._hidden[idx];
    try {
      win.disconnect(signalId);
    } catch (_) {}

    win.unminimize();
    win.activate(global.get_current_time());

    this._hidden.splice(idx, 1);
    this._updateBadge();
    console.log(`[GhostWindow] released: ${appName}`);
  }

  restoreAll() {
    [...this._hidden].forEach(({ win }) => this.restoreWindow(win));
  }

  _cleanup(win) {
    const idx = this._hidden.findIndex(e => e.win === win);
    if (idx !== -1) {
      this._hidden.splice(idx, 1);
      this._updateBadge();
    }
  }

  // ── HELPERS ─────────────────────────────────────────────────
  getHiddenWindows() {
    return [...this._hidden];
  }

  _getAppName(win) {
    try {
      const app = Shell.WindowTracker.get_default().get_window_app(win);
      if (app) return app.get_name();
    } catch (_) {}
    return win.get_wm_class() || 'Janela';
  }

  _updateBadge() {
    this._indicator?.updateBadge(this._hidden.length);
  }
}
