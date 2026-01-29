/**
 * debugPanel.js - Grand Debugger inspector panel
 * 
 * Shows detailed information about selected NPCs:
 * - Current needs and traits
 * - Current action and WHY breakdown
 * - Top relationships
 */

import { world } from '../core/ecs.js';
import { NEEDS, TRAITS } from '../core/constants.js';
import { getActionName } from '../ai/utilityAI.js';
import { relationshipStore } from '../components/relationships.js';

class DebugPanel {
    constructor() {
        this.panel = null;
        this.content = null;
        this.closeBtn = null;
        this.selectedEntityId = null;
    }
    
    /**
     * Initialize the debug panel
     */
    init() {
        this.panel = document.getElementById('inspector');
        this.content = document.getElementById('inspector-content');
        this.closeBtn = document.getElementById('btn-close-inspector');
        
        this.closeBtn.addEventListener('click', () => this.hide());
    }
    
    /**
     * Show the panel with NPC data
     */
    show(entityId) {
        this.selectedEntityId = entityId;
        this.panel.classList.remove('hidden');
        this.update();
    }
    
    /**
     * Hide the panel
     */
    hide() {
        this.panel.classList.add('hidden');
        this.selectedEntityId = null;
    }
    
    /**
     * Update the panel content
     */
    update() {
        if (this.selectedEntityId === null) {
            this.content.innerHTML = '<p class="hint">Click an NPC to inspect</p>';
            return;
        }
        
        const npc = world.getComponent(this.selectedEntityId, 'npc');
        const pos = world.getComponent(this.selectedEntityId, 'position');
        
        if (!npc) {
            this.content.innerHTML = '<p class="hint">NPC not found</p>';
            return;
        }
        
        let html = '';
        
        // NPC ID and name
        html += `<div class="npc-id">${npc.name} <span style="color: var(--text-dim); font-size: 12px;">#${this.selectedEntityId}</span></div>`;
        
        // Current action
        html += `<div class="npc-action">
            <strong>${getActionName(npc.state.action)}</strong>
            ${npc.state.targetX !== null ? `→ (${npc.state.targetX}, ${npc.state.targetY})` : ''}
        </div>`;
        
        // Position
        html += `<div style="font-size: 10px; color: var(--text-dim); margin-bottom: 12px;">
            Position: (${pos.x}, ${pos.y}) | Alive: ${npc.stats.ticksAlive} ticks
        </div>`;
        
        // Needs section
        html += `<div class="inspector-section">
            <h4>Needs</h4>
            ${this.renderNeeds(npc)}
        </div>`;
        
        // Traits section
        html += `<div class="inspector-section">
            <h4>Traits</h4>
            ${this.renderTraits(npc)}
        </div>`;
        
        // Inventory section
        html += `<div class="inspector-section">
            <h4>Inventory</h4>
            ${this.renderInventory(npc)}
        </div>`;
        
        // WHY breakdown section
        html += `<div class="inspector-section">
            <h4>Decision Breakdown (Tick ${npc.lastDecision.tick})</h4>
            ${this.renderWhyBreakdown(npc)}
        </div>`;
        
        // Relationships section
        html += `<div class="inspector-section">
            <h4>Relationships (Top 5)</h4>
            ${this.renderRelationships(this.selectedEntityId)}
        </div>`;
        
        this.content.innerHTML = html;
    }
    
    /**
     * Render needs bars
     */
    renderNeeds(npc) {
        let html = '';
        
        for (const need of NEEDS) {
            const value = npc.needs[need];
            const colorClass = value < 20 ? 'critical' : value < 40 ? 'low' : '';
            
            html += `<div class="stat-row">
                <span class="stat-label">${this.capitalize(need)}</span>
                <div class="stat-bar">
                    <div class="stat-bar-fill need" style="width: ${value}%;"></div>
                </div>
                <span class="stat-value">${value.toFixed(0)}%</span>
            </div>`;
        }
        
        return html;
    }
    
    /**
     * Render trait bars
     */
    renderTraits(npc) {
        let html = '';
        
        for (const trait of TRAITS) {
            const value = npc.traits[trait] * 100;
            
            html += `<div class="stat-row">
                <span class="stat-label">${this.capitalize(trait)}</span>
                <div class="stat-bar">
                    <div class="stat-bar-fill trait" style="width: ${value}%;"></div>
                </div>
                <span class="stat-value">${(npc.traits[trait]).toFixed(2)}</span>
            </div>`;
        }
        
        return html;
    }
    
    /**
     * Render inventory
     */
    renderInventory(npc) {
        const inv = npc.inventory;
        
        return `<div class="inventory-grid">
            <div class="inventory-item">
                <span class="name">Food</span>
                <span class="count">${inv.food}</span>
            </div>
            <div class="inventory-item">
                <span class="name">Water</span>
                <span class="count">${inv.water}</span>
            </div>
            <div class="inventory-item">
                <span class="name">Wood</span>
                <span class="count">${inv.wood}</span>
            </div>
            <div class="inventory-item">
                <span class="name">Stone</span>
                <span class="count">${inv.stone}</span>
            </div>
        </div>`;
    }
    
    /**
     * Render WHY breakdown table
     */
    renderWhyBreakdown(npc) {
        const decision = npc.lastDecision;
        
        if (!decision.candidates || decision.candidates.length === 0) {
            return '<p class="hint">No decision data</p>';
        }
        
        let html = '<table class="why-table">';
        html += `<tr>
            <th>Action</th>
            <th>Base</th>
            <th>Need</th>
            <th>Trait</th>
            <th>Cost</th>
            <th class="score">Score</th>
        </tr>`;
        
        for (const candidate of decision.candidates.slice(0, 8)) {
            const b = candidate.breakdown;
            const isChosen = candidate.action === decision.chosen;
            const scoreClass = candidate.score > 50 ? 'high' : candidate.score > 20 ? 'mid' : 'low';
            
            html += `<tr class="${isChosen ? 'chosen' : ''}">
                <td>${getActionName(candidate.action)}</td>
                <td>${b.base || '-'}</td>
                <td>${b.needPressure || '-'}</td>
                <td>${b.traitMod || '-'}</td>
                <td>${b.cost || '0'}</td>
                <td class="score ${scoreClass}">${candidate.score.toFixed(1)}</td>
            </tr>`;
        }
        
        html += '</table>';
        
        // Show reason for chosen action
        html += `<p style="margin-top: 8px; font-size: 11px; color: var(--terminal-green);">
            → ${decision.reason || 'No reason given'}
        </p>`;
        
        return html;
    }
    
    /**
     * Render relationships list
     */
    renderRelationships(entityId) {
        const relationships = relationshipStore.getTopRelationships(entityId, 5);
        
        if (relationships.length === 0) {
            return '<p class="hint">No relationships yet</p>';
        }
        
        let html = '';
        
        for (const rel of relationships) {
            const targetNpc = world.getComponent(rel.to, 'npc');
            const targetName = targetNpc ? targetNpc.name : `#${rel.to}`;
            
            html += `<div class="relationship-item">
                <span class="rel-target">${targetName}</span>
                <div class="rel-stats">
                    <span class="rel-stat">A: <span>${rel.affinity.toFixed(0)}</span></span>
                    <span class="rel-stat">T: <span>${rel.trust.toFixed(0)}</span></span>
                    <span class="rel-stat">F: <span>${rel.familiarity.toFixed(0)}</span></span>
                </div>
            </div>`;
        }
        
        return html;
    }
    
    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Singleton instance
export const debugPanel = new DebugPanel();
