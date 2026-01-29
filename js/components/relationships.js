/**
 * relationships.js - Relationship tracking between NPCs
 * 
 * Relationships are directional edges: A's feelings toward B
 * may differ from B's feelings toward A.
 * 
 * Stored as a map of maps: fromNPC -> toNPC -> RelationshipData
 */

/**
 * Relationship data structure
 */
export function createRelationship(fromId, toId) {
    return {
        from: fromId,
        to: toId,
        affinity: 0,       // -100 to 100: liking/disliking
        trust: 50,         // 0 to 100: reliability
        familiarity: 0,    // 0 to 100: how well they know each other
        interactionCount: 0,
        lastInteractionTick: 0
    };
}

/**
 * Relationship store (singleton)
 */
class RelationshipStore {
    constructor() {
        this.relationships = new Map(); // "fromId,toId" -> RelationshipData
    }
    
    /**
     * Get or create relationship from A to B
     */
    get(fromId, toId) {
        const key = `${fromId},${toId}`;
        if (!this.relationships.has(key)) {
            this.relationships.set(key, createRelationship(fromId, toId));
        }
        return this.relationships.get(key);
    }
    
    /**
     * Check if relationship exists
     */
    has(fromId, toId) {
        return this.relationships.has(`${fromId},${toId}`);
    }
    
    /**
     * Update relationship after interaction
     */
    recordInteraction(fromId, toId, affinityDelta, trustDelta, familiarityDelta, currentTick) {
        const rel = this.get(fromId, toId);
        
        rel.affinity = Math.max(-100, Math.min(100, rel.affinity + affinityDelta));
        rel.trust = Math.max(0, Math.min(100, rel.trust + trustDelta));
        rel.familiarity = Math.max(0, Math.min(100, rel.familiarity + familiarityDelta));
        rel.interactionCount++;
        rel.lastInteractionTick = currentTick;
        
        return rel;
    }
    
    /**
     * Get all relationships for an NPC (outgoing)
     */
    getRelationshipsFrom(npcId) {
        const results = [];
        for (const [key, rel] of this.relationships) {
            if (rel.from === npcId) {
                results.push(rel);
            }
        }
        return results;
    }
    
    /**
     * Get all relationships toward an NPC (incoming)
     */
    getRelationshipsTo(npcId) {
        const results = [];
        for (const [key, rel] of this.relationships) {
            if (rel.to === npcId) {
                results.push(rel);
            }
        }
        return results;
    }
    
    /**
     * Get top N relationships by familiarity
     */
    getTopRelationships(npcId, n = 5) {
        return this.getRelationshipsFrom(npcId)
            .sort((a, b) => b.familiarity - a.familiarity)
            .slice(0, n);
    }
    
    /**
     * Get total relationship count
     */
    count() {
        return this.relationships.size;
    }
    
    /**
     * Remove all relationships involving an NPC
     */
    removeNPC(npcId) {
        const toRemove = [];
        for (const key of this.relationships.keys()) {
            const [from, to] = key.split(',').map(Number);
            if (from === npcId || to === npcId) {
                toRemove.push(key);
            }
        }
        for (const key of toRemove) {
            this.relationships.delete(key);
        }
    }
    
    /**
     * Clear all relationships
     */
    clear() {
        this.relationships.clear();
    }
    
    /**
     * Serialize for determinism testing
     */
    serialize() {
        return [...this.relationships.entries()];
    }
}

// Singleton instance
export const relationshipStore = new RelationshipStore();
