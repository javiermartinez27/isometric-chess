// Turn Manager - State Machine for turn-based gameplay
class TurnManager {
    constructor() {
        this.entities = [];  // All entities that can take turns (players, enemies, etc.)
        this.currentTurnIndex = 0;
        this.turnInProgress = false;
        this.turnIndicator = null;
    }

    // Initialize the turn manager
    init() {
        this.turnIndicator = this.createTurnIndicator();
    }

    // Register an entity that can take turns
    registerEntity(entity, type) {
        this.entities.push({
            entity: entity,
            type: type,  // 'player' or 'enemy'
            name: type === 'player' ? 'Player' : `Enemy ${this.entities.filter(e => e.type === 'enemy').length + 1}`
        });
    }

    // Clear all registered entities
    clearEntities() {
        this.entities = [];
        this.currentTurnIndex = 0;
        this.turnInProgress = false;
    }

    // Start the turn-based system
    start() {
        if (this.entities.length === 0) {
            console.warn('No entities registered for turns');
            return;
        }
        
        this.currentTurnIndex = 0;
        this.startTurn();
    }

    // Start the current entity's turn
    startTurn() {
        if (this.entities.length === 0) return;
        
        const current = this.entities[this.currentTurnIndex];
        this.turnInProgress = true;
        
        // Update visual indicator
        this.updateTurnIndicator(current);
        
        // Notify the entity it's their turn
        if (current.type === 'player') {
            current.entity.startTurn();
        } else if (current.type === 'enemy') {
            // Enemy takes 3 seconds to make their move
            setTimeout(() => {
                if (this.turnInProgress) {
                    current.entity.takeTurn();
                    this.endTurn();
                }
            }, 1000);
        }
    }

    // End the current turn and move to next entity
    endTurn() {
        this.turnInProgress = false;
        
        // Move to next entity
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.entities.length;
        
        // Start next turn
        this.startTurn();
    }

    // Check if it's a specific entity's turn
    isEntityTurn(entity) {
        if (this.entities.length === 0) return false;
        return this.entities[this.currentTurnIndex].entity === entity;
    }

    // Get current turn entity type
    getCurrentTurnType() {
        if (this.entities.length === 0) return null;
        return this.entities[this.currentTurnIndex].type;
    }

    // Create visual turn indicator
    createTurnIndicator() {
        return document.getElementById('turn-indicator');
    }

    // Update turn indicator display
    updateTurnIndicator(currentEntity) {
        if (!this.turnIndicator) return;
        
        const isPlayer = currentEntity.type === 'player';
        this.turnIndicator.textContent = `${currentEntity.name}'s Turn`;
        
        // Different colors for player vs enemy
        if (isPlayer) {
            this.turnIndicator.style.backgroundColor = '#ffefefff';
        } else {
            this.turnIndicator.style.backgroundColor = '#ebebffff';
        }
    }

    // Destroy the turn manager
    destroy() {
        if (this.turnIndicator && this.turnIndicator.parentNode) {
            this.turnIndicator.parentNode.removeChild(this.turnIndicator);
        }
        this.clearEntities();
    }
}
