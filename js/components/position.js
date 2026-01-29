/**
 * position.js - Position component
 * 
 * Stores grid coordinates. Movement is tile-based.
 */

/**
 * Create a position component
 */
export function createPosition(x, y) {
    return {
        x: Math.floor(x),
        y: Math.floor(y),
        // For smooth rendering interpolation
        prevX: Math.floor(x),
        prevY: Math.floor(y)
    };
}

/**
 * Update position (call before moving)
 */
export function updatePosition(position, newX, newY) {
    position.prevX = position.x;
    position.prevY = position.y;
    position.x = Math.floor(newX);
    position.y = Math.floor(newY);
}

/**
 * Get Manhattan distance between two positions
 */
export function manhattanDistance(pos1, pos2) {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

/**
 * Get Euclidean distance between two positions
 */
export function euclideanDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get direction from pos1 to pos2 as unit vector
 */
export function getDirection(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return { x: 0, y: 0 };
    return { x: dx / len, y: dy / len };
}
