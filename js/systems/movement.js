/**
 * movement.js - Simple movement system
 * 
 * NPCs move one tile per tick toward their target.
 * No pathfinding in MVP - just move toward target,
 * preferring axis with larger delta.
 * 
 * Architecture is ready for A* caching later.
 */

import { world } from '../core/ecs.js';
import { ACTIONS, CONFIG } from '../core/constants.js';
import { getTileGrid } from '../world/worldGen.js';
import { updatePosition } from '../components/position.js';

/**
 * Run the movement system
 */
export function runMovementSystem() {
    const tileGrid = getTileGrid();
    if (!tileGrid) return;
    
    for (const entityId of world.query('npc', 'position')) {
        const npc = world.getComponent(entityId, 'npc');
        const pos = world.getComponent(entityId, 'position');
        
        if (!npc || !pos) continue;
        
        // Check if NPC has a movement target
        const action = npc.state.action;
        const needsMovement = [
            ACTIONS.GATHER_FOOD,
            ACTIONS.GATHER_WATER,
            ACTIONS.GATHER_WOOD,
            ACTIONS.GATHER_STONE,
            ACTIONS.DEPOSIT,
            ACTIONS.WANDER,
            ACTIONS.MOVE_TO
        ].includes(action);
        
        if (!needsMovement) continue;
        
        let targetX = npc.state.targetX;
        let targetY = npc.state.targetY;
        
        // For wander, pick a random nearby walkable tile
        if (action === ACTIONS.WANDER && (targetX === null || targetY === null)) {
            const neighbors = tileGrid.getWalkableNeighbors(pos.x, pos.y);
            if (neighbors.length > 0) {
                // Use position-based deterministic selection
                const idx = (pos.x + pos.y + entityId) % neighbors.length;
                const target = neighbors[idx];
                targetX = target.x;
                targetY = target.y;
                npc.state.targetX = targetX;
                npc.state.targetY = targetY;
            }
        }
        
        if (targetX === null || targetY === null) continue;
        
        // Already at target?
        if (pos.x === targetX && pos.y === targetY) continue;
        
        // Calculate movement direction
        const dx = targetX - pos.x;
        const dy = targetY - pos.y;
        
        let moveX = 0;
        let moveY = 0;
        
        // Move along the larger axis first (simple greedy approach)
        if (Math.abs(dx) >= Math.abs(dy)) {
            moveX = dx > 0 ? 1 : -1;
        } else {
            moveY = dy > 0 ? 1 : -1;
        }
        
        // Check if target tile is walkable
        const newX = pos.x + moveX;
        const newY = pos.y + moveY;
        
        if (tileGrid.isWalkable(newX, newY)) {
            updatePosition(pos, newX, newY);
            world.positionChanged(entityId);
            npc.stats.distanceTraveled++;
        } else {
            // Try the other axis
            if (moveX !== 0 && dy !== 0) {
                moveX = 0;
                moveY = dy > 0 ? 1 : -1;
            } else if (moveY !== 0 && dx !== 0) {
                moveY = 0;
                moveX = dx > 0 ? 1 : -1;
            }
            
            const altX = pos.x + moveX;
            const altY = pos.y + moveY;
            
            if (tileGrid.isWalkable(altX, altY)) {
                updatePosition(pos, altX, altY);
                world.positionChanged(entityId);
                npc.stats.distanceTraveled++;
            }
            // If still blocked, NPC is stuck this tick (will reconsider next decision)
        }
    }
}
