<p align="right">
  <a href="README.md">🇺🇸 English</a> &nbsp;|&nbsp;
  <a href="README.pt-br.md">🇧🇷 Português</a>
</p>

<div align="center">

# 👻 Ghost Window

**Conceal any window from your screen, Taskbar/Dock, Alt+Tab, and Overview — without closing it.**

[![GNOME Shell](https://img.shields.io/badge/GNOME_Shell-45%20%7C%2046%20%7C%2047-4A86CF?style=flat-square&logo=gnome&logoColor=white)](https://extensions.gnome.org)
[![Wayland](https://img.shields.io/badge/Wayland-supported-success?style=flat-square)](#)
[![X11](https://img.shields.io/badge/X11-supported-success?style=flat-square)](#)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue?style=flat-square)](LICENSE)

<br/>

![Ghost Window Preview](assets/image.png)

</div>

---

## ⚡ Features

- **Conceal on demand:** Press `Ctrl + Alt + J` to instantly hide the focused window.
- **🚨 Boss Key / Panic Mode:** Press `Ctrl + Alt + Escape` to conceal all open windows in one tap.
- **Background persistence:** Audio, downloads, and processes keep running silently.
- **Complete invisibility:** Excluded from `Alt + Tab`, Taskbar (Dash / Dock / Panels), and the GNOME Overview (`Super` key).
- **Top Panel Menu:** Restore individual windows, restore all at once, or close them directly.
- **Interactive Libadwaita Preferences:** Click to record your custom shortcuts with native key detection.

---

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/edgard-neo/ghost-window.git
cd ghost-window
make install
```

*(Alternatively, run `./install.sh`)*

### 2. Restart GNOME Shell

- **Wayland:** Log out and log back in.
- **X11:** Press `Alt + F2`, type `r`, and press `Enter`.

### 3. Enable Extension

```bash
make enable
# or: gnome-extensions enable ghost-window@ghostwindow.local
```

---

## ⌨️ Default Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>J</kbd> | Conceal active window |
| <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Escape</kbd> | **Panic Mode:** Conceal all open windows |
| <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>K</kbd> | Open restore menu in top panel |
| Click **👻** | Open restore menu in top panel |

> **Change shortcuts:** Open the extension preferences via `make prefs` or `gnome-extensions prefs ghost-window@ghostwindow.local`. Click any shortcut button to record a new key combination!

---

## 🛠️ Project Commands

This project includes a standard `Makefile` for developer convenience:

| Command | Description |
| :--- | :--- |
| `make install` | Compiles schemas and installs to user extension directory |
| `make pack` | Builds distribution `.zip` for [extensions.gnome.org](https://extensions.gnome.org) |
| `make enable` | Enables the extension |
| `make disable` | Disables the extension and restores all windows |
| `make prefs` | Opens the Libadwaita settings dialog |
| `make clean` | Removes compiled schemas and package artifacts |
| `make uninstall` | Removes the extension from the system |

---

## 🔍 How It Works

1. **Minimization Hook:** When hidden, the window is minimized using Mutter's API.
2. **Alt+Tab Filter:** Ghost Window intercepts GNOME's `get_tab_list` switcher filter to exclude concealed windows from the switcher list.
3. **Overview Exclusion:** Patches GNOME Shell's `Workspace` window inclusion logic so concealed windows never appear in Activities/Overview thumbnails.
4. **Notification Guard:** Prevents minimized apps from un-hiding themselves when demanding attention.
5. **Auto-Cleanup:** If a background process terminates, its entry is automatically pruned from the indicator list.

---

## 📜 License

Distributed under the **GNU General Public License v3.0**. See [LICENSE](LICENSE) for details.
