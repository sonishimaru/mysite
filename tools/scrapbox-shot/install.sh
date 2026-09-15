#!/bin/bash
#
# Link scrapbox-shot into ~/.local/bin and ~/.hammerspoon, and seed the config
# file. Re-running is safe: it never overwrites an existing config.

set -uo pipefail

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
BIN_DIR="$HOME/.local/bin"
HS_DIR="$HOME/.hammerspoon"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/scrapbox-shot"

mkdir -p "$BIN_DIR" "$HS_DIR" "$CONFIG_DIR" || exit 1

chmod +x "$SRC_DIR/bin/scrapbox-shot"
ln -sfn "$SRC_DIR/bin/scrapbox-shot" "$BIN_DIR/scrapbox-shot"
echo "linked $BIN_DIR/scrapbox-shot"

ln -sfn "$SRC_DIR/hammerspoon/scrapbox-shot.lua" "$HS_DIR/scrapbox-shot.lua"
echo "linked $HS_DIR/scrapbox-shot.lua"

if [ -f "$CONFIG_DIR/config" ]; then
  echo "kept existing $CONFIG_DIR/config"
else
  cp "$SRC_DIR/config.example" "$CONFIG_DIR/config"
  chmod 600 "$CONFIG_DIR/config"
  echo "created $CONFIG_DIR/config - fill in SCRAPBOX_PROJECT and GYAZO_ACCESS_TOKEN"
fi

cat <<'EOF'

Next:
  1. Edit the config file above.
  2. Add to ~/.hammerspoon/init.lua:

       local scrapboxShot = dofile(os.getenv("HOME") .. "/.hammerspoon/scrapbox-shot.lua")
       scrapboxShot.start()

  3. Reload the Hammerspoon config, then double-tap Cmd.
EOF
