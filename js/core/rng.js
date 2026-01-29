/**
 * rng.js - Deterministic seeded random number generator
 * Uses Mulberry32 algorithm - fast, simple, seedable
 * 
 * CRITICAL: All randomness in the simulation MUST flow through this module
 * to maintain determinism. Never use Math.random() directly.
 */

class SeededRNG {
    constructor(seed = 42) {
        this.initialSeed = seed;
        this.state = seed;
        this.callCount = 0;
    }
    
    /**
     * Reset RNG to initial seed
     */
    reset() {
        this.state = this.initialSeed;
        this.callCount = 0;
    }
    
    /**
     * Set a new seed and reset
     */
    setSeed(seed) {
        this.initialSeed = seed;
        this.reset();
    }
    
    /**
     * Get current seed
     */
    getSeed() {
        return this.initialSeed;
    }
    
    /**
     * Mulberry32 PRNG - returns float in [0, 1)
     */
    next() {
        this.callCount++;
        let t = this.state += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    
    /**
     * Random integer in range [min, max] inclusive
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    
    /**
     * Random float in range [min, max)
     */
    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }
    
    /**
     * Random boolean with given probability of true
     */
    nextBool(probability = 0.5) {
        return this.next() < probability;
    }
    
    /**
     * Pick random element from array
     */
    pick(array) {
        if (array.length === 0) return undefined;
        return array[this.nextInt(0, array.length - 1)];
    }
    
    /**
     * Shuffle array in place (Fisher-Yates)
     */
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    /**
     * Generate normally distributed value (Box-Muller transform)
     * mean: center of distribution
     * stdDev: standard deviation
     */
    nextGaussian(mean = 0, stdDev = 1) {
        const u1 = this.next();
        const u2 = this.next();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0 * stdDev + mean;
    }
    
    /**
     * Clamp a gaussian value to [0, 1] range - useful for traits
     */
    nextGaussianClamped(mean = 0.5, stdDev = 0.2) {
        return Math.max(0, Math.min(1, this.nextGaussian(mean, stdDev)));
    }
    
    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            seed: this.initialSeed,
            state: this.state,
            callCount: this.callCount
        };
    }
}

// Singleton instance for the simulation
export const rng = new SeededRNG(42);

// Export class for testing/multiple instances if needed
export { SeededRNG };
