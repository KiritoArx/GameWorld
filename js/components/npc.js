/**
 * npc.js - NPC component
 * 
 * Contains all NPC-specific data:
 * - Traits (personality, 0-1 range)
 * - Needs (survival needs, 0-100 range)
 * - Inventory (resource counts)
 * - State (current action, target, etc.)
 */

import { rng } from '../core/rng.js';
import { TRAITS, NEEDS, ACTIONS } from '../core/constants.js';

/**
 * Create a new NPC component
 */
export function createNPC(id) {
    // Generate traits with gaussian distribution (most NPCs are average)
    const traits = {};
    for (const trait of TRAITS) {
        traits[trait] = rng.nextGaussianClamped(0.5, 0.2);
    }
    
    // Initialize needs (start partially satisfied)
    const needs = {};
    for (const need of NEEDS) {
        needs[need] = rng.nextFloat(50, 80);
    }
    
    return {
        id,
        name: generateName(id),
        
        // Personality (fixed at creation)
        traits,
        
        // Dynamic needs (change every tick)
        needs,
        
        // Inventory
        inventory: {
            food: 0,
            water: 0,
            wood: 0,
            stone: 0
        },
        
        // Current state
        state: {
            action: ACTIONS.IDLE,
            targetX: null,
            targetY: null,
            targetEntity: null,
            actionProgress: 0,
            ticksSinceLastDecision: 0
        },
        
        // Last decision breakdown (for inspector)
        lastDecision: {
            tick: 0,
            candidates: [],
            chosen: null,
            reason: ''
        },
        
        // Stats
        stats: {
            ticksAlive: 0,
            resourcesGathered: 0,
            socialInteractions: 0,
            distanceTraveled: 0
        }
    };
}

/**
 * Generate a procedural name from ID
 */
function generateName(id) {
    const prefixes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'Z'];
    const suffixes = ['ax', 'el', 'on', 'is', 'ar', 'en', 'or', 'us', 'ia', 'um', 'ix', 'os'];
    
    const prefixIndex = id % prefixes.length;
    const suffixIndex = Math.floor(id / prefixes.length) % suffixes.length;
    const num = Math.floor(id / (prefixes.length * suffixes.length));
    
    let name = prefixes[prefixIndex] + suffixes[suffixIndex];
    if (num > 0) {
        name += '-' + num;
    }
    
    return name;
}

/**
 * Get the most critical need (lowest value)
 */
export function getCriticalNeed(npc) {
    let lowest = Infinity;
    let critical = null;
    
    for (const [need, value] of Object.entries(npc.needs)) {
        if (value < lowest) {
            lowest = value;
            critical = need;
        }
    }
    
    return { need: critical, value: lowest };
}

/**
 * Get trait-modified value
 * traitName: which trait to check
 * baseValue: starting value
 * influence: how much the trait affects the value (-1 to 1)
 */
export function applyTraitModifier(npc, traitName, baseValue, influence = 0.5) {
    const trait = npc.traits[traitName] || 0.5;
    const deviation = (trait - 0.5) * 2 * influence; // -influence to +influence
    return baseValue * (1 + deviation);
}

/**
 * Check if NPC has items to deposit
 */
export function hasItemsToDeposit(npc) {
    const inv = npc.inventory;
    return inv.food > 0 || inv.water > 0 || inv.wood > 0 || inv.stone > 0;
}

/**
 * Get total inventory count
 */
export function getTotalInventory(npc) {
    const inv = npc.inventory;
    return inv.food + inv.water + inv.wood + inv.stone;
}

/**
 * Clamp all needs to valid range
 */
export function clampNeeds(npc) {
    for (const need of NEEDS) {
        npc.needs[need] = Math.max(0, Math.min(100, npc.needs[need]));
    }
}
