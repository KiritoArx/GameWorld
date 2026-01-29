/**
 * resource.js - Resource node component
 * 
 * Resources appear on the map and can be gathered by NPCs.
 * They regenerate over time when depleted.
 */

import { RESOURCE_TYPES } from '../core/constants.js';

/**
 * Create a resource node component
 */
export function createResource(type, amount = 10) {
    return {
        type,
        amount,
        maxAmount: amount,
        depleted: false,
        respawnTimer: 0
    };
}

/**
 * Gather from a resource (returns amount gathered)
 */
export function gatherResource(resource, gatherAmount = 1) {
    if (resource.depleted || resource.amount <= 0) {
        return 0;
    }
    
    const gathered = Math.min(gatherAmount, resource.amount);
    resource.amount -= gathered;
    
    if (resource.amount <= 0) {
        resource.depleted = true;
        resource.amount = 0;
    }
    
    return gathered;
}

/**
 * Try to respawn a depleted resource
 */
export function tryRespawn(resource, respawnTime) {
    if (!resource.depleted) return false;
    
    resource.respawnTimer++;
    if (resource.respawnTimer >= respawnTime) {
        resource.depleted = false;
        resource.amount = resource.maxAmount;
        resource.respawnTimer = 0;
        return true;
    }
    
    return false;
}

/**
 * Get resource color for rendering
 */
export function getResourceColor(type) {
    switch (type) {
        case RESOURCE_TYPES.FOOD: return '#88ff44';
        case RESOURCE_TYPES.WATER: return '#44aaff';
        case RESOURCE_TYPES.WOOD: return '#aa7744';
        case RESOURCE_TYPES.STONE: return '#888888';
        default: return '#ffffff';
    }
}

/**
 * Get resource glyph for rendering
 */
export function getResourceGlyph(type) {
    switch (type) {
        case RESOURCE_TYPES.FOOD: return '⬟'; // Berry/food
        case RESOURCE_TYPES.WATER: return '≋'; // Water
        case RESOURCE_TYPES.WOOD: return '⧫'; // Tree/wood
        case RESOURCE_TYPES.STONE: return '◆'; // Stone
        default: return '?';
    }
}
