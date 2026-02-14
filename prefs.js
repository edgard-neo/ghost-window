/**
 * Ghost Window — Preferences
 * Settings panel accessible via gnome-extensions prefs
 */

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class GhostWindowPrefs extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    window.set_default_size(520, 420);
    window.set_title('Ghost Window');

    // ── Main page ─────────────────────────────────────────────
    const page = new Adw.PreferencesPage({
      title: 'Settings',
      icon_name: 'preferences-system-symbolic',
    });
    window.add(page);

    // ── Group: Shortcuts ──────────────────────────────────────
    const group = new Adw.PreferencesGroup({
      title: '⌨️  Keyboard Shortcuts',
      description: 'Customize the shortcuts to hide and release windows.',
    });
    page.add(group);

    // Hide shortcut
    const hideRow = new Adw.ActionRow({
      title: 'Hide active window',
      subtitle: 'Removes the window from Alt+Tab and Overview',
    });
    const hideEntry = new Gtk.Entry({
      text: settings.get_strv('hide-shortcut')[0] || '<Control><Alt>j',
      valign: Gtk.Align.CENTER,
      width_chars: 20,
    });
    hideEntry.connect('changed', () => {
      settings.set_strv('hide-shortcut', [hideEntry.get_text()]);
    });
    hideRow.add_suffix(hideEntry);
    group.add(hideRow);

    // Release shortcut
    const restoreRow = new Adw.ActionRow({
      title: 'Open hidden windows list',
      subtitle: 'Opens the panel menu to release hidden windows',
    });
    const restoreEntry = new Gtk.Entry({
      text: settings.get_strv('restore-shortcut')[0] || '<Control><Alt>k',
      valign: Gtk.Align.CENTER,
      width_chars: 20,
    });
    restoreEntry.connect('changed', () => {
      settings.set_strv('restore-shortcut', [restoreEntry.get_text()]);
    });
    restoreRow.add_suffix(restoreEntry);
    group.add(restoreRow);

    // ── Group: How to use ─────────────────────────────────────
    const infoGroup = new Adw.PreferencesGroup({
      title: '📖  How to use',
    });
    page.add(infoGroup);

    const steps = [
      ['1.', 'Open Chrome with YouTube playing'],
      ['2.', 'Press Ctrl+Alt+J to hide the window'],
      ['3.', 'Chrome disappears from Alt+Tab and Overview'],
      ['4.', 'Audio/video keeps playing normally'],
      ['5.', 'Click 👻 in the panel or press Ctrl+Alt+K to release'],
    ];

    steps.forEach(([num, text]) => {
      const row = new Adw.ActionRow({
        title: `${num}  ${text}`,
        selectable: false,
      });
      infoGroup.add(row);
    });

    // ── Group: Shortcut format ────────────────────────────────
    const fmtGroup = new Adw.PreferencesGroup({
      title: '💡  Shortcut format',
      description: 'Use the GLib key format to type shortcuts manually.',
    });
    page.add(fmtGroup);

    const examples = [
      ['<Control><Alt>j', 'Ctrl + Alt + J'],
      ['<Control><Alt>k', 'Ctrl + Alt + K'],
      ['<Super>h', 'Super + H'],
      ['<Control><Alt>h', 'Ctrl + Alt + H'],
    ];

    examples.forEach(([key, label]) => {
      const row = new Adw.ActionRow({
        title: label,
        subtitle: key,
        selectable: false,
      });
      fmtGroup.add(row);
    });
  }
}
