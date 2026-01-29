# Coded World - Emergent 2.5D God-Sim

An emergent simulation where NPCs make autonomous decisions based on needs, traits, and context. No scripted behaviors—everything emerges from the utility AI system.

## Quick Start

### Windows (PowerShell)
```powershell
cd coded-world
python -m http.server 8000
# Then open: http://localhost:8000
```

### Alternative (Node.js)
```bash
npx serve .
# Then open the URL shown
```

### Alternative (VS Code)
Install the "Live Server" extension and click "Go Live".

## Controls

| Control | Action |
|---------|--------|
| **Mouse Drag** | Pan camera |
| **Scroll Wheel** | Zoom in/out |
| **Click NPC** | Open Grand Debugger inspector |
| **Speed Buttons** | 1×, 2×, 5×, 20× simulation speed |
| **Pause/Play** | Toggle simulation |
| **+50 / -50 NPC** | Add or remove NPCs |
| **Apply Seed** | Change RNG seed and reset |
| **Reset World** | Full simulation reset |

## Grand Debugger (Inspector)

Click any NPC to see:
- **Needs**: Hunger, Thirst, Rest, Safety, Social (0-100%)
- **Traits**: Cooperativeness, Innovation, Greed, RiskTolerance, Attachment, Aggression (0-1)
- **Inventory**: Food, Water, Wood, Stone counts
- **Decision Breakdown**: Full "WHY" table showing all candidate actions with:
  - Base utility
  - Need pressure multiplier
  - Trait modifier
  - Movement cost
  - Final score
- **Relationships**: Top 5 NPCs by familiarity with Affinity/Trust/Familiarity values

## Architecture

```
ECS (Entity-Component-System)
├── Entities: Just integer IDs
├── Components: Plain data objects (position, npc, resource)
└── Systems: Pure functions that operate on components
    ├── needsDecay.js   - Decreases needs over time
    ├── decision.js     - Triggers utility AI evaluation
    ├── movement.js     - Simple tile-by-tile movement
    ├── actions.js      - Executes chosen actions
    ├── social.js       - Updates relationships
    └── resourceRegen.js - Respawns depleted resources
```

## Determinism

The simulation is fully deterministic:
- Same seed + same inputs = identical results
- All randomness flows through seeded Mulberry32 PRNG
- Systems execute in fixed order
- Test: Run with same seed, compare stats at tick 1200

## Utility AI

NPCs evaluate actions using:
```
score = baseUtility * needPressure * traitModifier - cost
```

Where:
- **baseUtility**: Inherent value of the action (e.g., eating = 60)
- **needPressure**: Higher when need is low (exponential curve)
- **traitModifier**: Personality influences (e.g., greedy NPCs gather more)
- **cost**: Distance to target, time required

## Performance

- **Sim/Render Split**: Simulation at 10Hz, rendering at 60fps
- **Decision Throttling**: NPCs reconsider every 5 ticks, not every tick
- **Spatial Hashing**: O(1) nearby entity queries
- **Target**: 500 NPCs smooth on mid-range hardware

## Files

```
coded-world/
├── index.html          # Entry point
├── css/style.css       # Terminal-style UI
├── js/
│   ├── main.js         # Game loop & initialization
│   ├── core/           # Foundation (ECS, RNG, events, config)
│   ├── components/     # Data structures (position, npc, resource)
│   ├── systems/        # Logic (movement, decisions, actions)
│   ├── world/          # World generation & stockpile
│   ├── ai/             # Utility AI
│   ├── render/         # Canvas rendering
│   └── ui/             # Debug panel & controls
└── README.md
```

## Console API

Open browser dev tools and access:
```javascript
CodedWorld.getStats()           // Current simulation stats
CodedWorld.tick()               // Manually advance one tick
CodedWorld.spawnNPCs(100)       // Spawn NPCs
CodedWorld.resetSimulation()    // Full reset
CodedWorld.rng.getSeed()        // Current RNG seed
```

## Roadmap

See the full roadmap in the project specification for:
- **Milestone B**: Settlement emergence
- **Milestone C**: Trade, conflict, disasters
- **Milestone D**: Families, births, aging, LOD tiers
- **Milestone E**: Governance, tech emergence, 3/4 buildings

---

Built with vanilla JavaScript ES6 modules. No frameworks, no build step.
