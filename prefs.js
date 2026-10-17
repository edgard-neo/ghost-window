/**
 * Ghost Window — Preferences
 * Modern Libadwaita Preferences Window with Interactive Shortcut Recorder
 */

import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const SCHEMA_KEY_HIDE = 'hide-shortcut';
const SCHEMA_KEY_RESTORE = 'restore-shortcut';
const SCHEMA_KEY_PANIC = 'panic-shortcut';

const DEFAULT_HIDE_SHORTCUT = '<Control><Alt>j';
const DEFAULT_RESTORE_SHORTCUT = '<Control><Alt>k';
const DEFAULT_PANIC_SHORTCUT = '<Control><Alt>Escape';

const PRESET_SHORTCUTS = [
  { key: '<Control><Alt>j',      label: 'Ctrl + Alt + J (Default Conceal)' },
  { key: '<Control><Alt>Escape', label: 'Ctrl + Alt + Esc (Default Panic)' },
  { key: '<Control><Alt>h',      label: 'Ctrl + Alt + H' },
  { key: '<Super>grave',         label: 'Super + ` (Backtick)' },
  { key: '<Super>h',             label: 'Super + H' },
];

const USAGE_STEPS = [
  'Conceal Active: Press Ctrl+Alt+J to instantly hide the focused window.',
  'Panic Mode: Press Ctrl+Alt+Escape to conceal all visible windows at once.',
  'Zero Traces: Windows vanish from screen, Alt+Tab, and the GNOME Overview.',
  'Restore Anytime: Click the 👻 icon in the top panel or press Ctrl+Alt+K.',
];

const MODIFIER_KEYVALS = [
  Gdk.KEY_Control_L, Gdk.KEY_Control_R,
  Gdk.KEY_Alt_L, Gdk.KEY_Alt_R,
  Gdk.KEY_Shift_L, Gdk.KEY_Shift_R,
  Gdk.KEY_Super_L, Gdk.KEY_Super_R,
  Gdk.KEY_Meta_L, Gdk.KEY_Meta_R,
  Gdk.KEY_ISO_Level3_Shift,
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Interactive Shortcut Recorder Row
// ─────────────────────────────────────────────────────────────────────────────
function createShortcutRow({ title, subtitle, schemaKey, defaultValue, settings, parentWindow }) {
  const row = new Adw.ActionRow({
    title,
    subtitle: subtitle || `Default: ${defaultValue}`,
  });

  const getSavedShortcut = () => {
    const list = settings.get_strv(schemaKey);
    return list.length > 0 ? list[0] : defaultValue;
  };

  const shortcutLabel = new Gtk.ShortcutLabel({
    accelerator: getSavedShortcut(),
    valign: Gtk.Align.CENTER,
  });

  const shortcutButton = new Gtk.Button({
    child: shortcutLabel,
    valign: Gtk.Align.CENTER,
    css_classes: ['flat'],
    tooltip_text: 'Click to record a new shortcut',
  });

  let keyController = null;

  const stopRecording = () => {
    if (keyController) {
      parentWindow.remove_controller(keyController);
      keyController = null;
    }
    shortcutButton.remove_css_class('suggested-action');
    shortcutButton.set_child(shortcutLabel);
    shortcutLabel.accelerator = getSavedShortcut();
  };

  const startRecording = () => {
    shortcutButton.add_css_class('suggested-action');
    const recordingLabel = new Gtk.Label({
      label: 'Press keys... (Esc to cancel)',
      valign: Gtk.Align.CENTER,
    });
    shortcutButton.set_child(recordingLabel);

    keyController = new Gtk.EventControllerKey();
    keyController.connect('key-pressed', (_controller, keyval, _keycode, state) => {
      // 1. Cancel on Escape
      if (keyval === Gdk.KEY_Escape) {
        stopRecording();
        return Gdk.EVENT_STOP;
      }

      // 2. Clear on Backspace
      if (keyval === Gdk.KEY_BackSpace) {
        settings.set_strv(schemaKey, []);
        stopRecording();
        return Gdk.EVENT_STOP;
      }

      // 3. Ignore pure modifier key presses (wait for the rest of combo)
      if (MODIFIER_KEYVALS.includes(keyval)) {
        return Gdk.EVENT_STOP;
      }

      // 4. Validate and save combination
      const mask = state & Gtk.accelerator_get_default_mod_mask();
      if (Gtk.accelerator_valid(keyval, mask)) {
        const acceleratorName = Gtk.accelerator_name(keyval, mask);
        settings.set_strv(schemaKey, [acceleratorName]);
        stopRecording();
        return Gdk.EVENT_STOP;
      }

      return Gdk.EVENT_PROPAGATE;
    });

    parentWindow.add_controller(keyController);
  };

  shortcutButton.connect('clicked', () => {
    if (keyController) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  // Reset button to restore default
  const resetButton = new Gtk.Button({
    icon_name: 'edit-clear-symbolic',
    valign: Gtk.Align.CENTER,
    css_classes: ['flat'],
    tooltip_text: `Reset to default (${defaultValue})`,
  });
  resetButton.connect('clicked', () => {
    if (keyController) stopRecording();
    settings.set_strv(schemaKey, [defaultValue]);
    shortcutLabel.accelerator = defaultValue;
  });

  // Keep label updated if setting changes externally
  settings.connect(`changed::${schemaKey}`, () => {
    if (!keyController) {
      shortcutLabel.accelerator = getSavedShortcut();
    }
  });

  row.add_suffix(shortcutButton);
  row.add_suffix(resetButton);

  return { row, setShortcut: (val) => settings.set_strv(schemaKey, [val]) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Preferences Window Implementation
// ─────────────────────────────────────────────────────────────────────────────
export default class GhostWindowPrefs extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    window.set_default_size(560, 560);
    window.set_title('Ghost Window');

    // ── Main Page ───────────────────────────────────────────────────────────
    const page = new Adw.PreferencesPage({
      title: 'General',
      icon_name: 'preferences-system-symbolic',
    });
    window.add(page);

    // ── Shortcuts Group ──────────────────────────────────────────────────────
    const shortcutsGroup = new Adw.PreferencesGroup({
      title: 'Keyboard Shortcuts',
      description: 'Click any shortcut button to record your custom key combination.',
    });
    page.add(shortcutsGroup);

    // 1. Conceal active window
    const hideRowData = createShortcutRow({
      title: 'Conceal active window',
      subtitle: `Default: ${DEFAULT_HIDE_SHORTCUT}`,
      schemaKey: SCHEMA_KEY_HIDE,
      defaultValue: DEFAULT_HIDE_SHORTCUT,
      settings,
      parentWindow: window,
    });
    shortcutsGroup.add(hideRowData.row);

    // 2. Panic mode (conceal all)
    const panicRowData = createShortcutRow({
      title: 'Panic Mode (Conceal all)',
      subtitle: `Default: ${DEFAULT_PANIC_SHORTCUT}`,
      schemaKey: SCHEMA_KEY_PANIC,
      defaultValue: DEFAULT_PANIC_SHORTCUT,
      settings,
      parentWindow: window,
    });
    shortcutsGroup.add(panicRowData.row);

    // 3. Restore menu
    const restoreRowData = createShortcutRow({
      title: 'Open restore menu',
      subtitle: `Default: ${DEFAULT_RESTORE_SHORTCUT}`,
      schemaKey: SCHEMA_KEY_RESTORE,
      defaultValue: DEFAULT_RESTORE_SHORTCUT,
      settings,
      parentWindow: window,
    });
    shortcutsGroup.add(restoreRowData.row);

    // ── Quick Presets Group ──────────────────────────────────────────────────
    const presetsGroup = new Adw.PreferencesGroup({
      title: 'Popular Presets',
      description: 'Quickly assign common key combinations to conceal windows.',
    });
    page.add(presetsGroup);

    PRESET_SHORTCUTS.forEach(({ key, label }) => {
      const presetRow = new Adw.ActionRow({
        title: label,
        subtitle: key,
      });

      const applyButton = new Gtk.Button({
        label: 'Apply to Conceal',
        valign: Gtk.Align.CENTER,
      });
      applyButton.connect('clicked', () => {
        hideRowData.setShortcut(key);
      });

      presetRow.add_suffix(applyButton);
      presetsGroup.add(presetRow);
    });

    // ── How It Works Group ───────────────────────────────────────────────────
    const infoGroup = new Adw.PreferencesGroup({
      title: 'How It Works',
      description: 'Run background media, builds, or tasks without visual clutter.',
    });
    page.add(infoGroup);

    USAGE_STEPS.forEach((stepText, index) => {
      const stepRow = new Adw.ActionRow({
        title: `${index + 1}.  ${stepText}`,
        selectable: false,
      });
      infoGroup.add(stepRow);
    });
  }
}
