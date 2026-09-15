-- Stub out Hammerspoon and drive the double-tap state machine with synthetic
-- events, so the ⌘⌘ rules can be checked off-macOS.

local now = 0
local captured = nil   -- the handler M.start() registers
local runs = 0

local TYPES = { flagsChanged = "flagsChanged", keyDown = "keyDown" }

hs = {
  eventtap = {
    event = { types = TYPES },
    new = function(_, fn)
      captured = fn
      return { start = function() end, stop = function() end }
    end,
  },
  timer = { secondsSinceEpoch = function() return now end },
  window = { frontmostWindow = function() return nil end },
  alert = { show = function() end },
  task = {
    new = function(_, _, _)
      return { start = function() runs = runs + 1 end }
    end,
  },
}

local here = (arg and arg[0] or ""):match("(.*)/[^/]*$") or "."
local M = dofile(here .. "/../hammerspoon/scrapbox-shot.lua")
M.showAlerts = false
M.start()

local function event(kind, flags)
  captured({
    getType = function() return kind end,
    getFlags = function() return flags or {} end,
  })
end

local function down(flags) event(TYPES.flagsChanged, flags) end
local function up()        event(TYPES.flagsChanged, {})     end
local function key()       event(TYPES.keyDown, {cmd = true}) end

local failures = 0
local function check(name, want)
  local got = runs
  runs = 0
  if got ~= want then
    print(string.format("FAIL %-46s want %d, got %d", name, want, got))
    failures = failures + 1
  else
    print(string.format("ok   %-46s (%d)", name, got))
  end
end

local function reset(t)
  now = t or 100
  M.stop(); M.start()
  runs = 0
end

-- two clean cmd taps inside the window
reset()
down({cmd = true}); up(); now = now + 0.2; down({cmd = true}); up()
check("cmd, cmd within 0.4s fires", 1)

-- too slow
reset()
down({cmd = true}); up(); now = now + 1.0; down({cmd = true}); up()
check("cmd, cmd after 1.0s does not fire", 0)

-- a single tap
reset()
down({cmd = true}); up()
check("single cmd tap does not fire", 0)

-- cmd held with shift
reset()
down({cmd = true, shift = true}); up()
now = now + 0.1
down({cmd = true, shift = true}); up()
check("shift+cmd twice does not fire", 0)

-- a real shortcut typed twice (cmd+C, cmd+C)
reset()
down({cmd = true}); key(); up()
now = now + 0.1
down({cmd = true}); key(); up()
check("cmd+C twice does not fire", 0)

-- cmd+C then a bare cmd tap: only one clean tap, so nothing
reset()
down({cmd = true}); key(); up()
now = now + 0.1
down({cmd = true}); up()
check("cmd+C then bare cmd does not fire", 0)

-- shift pressed while cmd is held disarms, even if released first
reset()
down({cmd = true}); down({cmd = true, shift = true}); down({cmd = true}); up()
now = now + 0.1
down({cmd = true}); up()
check("cmd, +shift, -shift, release is not a tap", 0)

-- three taps fire once, not twice (the counter resets after firing)
reset()
down({cmd = true}); up(); now = now + 0.1
down({cmd = true}); up(); now = now + 0.1
down({cmd = true}); up()
check("three taps fire exactly once", 1)

-- four taps fire twice
reset()
for _ = 1, 4 do down({cmd = true}); up(); now = now + 0.1 end
check("four taps fire twice", 2)

-- other modifier alone is ignored
reset()
down({shift = true}); up(); now = now + 0.1; down({shift = true}); up()
check("shift, shift does not fire", 0)

-- switching the trigger modifier
reset()
M.modifier = "alt"
down({alt = true}); up(); now = now + 0.2; down({alt = true}); up()
check("modifier=alt: alt, alt fires", 1)
reset()
down({cmd = true}); up(); now = now + 0.2; down({cmd = true}); up()
check("modifier=alt: cmd, cmd does not fire", 0)
M.modifier = "cmd"

os.exit(failures == 0 and 0 or 1)
