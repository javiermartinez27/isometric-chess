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
        this.healthBar = null;
        this.maxMovementPoints = 5;  // Can be configured per enemy
        this.currentMovementPoints = 5;
        this.maxHealth = 5;
        this.currentHealth = 5;
        this.attackPoints = 1;
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
        
        // Create health bar
        this.createHealthBar();
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
        this.updateHealthBar();
    }

    // Create health bar
    createHealthBar() {
        this.healthBar = document.createElement('div');
        this.healthBar.className = 'health-bar';
        this.healthBar.innerHTML = `
            <div class="health-bar-bg">
                <div class="health-bar-fill" style="width: 100%"></div>
            </div>
        `;
        this.mapElement.appendChild(this.healthBar);
        this.updateHealthBar();
    }

    // Update health bar position and value
    updateHealthBar() {
        if (!this.healthBar) return;
        
        const isoX = (this.x - this.y) * (this.config.tileSize / 2) * this.config.scale;
        const isoY = (this.x + this.y) * (this.config.tileSize / 4) * this.config.scale;
        
        const offsetX = this.config.mapWidth * this.config.tileSize * this.config.scale;
        const offsetY = this.config.tileSize * 2 * this.config.scale;
        
        this.healthBar.style.left = `${isoX + offsetX + (this.config.tileSize * this.config.scale) / 2 - 20}px`;
        this.healthBar.style.top = `${isoY + offsetY - 25}px`;
        
        const healthPercent = (this.currentHealth / this.maxHealth) * 100;
        const fillElement = this.healthBar.querySelector('.health-bar-fill');
        fillElement.style.width = `${healthPercent}%`;
        
        // Color based on health
        if (healthPercent > 60) {
            fillElement.style.backgroundColor = '#4CAF50';
        } else if (healthPercent > 30) {
            fillElement.style.backgroundColor = '#FFC107';
        } else {
            fillElement.style.backgroundColor = '#F44336';
        }
    }

    // Take damage
    takeDamage(amount) {
        this.currentHealth -= amount;
        if (this.currentHealth < 0) this.currentHealth = 0;
        this.updateHealthBar();
        
        if (this.currentHealth <= 0) {
            this.die();
        }
    }

    // Die and remove from game
    die() {
        const grid = this.mapGenerator.getGrid();
        grid[this.y][this.x].hasEnemy = false;
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        if (this.healthBar && this.healthBar.parentNode) {
            this.healthBar.parentNode.removeChild(this.healthBar);
        }
        
        // Remove from turn manager
        this.turnManager.removeEntity(this);
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
        
        // Decide: attack if player is adjacent, otherwise move
        if (this.isPlayerAdjacent()) {
            this.attackPlayer();
        } else {
            this.makeMove();
        }
    }

    // Check if player is adjacent
    isPlayerAdjacent() {
        const dx = Math.abs(this.player.x - this.x);
        const dy = Math.abs(this.player.y - this.y);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    // Attack the player
    attackPlayer() {
        this.player.takeDamage(this.attackPoints);
        this.currentMovementPoints = 0;
        this.turnManager.updateMovementIndicator(0, this.maxMovementPoints);
        this.turnManager.endTurn();
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
                
                // Check if space is occupied by player
                if (grid[newY][newX].hasPlayer) {
                    continue; // Can't move into player space, try next move
                }
                
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

    // Destroy the enemy (for map clear)
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        if (this.healthBar && this.healthBar.parentNode) {
            this.healthBar.parentNode.removeChild(this.healthBar);
        }
        const grid = this.mapGenerator.getGrid();
        if (grid[this.y] && grid[this.y][this.x]) {
            grid[this.y][this.x].hasEnemy = false;
        }
    }
}
