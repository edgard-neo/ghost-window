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
      const title = new PopupMenu.PopupMenuItem('', { reactive: false });
      title.label.set_text('👻 Janelas Escondidas');
      title.label.set_style('font-weight:bold;color:#aaa;font-size:11px;');
      this.menu.addMenuItem(title);

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      this._section = new PopupMenu.PopupMenuSection();
      this.menu.addMenuItem(this._section);

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      const restoreAll = this.menu.addAction('Mostrar todas', () => {
        this._ext.restoreAll();
        this.menu.close();
      });
      restoreAll.label.set_style('color:#7ecfff;');

      const hint = new PopupMenu.PopupMenuItem('', { reactive: false });
      hint.label.set_text('Ctrl+Alt+J esconde  ·  Ctrl+Alt+K restaura');
      hint.label.set_style('font-size:9px;color:#555;');
      this.menu.addMenuItem(hint);

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      const disable = this.menu.addAction('⏻  Desativar Ghost Window', () => {
        this.menu.close();
        this._ext.restoreAll();
        Main.extensionManager.disableExtension(
          'ghost-window@ghostwindow.local'
        );
      });
      disable.label.set_style('color:#ff6b6b;');
    }

    _refreshMenu() {
      this._section.removeAll();
      const hidden = this._ext.getHiddenWindows();

      if (hidden.length === 0) {
        const empty = new PopupMenu.PopupMenuItem('Nenhuma janela escondida', {
          reactive: false,
        });
        empty.label.set_style('color:#555;font-style:italic;');
        this._section.addMenuItem(empty);
        return;
      }

      hidden.forEach(({ win, appName, title }) => {
        const label = `${appName}${title ? ' — ' + title.slice(0, 28) : ''}`;
        const item = this._section.addAction(label, () => {
          this._ext.restoreWindow(win);
          this.menu.close();
        });
        item.label.set_style('max-width:220px;');
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

    console.log('[GhostWindow] ativado');
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

    console.log('[GhostWindow] desativado');
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
      Main.notify(`👻 ${appName}`, 'Escondido — Ctrl+Alt+K para restaurar');
    } catch (_) {}
    console.log(`[GhostWindow] escondeu: ${appName}`);
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
    console.log(`[GhostWindow] restaurou: ${appName}`);
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
