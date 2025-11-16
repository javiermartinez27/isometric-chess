// Enemy Module
class Enemy {
    constructor(config, mapElement, mapContainer, mapGenerator, player, turnManager) {
        this.config = config;
        this.mapElement = mapElement;
        this.mapContainer = mapContainer;
        this.mapGenerator = mapGenerator;
        this.player = player;
        this.turnManager = turnManager;
        this.x = 0;
        this.y = 0;
        this.element = null;
        this.maxMovementPoints = 5;  // Can be configured per enemy
        this.currentMovementPoints = 5;
    }

    // Create the enemy
    create() {
        // Find a valid starting position (has ground, no pillar)
        let validPosition = false;
        const grid = this.mapGenerator.getGrid();
        
        while (!validPosition) {
            this.x = Math.floor(Math.random() * this.config.mapWidth);
            this.y = Math.floor(Math.random() * this.config.mapHeight);
            
            if (this.mapGenerator.isValidPosition(this.x, this.y)) {
                validPosition = true;
            }
        }
        
        // Mark enemy position in grid
        grid[this.y][this.x].hasEnemy = true;
        
        // Create enemy element
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        const enemySize = 10 * this.config.scale;
        this.element.style.width = `${enemySize}px`;
        this.element.style.height = `${enemySize}px`;
        this.element.style.backgroundColor = 'blue';
        this.element.style.borderRadius = '50%';
        this.element.style.zIndex = '1';
        
        // Position the enemy
        this.updatePosition();
        
        // Add enemy to map
        this.mapElement.appendChild(this.element);
    }

    // Update enemy position on screen
    updatePosition() {
        const isoX = (this.x - this.y) * (this.config.tileSize / 2) * this.config.scale;
        const isoY = (this.x + this.y) * (this.config.tileSize / 4) * this.config.scale;
        
        const offsetX = this.config.mapWidth * this.config.tileSize * this.config.scale;
        const offsetY = this.config.tileSize * 2 * this.config.scale;
        const enemySize = 10 * this.config.scale;
        this.element.style.left = `${isoX + offsetX + (this.config.tileSize * this.config.scale) / 2 - enemySize / 2}px`;
        this.element.style.top = `${isoY + offsetY + (this.config.tileSize * this.config.scale) / 2 - enemySize - 15}px`;
        this.element.style.width = `${enemySize}px`;
        this.element.style.height = `${enemySize}px`;
    }

    // Get remaining movement points
    getRemainingMoves() {
        return this.currentMovementPoints;
    }

    // Get max movement points
    getMaxMoves() {
        return this.maxMovementPoints;
    }

    // Take turn (called by TurnManager after delay)
    takeTurn() {
        // Reset movement points at start of turn
        this.currentMovementPoints = this.maxMovementPoints;
        
        // Move multiple times
        this.makeMove();
    }

    // Make a single move
    makeMove() {
        if (this.currentMovementPoints <= 0) {
            return;
        }
        // Calculate direction to player
        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        
        // Create list of possible moves prioritized by distance to player
        const moves = [];
        
        // Prioritize moving closer on the axis with greater distance
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal movement is more important
            if (dx > 0) {
                moves.push({ dx: 1, dy: 0, priority: 1 });   // Right (towards player)
            } else if (dx < 0) {
                moves.push({ dx: -1, dy: 0, priority: 1 });  // Left (towards player)
            }
            
            if (dy > 0) {
                moves.push({ dx: 0, dy: 1, priority: 2 });   // Down
            } else if (dy < 0) {
                moves.push({ dx: 0, dy: -1, priority: 2 });  // Up
            }
        } else {
            // Vertical movement is more important
            if (dy > 0) {
                moves.push({ dx: 0, dy: 1, priority: 1 });   // Down (towards player)
            } else if (dy < 0) {
                moves.push({ dx: 0, dy: -1, priority: 1 });  // Up (towards player)
            }
            
            if (dx > 0) {
                moves.push({ dx: 1, dy: 0, priority: 2 });   // Right
            } else if (dx < 0) {
                moves.push({ dx: -1, dy: 0, priority: 2 });  // Left
            }
        }
        
        // Add perpendicular moves as fallback
        if (dx !== 0) {
            moves.push({ dx: 0, dy: 1, priority: 3 });   // Down
            moves.push({ dx: 0, dy: -1, priority: 3 });  // Up
        }
        if (dy !== 0) {
            moves.push({ dx: 1, dy: 0, priority: 3 });   // Right
            moves.push({ dx: -1, dy: 0, priority: 3 });  // Left
        }
        
        // Try moves in priority order
        for (const move of moves) {
            const newX = this.x + move.dx;
            const newY = this.y + move.dy;
            
            if (this.isValidMove(newX, newY)) {
                const grid = this.mapGenerator.getGrid();
                
                // Update grid - remove enemy from old position
                grid[this.y][this.x].hasEnemy = false;
                
                // Move enemy
                this.x = newX;
                this.y = newY;
                
                // Update grid - add enemy to new position
                grid[this.y][this.x].hasEnemy = true;
                
                this.updatePosition();
                
                // Decrease movement points
                this.currentMovementPoints--;
                this.turnManager.updateMovementIndicator(this.currentMovementPoints, this.maxMovementPoints);
                
                // Continue moving if points remain
                if (this.currentMovementPoints > 0) {
                    setTimeout(() => this.makeMove(), 300);  // Small delay between moves
                } else {
                    // No more moves, end turn
                    this.turnManager.endTurn();
                }
                return;  // Successfully moved
            }
        }
        
        // If no valid move found, use up remaining movement points and end turn
        this.currentMovementPoints = 0;
        this.turnManager.updateMovementIndicator(this.currentMovementPoints, this.maxMovementPoints);
        this.turnManager.endTurn();
    }

    // Check if a move is valid
    isValidMove(x, y) {
        return this.mapGenerator.isValidPosition(x, y);
    }

    // Destroy the enemy
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        const grid = this.mapGenerator.getGrid();
        if (grid[this.y] && grid[this.y][this.x]) {
            grid[this.y][this.x].hasEnemy = false;
        }
    }
}
