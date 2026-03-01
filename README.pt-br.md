<p align="right">
  <a href="README.md">🇺🇸 English</a> &nbsp;|&nbsp;
  <a href="README.pt-br.md">🇧🇷 Português</a>
</p>

# 👻 Ghost Window

> **Uma extensão para GNOME que faz qualquer janela desaparecer — sem fechar o programa.**

<p align="center">
  <img src="https://img.shields.io/badge/GNOME_Shell-45%20%7C%2046%20%7C%2047-4A86CF?style=flat-square&logo=gnome&logoColor=white"/>
  <img src="https://img.shields.io/badge/Wayland-✓-brightgreen?style=flat-square"/>
  <img src="https://img.shields.io/badge/X11-✓-brightgreen?style=flat-square"/>
  <img src="https://img.shields.io/badge/license-GPL--3.0-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/maintained-yes-success?style=flat-square"/>
</p>

---

## 💡 O Problema Que Ele Resolve

Você está ouvindo música no YouTube, baixando um arquivo grande ou rodando uma compilação demorada — mas a janela fica entupindo seu Alt+Tab e espaço de trabalho.

Você não quer fechar. Você só não quer ver.

**Ghost Window resolve exatamente isso.**

---

## ✨ O Que Ele Faz

Aperta um atalho → a janela some da tela, do Alt+Tab e do Dock.

O programa **continua rodando normalmente em segundo plano** — áudio toca, downloads continuam, processos seguem. Você traz de volta a qualquer momento com um clique ou atalho.

Pense nisso como colocar uma janela no "modo fantasma".

![Preview](assets/image.png)

---

## 🎯 Exemplos do Dia a Dia

| Situação                             | O que você faz                           |
| ------------------------------------ | ---------------------------------------- |
| YouTube tocando enquanto trabalha    | Esconde o navegador, o áudio continua    |
| Download ou build demorado rodando   | Esconde o terminal, ele continua rodando |
| App que você vai precisar mais tarde | Esconde, restaura com um clique          |

---

## 🚀 Como Instalar

**Requisitos:** Linux com GNOME Shell 45, 46 ou 47 (Ubuntu, Fedora, Zorin OS, etc.)

```bash
# 1. Baixe o projeto
git clone https://github.com/edgard-neo/ghost-window.git
cd ghost-window

# 2. Execute o instalador
chmod +x install.sh
./install.sh

# 3. Saia e entre novamente na sessão (necessário no Wayland)
gnome-session-quit --logout --no-prompt

# 4. Ative a extensão
gnome-extensions enable ghost-window@ghostwindow.local
```

---

## ⌨️ Atalhos

| Atalho           | O que faz                  |
| ---------------- | -------------------------- |
| `Ctrl + Alt + J` | Esconde a janela em foco   |
| `Ctrl + Alt + K` | Abre o menu de restauração |
| Clique no 👻     | Abre o menu de restauração |

> Quer mudar os atalhos? Execute: `gnome-extensions prefs ghost-window@ghostwindow.local`

---

## 🔄 Uso no Dia a Dia

```
1. Abra o Chrome com o YouTube
2. Pressione Ctrl+Alt+J
   → O Chrome some do Alt+Tab e do Overview
   → A música continua tocando

3. Para trazer de volta:
   → Clique no 👻 na barra do topo
   → Ou pressione Ctrl+Alt+K
   → Clique no nome do app

4. Para desativar o Ghost Window:
   → Clique no 👻 → "⏻ Disable Ghost Window"
   → Todas as janelas escondidas voltam automaticamente
```

---

## 🔧 Como Funciona por Dentro

> _Para desenvolvedores e curiosos — pode pular se só quiser usar._

O Ghost Window usa dois ganchos da API JavaScript do GNOME Shell:

- **`window.minimize()`** — esconde a janela da tela (funciona no Wayland e no X11)
- **Override de `get_tab_list()`** — intercepta o construtor do Alt+Tab do GNOME e filtra as janelas escondidas antes de exibi-las

Quando a extensão é desativada, os dois ganchos são removidos e todas as janelas são restauradas automaticamente.

---

## 🐛 Problemas Comuns

**Extensão aparece como INATIVA após instalar**
→ Você precisa sair e entrar novamente na sessão. No Wayland, o shell não recarrega automaticamente.

**Atalho não funciona**

```bash
journalctl -b -o cat /usr/bin/gnome-shell 2>/dev/null | grep -i ghost
```

**Janela ainda aparece no Alt+Tab**
→ Faça logout e login completo após instalar. O patch do Alt+Tab só ativa em uma sessão nova.

---

## 📋 Limitações Conhecidas

| Limitação                                         | Status                                 |
| ------------------------------------------------- | -------------------------------------- |
| Wayland exige logout após instalar                | Por design (limitação do GNOME)        |
| Janelas podem aparecer nas miniaturas do Overview | Correção planejada                     |
| Notificações de apps escondidos ainda aparecem    | Esperado — o processo continua rodando |

---

## 🤝 Contribuindo

```bash
git clone https://github.com/edgard-neo/ghost-window.git
cd ghost-window
./install.sh

# Acompanhe os logs em tempo real durante o desenvolvimento
journalctl -f -o cat /usr/bin/gnome-shell 2>/dev/null | grep GhostWindow

# Após mudanças no Wayland: logout + login
# Após mudanças no X11: Alt+F2 → digite 'r' → Enter
```

---

## 📜 Licença

GNU General Public License v3.0 — veja [LICENSE](LICENSE).
