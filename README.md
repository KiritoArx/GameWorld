# zombieee

Private Roblox tester hub scripts and diagnostics.

## Files

- `hub.lua` - main Delta/Roblox tester hub script.
- `loader.lua` - tiny public loader for Delta.
- `dist/hub.compact.lua` - compact generated build for public raw loading.

## Workflow

Use this repo as the source of truth for updates. After editing `hub.lua`, commit and push the change, then sync the latest copy to `C:\Users\crumb\OneDrive\Documents\hub.lua` for local executor use.

## Compact Build

Run:

```powershell
.\build.ps1
```

This writes `dist\hub.compact.lua`, a compact version that removes blank lines and full-line comments while keeping inline code intact.

Delta loader:

```lua
loadstring(game:HttpGet("https://raw.githubusercontent.com/KiritoArx/zombieee/main/dist/hub.compact.lua"))()
```
