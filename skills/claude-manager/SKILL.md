---
name: claude-manager
description: Install and launch Claude Manager — a desktop UI for managing skills, agents, plugins, and agent teams
disable-model-invocation: true
---

Install and launch the Claude Manager desktop app. Detects your platform, downloads the correct pre-built binary from GitHub releases, and opens it. Falls back to building from source if no binary is available.

## Instructions

Run the following steps in order using the Bash tool. Adapt paths for the detected OS.

### Step 1: Detect platform and set variables

```bash
OS="$(uname -s)"
ARCH="$(uname -m)"
INSTALL_DIR="$HOME/.claude/claude-manager"
REPO="dcaponi/claude-manager"
mkdir -p "$INSTALL_DIR"

if [ "$OS" = "Darwin" ]; then
  PLATFORM="mac"
  BINARY_NAME="Claude Manager.app"
  ASSET_PATTERN="*.dmg"
elif echo "$OS" | grep -qi "MINGW\|MSYS\|CYGWIN\|Windows_NT"; then
  PLATFORM="win"
  BINARY_NAME="Claude Manager.exe"
  ASSET_PATTERN="*.exe"
else
  echo "Unsupported platform: $OS"
  echo "Claude Manager supports macOS and Windows."
  exit 1
fi
echo "Platform: $PLATFORM ($ARCH)"
```

### Step 2: Try to download pre-built binary

```bash
# Check if we already have it installed
if [ "$PLATFORM" = "mac" ] && [ -d "$INSTALL_DIR/Claude Manager.app" ]; then
  echo "Claude Manager already installed. Launching..."
  open "$INSTALL_DIR/Claude Manager.app"
  exit 0
elif [ "$PLATFORM" = "win" ] && [ -f "$INSTALL_DIR/Claude Manager.exe" ]; then
  echo "Claude Manager already installed. Launching..."
  start "" "$INSTALL_DIR/Claude Manager.exe"
  exit 0
fi

# Try downloading latest release
echo "Downloading Claude Manager..."
LATEST_URL=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep "browser_download_url" | grep -i "$PLATFORM" | grep -i "zip" | head -1 | cut -d '"' -f 4)

if [ -n "$LATEST_URL" ]; then
  echo "Found release: $LATEST_URL"
  curl -L -o "$INSTALL_DIR/claude-manager.zip" "$LATEST_URL"
  cd "$INSTALL_DIR"
  unzip -o claude-manager.zip
  rm claude-manager.zip
  echo "Downloaded successfully."

  if [ "$PLATFORM" = "mac" ]; then
    # Remove quarantine attribute
    xattr -rd com.apple.quarantine "$INSTALL_DIR/Claude Manager.app" 2>/dev/null || true
    open "$INSTALL_DIR/Claude Manager.app"
  else
    start "" "$INSTALL_DIR/Claude Manager.exe"
  fi
  echo "Claude Manager launched!"
  exit 0
else
  echo "No pre-built binary found. Building from source..."
fi
```

### Step 3: Build from source (fallback)

If no binary was available, clone and build from source. Install Node.js first if not present.

```bash
# Check for Node.js
if ! command -v node &>/dev/null; then
  echo "Node.js not found. Installing..."
  if [ "$PLATFORM" = "mac" ]; then
    # Try Homebrew first, then direct download
    if command -v brew &>/dev/null; then
      brew install node
    else
      echo "Installing Node.js via official installer..."
      curl -o "$INSTALL_DIR/node-installer.pkg" "https://nodejs.org/dist/v20.18.0/node-v20.18.0.pkg"
      sudo installer -pkg "$INSTALL_DIR/node-installer.pkg" -target /
      rm "$INSTALL_DIR/node-installer.pkg"
    fi
  else
    # Windows: download and run installer
    echo "Please install Node.js from https://nodejs.org/ and re-run this skill."
    echo "Or run: winget install OpenJS.NodeJS.LTS"
    exit 1
  fi
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
```

```bash
# Clone and build
SOURCE_DIR="$INSTALL_DIR/source"
if [ -d "$SOURCE_DIR/.git" ]; then
  cd "$SOURCE_DIR"
  git pull
else
  git clone "https://github.com/dcaponi/claude-manager.git" "$SOURCE_DIR"
  cd "$SOURCE_DIR"
fi

npm ci
npm run build

echo ""
echo "Build complete!"

# Launch from build output
if [ "$PLATFORM" = "mac" ]; then
  open release/mac*/Claude\ Manager.app 2>/dev/null || open release/*/Claude\ Manager.app
else
  start "" "release/win-unpacked/Claude Manager.exe" 2>/dev/null
fi

echo "Claude Manager launched!"
```

### Step 4: Confirm success

Tell the user:
- Claude Manager is now installed at `~/.claude/claude-manager/`
- They can re-launch anytime with `/claude-manager`
- The app reads/writes the same files Claude Code uses natively — no sync needed
- Go to Settings in the app to verify the Claude Code CLI connection
