/**
 * ecs.js - Entity-Component-System foundation
 * 
 * Design:
 * - Entities are just unique integer IDs
 * - Components are plain data objects stored in Maps keyed by entity ID
 * - Systems are functions that operate on entities with specific components
 * 
 * This is a lightweight ECS optimized for:
 * - Fast iteration over entities with specific components
 * - Easy serialization (for save/load or determinism testing)
 * - Clear separation of data and logic
 */

import { CONFIG } from './constants.js';

class World {
    constructor() {
        this.nextEntityId = 1;
        this.entities = new Set(); // All active entity IDs
        this.components = new Map(); // componentName -> Map<entityId, componentData>
        this.tags = new Map(); // entityId -> Set<tagName> for quick filtering
        
        // Spatial index for position-based queries
        this.spatialGrid = new Map(); // "cellX,cellY" -> Set<entityId>
        this.cellSize = CONFIG.SPATIAL_CELL_SIZE;
        
        // Track removed entities for cleanup
        this.toRemove = new Set();
    }
    
    /**
     * Create a new entity
     * @returns {number} Entity ID
     */
    createEntity() {
        const id = this.nextEntityId++;
        this.entities.add(id);
        this.tags.set(id, new Set());
        return id;
    }
    
    /**
     * Mark entity for removal (actually removed at end of tick)
     */
    removeEntity(id) {
        this.toRemove.add(id);
    }
    
    /**
     * Actually remove marked entities
     */
    flushRemovals() {
        for (const id of this.toRemove) {
            // Remove from all component stores
            for (const store of this.components.values()) {
                store.delete(id);
            }
            
            // Remove from spatial grid
            this._removeFromSpatialGrid(id);
            
            // Remove from tags
            this.tags.delete(id);
            
            // Remove from entity set
            this.entities.delete(id);
        }
        this.toRemove.clear();
    }
    
    /**
     * Add a component to an entity
     */
    addComponent(entityId, componentName, data) {
        if (!this.components.has(componentName)) {
            this.components.set(componentName, new Map());
        }
        this.components.get(componentName).set(entityId, data);
        
        // Update spatial grid if this is a position component
        if (componentName === 'position' && data) {
            this._updateSpatialGrid(entityId, data);
        }
        
        return data;
    }
    
    /**
     * Get a component from an entity
     */
    getComponent(entityId, componentName) {
        const store = this.components.get(componentName);
        return store ? store.get(entityId) : undefined;
    }
    
    /**
     * Check if entity has a component
     */
    hasComponent(entityId, componentName) {
        const store = this.components.get(componentName);
        return store ? store.has(entityId) : false;
    }
    
    /**
     * Remove a component from an entity
     */
    removeComponent(entityId, componentName) {
        const store = this.components.get(componentName);
        if (store) {
            if (componentName === 'position') {
                this._removeFromSpatialGrid(entityId);
            }
            store.delete(entityId);
        }
    }
    
    /**
     * Add a tag to an entity (for quick filtering)
     */
    addTag(entityId, tag) {
        const entityTags = this.tags.get(entityId);
        if (entityTags) {
            entityTags.add(tag);
        }
    }
    
    /**
     * Remove a tag from an entity
     */
    removeTag(entityId, tag) {
        const entityTags = this.tags.get(entityId);
        if (entityTags) {
            entityTags.delete(tag);
        }
    }
    
    /**
     * Check if entity has a tag
     */
    hasTag(entityId, tag) {
        const entityTags = this.tags.get(entityId);
        return entityTags ? entityTags.has(tag) : false;
    }
    
    /**
     * Query entities that have ALL specified components
     * @yields {number} Entity ID
     */
    *query(...componentNames) {
        // Use smallest component store as base for iteration
        let smallest = null;
        let smallestSize = Infinity;
        
        for (const name of componentNames) {
            const store = this.components.get(name);
            if (!store || store.size === 0) {
                return; // No entities match if any component store is empty
            }
            if (store.size < smallestSize) {
                smallest = store;
                smallestSize = store.size;
            }
        }
        
        if (!smallest) return;
        
        // Iterate through smallest store, check others
        for (const entityId of smallest.keys()) {
            if (this.toRemove.has(entityId)) continue;
            
            let hasAll = true;
            for (const name of componentNames) {
                if (!this.hasComponent(entityId, name)) {
                    hasAll = false;
                    break;
                }
            }
            if (hasAll) {
                yield entityId;
            }
        }
    }
    
    /**
     * Query entities with tag
     */
    *queryTag(tag) {
        for (const [entityId, entityTags] of this.tags) {
            if (this.toRemove.has(entityId)) continue;
            if (entityTags.has(tag)) {
                yield entityId;
            }
        }
    }
    
    /**
     * Get all entities near a position (using spatial hash)
     */
    getNearbyEntities(x, y, radius) {
        const results = [];
        const minCellX = Math.floor((x - radius) / this.cellSize);
        const maxCellX = Math.floor((x + radius) / this.cellSize);
        const minCellY = Math.floor((y - radius) / this.cellSize);
        const maxCellY = Math.floor((y + radius) / this.cellSize);
        
        const radiusSq = radius * radius;
        
        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                const cell = this.spatialGrid.get(`${cx},${cy}`);
                if (!cell) continue;
                
                for (const entityId of cell) {
                    if (this.toRemove.has(entityId)) continue;
                    
                    const pos = this.getComponent(entityId, 'position');
                    if (!pos) continue;
                    
                    const dx = pos.x - x;
                    const dy = pos.y - y;
                    if (dx * dx + dy * dy <= radiusSq) {
                        results.push(entityId);
                    }
                }
            }
        }
        
        return results;
    }
    
    /**
     * Update spatial grid when position changes
     */
    _updateSpatialGrid(entityId, newPos) {
        // Remove from old cell
        this._removeFromSpatialGrid(entityId);
        
        // Add to new cell
        const cellX = Math.floor(newPos.x / this.cellSize);
        const cellY = Math.floor(newPos.y / this.cellSize);
        const key = `${cellX},${cellY}`;
        
        if (!this.spatialGrid.has(key)) {
            this.spatialGrid.set(key, new Set());
        }
        this.spatialGrid.get(key).add(entityId);
    }
    
    /**
     * Remove entity from spatial grid
     */
    _removeFromSpatialGrid(entityId) {
        const pos = this.getComponent(entityId, 'position');
        if (!pos) return;
        
        const cellX = Math.floor(pos.x / this.cellSize);
        const cellY = Math.floor(pos.y / this.cellSize);
        const key = `${cellX},${cellY}`;
        
        const cell = this.spatialGrid.get(key);
        if (cell) {
            cell.delete(entityId);
            if (cell.size === 0) {
                this.spatialGrid.delete(key);
            }
        }
    }
    
    /**
     * Notify world that an entity's position changed
     */
    positionChanged(entityId) {
        const pos = this.getComponent(entityId, 'position');
        if (pos) {
            this._updateSpatialGrid(entityId, pos);
        }
    }
    
    /**
     * Get entity count
     */
    entityCount() {
        return this.entities.size - this.toRemove.size;
    }
    
    /**
     * Clear all entities and components
     */
    clear() {
        this.entities.clear();
        this.components.clear();
        this.tags.clear();
        this.spatialGrid.clear();
        this.toRemove.clear();
        this.nextEntityId = 1;
    }
    
    /**
     * Serialize world state (for determinism testing)
     */
    serialize() {
        const state = {
            nextEntityId: this.nextEntityId,
            entities: [...this.entities],
            components: {}
        };
        
        for (const [name, store] of this.components) {
            state.components[name] = [...store.entries()];
        }
        
        return state;
    }
    
    /**
     * Get stats for debugging
     */
    getStats() {
        const componentCounts = {};
        for (const [name, store] of this.components) {
            componentCounts[name] = store.size;
        }
        
        return {
            entityCount: this.entityCount(),
            componentCounts,
            spatialCells: this.spatialGrid.size
        };
    }
}

// Singleton world instance
export const world = new World();

// Export class for testing
export { World };
