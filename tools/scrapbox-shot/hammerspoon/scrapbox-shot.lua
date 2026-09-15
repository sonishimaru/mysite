-- scrapbox-shot.lua - fire `scrapbox-shot` on a double-tap of a bare modifier
-- key (⌘⌘ by default).
--
--   local scrapboxShot = dofile(os.getenv("HOME") .. "/.hammerspoon/scrapbox-shot.lua")
--   scrapboxShot.start()
--
-- A tap only counts when the modifier is pressed and released on its own: no
-- other modifier held, and no key pressed while it was down. That keeps ⌘C ⌘C,
-- ⌘⇧4 and friends from triggering a capture.

local M = {}

M.scriptPath = os.getenv("HOME") .. "/.local/bin/scrapbox-shot"
M.modifier = "cmd"            -- "cmd" | "alt" | "ctrl" | "shift"
M.doubleTapInterval = 0.4     -- seconds between the two taps
M.captureMode = nil           -- nil = whatever the config file says
M.showAlerts = true

local OTHER_MODIFIERS = { cmd = true, alt = true, ctrl = true, shift = true, fn = true }

local watcher = nil
local armed = false           -- modifier is down, alone, and unspoiled so far
local modifierDown = false
local lastTapAt = 0

local function alert(msg)
  if M.showAlerts then hs.alert.show(msg) end
end

local function otherModifierHeld(flags)
  for name in pairs(OTHER_MODIFIERS) do
    if name ~= M.modifier and flags[name] then return true end
  end
  return false
end

local function run()
  local args = {}

  if M.captureMode then
    table.insert(args, "--mode")
    table.insert(args, M.captureMode)
  end

  -- Read the front window before the capture starts, so the page records where
  -- the shot came from rather than where the crosshair ended up.
  local win = hs.window.frontmostWindow()
  if win then
    local app = win:application()
    if app and app:name() then
      table.insert(args, "--app")
      table.insert(args, app:name())
    end
    local title = win:title()
    if title and title ~= "" then
      table.insert(args, "--window")
      table.insert(args, title)
    end
  end

  local task = hs.task.new(M.scriptPath, function(code, stdout, stderr)
    if code == 0 then
      alert("Scrapbox: " .. (stdout or ""):gsub("%s+$", ""))
    elseif code == 2 then
      -- capture cancelled; stay quiet
    else
      local msg = (stderr ~= "" and stderr or stdout) or "unknown error"
      alert("scrapbox-shot failed\n" .. msg:gsub("%s+$", ""))
    end
  end, args)

  if not task then
    alert("scrapbox-shot not found at " .. M.scriptPath)
    return
  end
  task:start()
end

local function handle(event)
  local types = hs.eventtap.event.types

  if event:getType() == types.keyDown then
    -- A real shortcut was typed while the modifier was down.
    armed = false
    return false
  end

  local flags = event:getFlags()

  if flags[M.modifier] then
    if not modifierDown then
      modifierDown = true
      armed = not otherModifierHeld(flags)
    elseif otherModifierHeld(flags) then
      -- Another modifier joined mid-press. Releasing it again must not re-arm
      -- this press, so stay disarmed until the modifier itself comes up.
      armed = false
    end
    return false
  end

  -- The modifier just came up.
  modifierDown = false
  if armed then
    armed = false
    local now = hs.timer.secondsSinceEpoch()
    if now - lastTapAt <= M.doubleTapInterval then
      lastTapAt = 0
      run()
    else
      lastTapAt = now
    end
  end

  return false
end

function M.start()
  if watcher then return M end
  watcher = hs.eventtap.new(
    { hs.eventtap.event.types.flagsChanged, hs.eventtap.event.types.keyDown },
    handle
  )
  watcher:start()
  return M
end

function M.stop()
  if watcher then
    watcher:stop()
    watcher = nil
  end
  armed = false
  modifierDown = false
  lastTapAt = 0
  return M
end

-- Exposed so it can also be bound to a plain hotkey, e.g.
--   hs.hotkey.bind({"cmd", "shift"}, "8", scrapboxShot.capture)
M.capture = run

return M
