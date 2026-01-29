/**
 * resourceRegen.js - System that respawns depleted resources
 */

import { world } from '../core/ecs.js';
import { CONFIG } from '../core/constants.js';
import { tryRespawn } from '../components/resource.js';
import { eventBus, EVENTS } from '../core/eventBus.js';

/**
 * Run the resource regeneration system
 */
export function runResourceRegenSystem() {
    for (const entityId of world.query('resource')) {
        const resource = world.getComponent(entityId, 'resource');
        if (!resource || !resource.depleted) continue;
        
        const respawned = tryRespawn(resource, CONFIG.RESOURCE_RESPAWN_TICKS);
        
        if (respawned) {
            const pos = world.getComponent(entityId, 'position');
            eventBus.emit(EVENTS.RESOURCE_SPAWNED, {
                entityId,
                type: resource.type,
                x: pos?.x,
                y: pos?.y
            });
        }
    }
}
