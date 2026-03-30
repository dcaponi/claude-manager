---
name: claude-manager
description: Install and launch Claude Manager — a desktop UI for managing skills, agents, plugins, and agent teams
disable-model-invocation: true
---

Launch the Claude Manager desktop app. If not installed, install it first.

## Instructions

**IMPORTANT: Run Step 1 FIRST and check the output. Only proceed to Step 2 if Step 1 says "NOT INSTALLED".**

### Step 1: Check if installed and launch

Run this single command. If it prints "LAUNCHED", you are done — do NOT run any further steps. Only continue to Step 2 if it prints "NOT INSTALLED".

```bash
INSTALL_DIR="$HOME/.claude/claude-manager"
OS="$(uname -s)"

if [ "$OS" = "Darwin" ] && [ -d "$INSTALL_DIR/Claude Manager.app" ]; then
  open "$INSTALL_DIR/Claude Manager.app"
  echo "LAUNCHED"
elif echo "$OS" | grep -qi "MINGW\|MSYS\|CYGWIN\|Windows_NT" && [ -f "$INSTALL_DIR/Claude Manager.exe" ]; then
  start "" "$INSTALL_DIR/Claude Manager.exe"
  echo "LAUNCHED"
else
  echo "NOT INSTALLED"
fi
```

If the output is "LAUNCHED", tell the user Claude Manager is running and stop. Do not proceed to Step 2.

### Step 2: Install (only if Step 1 printed "NOT INSTALLED")

```bash
OS="$(uname -s)"
INSTALL_DIR="$HOME/.claude/claude-manager"
REPO="dcaponi/claude-manager"
mkdir -p "$INSTALL_DIR"

if [ "$OS" = "Darwin" ]; then
  PLATFORM="mac"
elif echo "$OS" | grep -qi "MINGW\|MSYS\|CYGWIN\|Windows_NT"; then
  PLATFORM="win"
else
  echo "Unsupported platform: $OS"
  exit 1
fi

# Try downloading latest release
LATEST_URL=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep "browser_download_url" | grep -i "$PLATFORM" | grep -i "zip" | head -1 | cut -d '"' -f 4)

if [ -n "$LATEST_URL" ]; then
  echo "Downloading from release..."
  curl -L -o "$INSTALL_DIR/claude-manager.zip" "$LATEST_URL"
  cd "$INSTALL_DIR"
  unzip -o claude-manager.zip
  rm claude-manager.zip
  if [ "$PLATFORM" = "mac" ]; then
    xattr -rd com.apple.quarantine "$INSTALL_DIR/Claude Manager.app" 2>/dev/null || true
    open "$INSTALL_DIR/Claude Manager.app"
  else
    start "" "$INSTALL_DIR/Claude Manager.exe"
  fi
  echo "LAUNCHED"
else
  echo "NEEDS BUILD"
fi
```

If the output is "LAUNCHED", tell the user Claude Manager is installed and running. Stop here. Only continue to Step 3 if it printed "NEEDS BUILD".

### Step 3: Build from source (only if Step 2 printed "NEEDS BUILD")

```bash
INSTALL_DIR="$HOME/.claude/claude-manager"
OS="$(uname -s)"
PLATFORM="mac"
[ "$OS" != "Darwin" ] && PLATFORM="win"

if ! command -v node &>/dev/null; then
  if command -v brew &>/dev/null; then brew install node
  else echo "Please install Node.js from https://nodejs.org/ and re-run."; exit 1; fi
fi

SOURCE_DIR="$INSTALL_DIR/source"
if [ -d "$SOURCE_DIR/.git" ]; then cd "$SOURCE_DIR" && git pull
else git clone "https://github.com/dcaponi/claude-manager.git" "$SOURCE_DIR" && cd "$SOURCE_DIR"; fi

npm ci && npm run build

if [ "$PLATFORM" = "mac" ]; then
  cp -r release/mac-universal/Claude\ Manager.app "$INSTALL_DIR/" 2>/dev/null || cp -r release/mac*/Claude\ Manager.app "$INSTALL_DIR/" 2>/dev/null
  xattr -rd com.apple.quarantine "$INSTALL_DIR/Claude Manager.app" 2>/dev/null || true
  open "$INSTALL_DIR/Claude Manager.app"
else
  start "" "release/win-unpacked/Claude Manager.exe" 2>/dev/null
fi
echo "LAUNCHED"
```

### After launching

Tell the user:
- Claude Manager is running
- Re-launch anytime with `/claude-manager`
- The app reads/writes the same files Claude Code uses natively
