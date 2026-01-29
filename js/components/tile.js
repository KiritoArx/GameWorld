/**
 * tile.js - Tile/biome data
 * 
 * The world is a grid of tiles, each with a biome type
 * that determines walkability and resource spawning.
 */

import { BIOMES } from '../core/constants.js';

/**
 * Create a tile component
 */
export function createTile(biomeId) {
    const biome = Object.values(BIOMES).find(b => b.id === biomeId) || BIOMES.GRASS;
    
    return {
        biomeId,
        biomeName: biome.name,
        walkable: biome.walkable,
        color: biome.color
    };
}

/**
 * World tiles storage (2D array)
 */
class TileGrid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = new Array(width * height);
        
        // Fill with grass by default
        for (let i = 0; i < this.tiles.length; i++) {
            this.tiles[i] = createTile(BIOMES.GRASS.id);
        }
    }
    
    /**
     * Get tile at position
     */
    get(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.tiles[y * this.width + x];
    }
    
    /**
     * Set tile at position
     */
    set(x, y, biomeId) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }
        this.tiles[y * this.width + x] = createTile(biomeId);
    }
    
    /**
     * Check if position is walkable
     */
    isWalkable(x, y) {
        const tile = this.get(x, y);
        return tile ? tile.walkable : false;
    }
    
    /**
     * Check if position is in bounds
     */
    inBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    /**
     * Get all walkable neighbors of a position
     */
    getWalkableNeighbors(x, y) {
        const neighbors = [];
        const dirs = [
            { dx: 0, dy: -1 }, // N
            { dx: 1, dy: 0 },  // E
            { dx: 0, dy: 1 },  // S
            { dx: -1, dy: 0 }  // W
        ];
        
        for (const { dx, dy } of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (this.isWalkable(nx, ny)) {
                neighbors.push({ x: nx, y: ny });
            }
        }
        
        return neighbors;
    }
    
    /**
     * Clear and resize
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = new Array(width * height);
        for (let i = 0; i < this.tiles.length; i++) {
            this.tiles[i] = createTile(BIOMES.GRASS.id);
        }
    }
}

// Export class (instantiated by worldGen)
export { TileGrid };
