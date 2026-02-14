/**
 * Ghost Window — Preferences
 * Painel de configurações acessível em gnome-extensions prefs
 */

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class GhostWindowPrefs extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    window.set_default_size(520, 400);
    window.set_title('Ghost Window');

    // ── Página principal ──────────────────────────────────────
    const page = new Adw.PreferencesPage({
      title: 'Configurações',
      icon_name: 'preferences-system-symbolic',
    });
    window.add(page);

    // ── Grupo: Atalhos ────────────────────────────────────────
    const group = new Adw.PreferencesGroup({
      title: '⌨️  Atalhos de Teclado',
      description: 'Personalize os atalhos para esconder e restaurar janelas.',
    });
    page.add(group);

    // Atalho: esconder
    const hideRow = new Adw.ActionRow({
      title: 'Esconder janela ativa',
      subtitle: 'Remove a janela do Alt+Tab e do Overview',
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

    // Atalho: restaurar (menu)
    const restoreRow = new Adw.ActionRow({
      title: 'Abrir lista de janelas escondidas',
      subtitle: 'Abre o menu no painel para restaurar janelas',
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

    // ── Grupo: Info ───────────────────────────────────────────
    const infoGroup = new Adw.PreferencesGroup({
      title: '📖  Como usar',
    });
    page.add(infoGroup);

    const steps = [
      ['1.', 'Abra o Chrome com o YouTube tocando'],
      ['2.', 'Pressione Super+` (crase) para esconder o Chrome'],
      ['3.', 'O Chrome some do Alt+Tab e do Overview'],
      ['4.', 'O áudio/vídeo continua rodando normalmente'],
      [
        '5.',
        'Clique no 👻 no painel ou pressione Super+Shift+` para restaurar',
      ],
    ];

    steps.forEach(([num, text]) => {
      const row = new Adw.ActionRow({
        title: `${num}  ${text}`,
        selectable: false,
      });
      infoGroup.add(row);
    });

    // ── Grupo: Formato dos atalhos ────────────────────────────
    const fmtGroup = new Adw.PreferencesGroup({
      title: '💡  Formato dos atalhos',
      description: 'Use o formato GLib para digitar atalhos manualmente.',
    });
    page.add(fmtGroup);

    const examples = [
      ['<Super>grave', 'Super + ` (crase)'],
      ['<Super><Shift>grave', 'Super + Shift + `'],
      ['<Super>h', 'Super + H'],
      ['<Ctrl><Alt>h', 'Ctrl + Alt + H'],
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
