/**
 * needsDecay.js - System that decreases NPC needs over time
 * 
 * Runs every tick. All needs slowly decrease, creating pressure
 * for NPCs to take actions to satisfy them.
 */

import { world } from '../core/ecs.js';
import { CONFIG } from '../core/constants.js';
import { clampNeeds } from '../components/npc.js';

/**
 * Run the needs decay system
 */
export function runNeedsDecay() {
    for (const entityId of world.query('npc')) {
        const npc = world.getComponent(entityId, 'npc');
        if (!npc) continue;
        
        // Decay each need
        npc.needs.hunger -= CONFIG.NEED_DECAY.hunger;
        npc.needs.thirst -= CONFIG.NEED_DECAY.thirst;
        npc.needs.rest -= CONFIG.NEED_DECAY.rest;
        npc.needs.safety -= CONFIG.NEED_DECAY.safety;
        npc.needs.social -= CONFIG.NEED_DECAY.social;
        
        // Clamp to valid range
        clampNeeds(npc);
        
        // Update stats
        npc.stats.ticksAlive++;
    }
}
