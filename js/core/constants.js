/**
 * constants.js - Game configuration and constants
 * All tunable parameters live here for easy balancing
 */

export const CONFIG = {
    // World
    WORLD_WIDTH: 256,
    WORLD_HEIGHT: 256,
    TILE_SIZE: 8, // pixels per tile when rendering
    
    // Population
    INITIAL_NPC_COUNT: 150,
    MAX_NPC_COUNT: 500,
    NPC_SPAWN_BATCH: 50,
    
    // Simulation timing
    SIM_TICK_RATE: 10, // ticks per second
    DECISION_INTERVAL: 5, // NPCs reconsider every N ticks
    
    // Needs decay rates (per tick)
    NEED_DECAY: {
        hunger: 0.15,
        thirst: 0.2,
        rest: 0.1,
        safety: 0.05,
        social: 0.08
    },
    
    // Need thresholds
    NEED_CRITICAL: 20,
    NEED_LOW: 40,
    NEED_COMFORTABLE: 70,
    
    // Resource spawning
    RESOURCE_DENSITY: 0.03, // % of tiles with resources
    RESOURCE_RESPAWN_TICKS: 500,
    
    // Stockpile location (center of map)
    STOCKPILE_X: 128,
    STOCKPILE_Y: 128,
    STOCKPILE_RADIUS: 3,
    
    // Movement
    NPC_MOVE_SPEED: 1, // tiles per tick when moving
    
    // Social
    SOCIAL_RANGE: 5, // tiles
    RELATIONSHIP_GAIN_PER_INTERACTION: {
        affinity: 2,
        trust: 1,
        familiarity: 3
    },
    
    // Rendering
    CAMERA_PAN_SPEED: 10,
    ZOOM_MIN: 0.5,
    ZOOM_MAX: 4,
    ZOOM_STEP: 0.2,
    
    // Debug
    SHOW_SPATIAL_GRID: false,
    SPATIAL_CELL_SIZE: 16
};

// Trait definitions
export const TRAITS = ['cooperativeness', 'innovation', 'greed', 'riskTolerance', 'attachment', 'aggression'];

// Need definitions
export const NEEDS = ['hunger', 'thirst', 'rest', 'safety', 'social'];

// Resource types
export const RESOURCE_TYPES = {
    FOOD: 'food',
    WATER: 'water',
    WOOD: 'wood',
    STONE: 'stone'
};

// Biome types
export const BIOMES = {
    GRASS: { id: 0, name: 'grass', walkable: true, color: '#1a3a1a' },
    WATER: { id: 1, name: 'water', walkable: false, color: '#1a2a3a' },
    FOREST: { id: 2, name: 'forest', walkable: true, color: '#0a2a0a' },
    STONE: { id: 3, name: 'stone', walkable: true, color: '#2a2a2a' }
};

// Action types
export const ACTIONS = {
    IDLE: 'idle',
    EAT: 'eat',
    DRINK: 'drink',
    REST: 'rest',
    WANDER: 'wander',
    GATHER_FOOD: 'gather_food',
    GATHER_WATER: 'gather_water',
    GATHER_WOOD: 'gather_wood',
    GATHER_STONE: 'gather_stone',
    SOCIALIZE: 'socialize',
    DEPOSIT: 'deposit',
    MOVE_TO: 'move_to'
};

// Colors for rendering
export const COLORS = {
    NPC_DEFAULT: '#00ff88',
    NPC_HUNGRY: '#ffaa00',
    NPC_CRITICAL: '#ff4466',
    NPC_RESTING: '#4488ff',
    NPC_SOCIAL: '#ff66aa',
    NPC_SELECTED: '#00d4ff',
    
    RESOURCE_FOOD: '#88ff44',
    RESOURCE_WATER: '#44aaff',
    RESOURCE_WOOD: '#aa7744',
    RESOURCE_STONE: '#888888',
    
    STOCKPILE: '#ffaa00',
    STOCKPILE_GLOW: 'rgba(255, 170, 0, 0.3)'
};
