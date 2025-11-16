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
        
        // Health-based behavior: retreat if low health
        const healthPercent = (this.currentHealth / this.maxHealth);
        
        if (healthPercent <= 0.3 && !this.isPlayerAdjacent()) {
            // Low health and not adjacent - retreat
            this.retreat();
        } else if (this.isPlayerAdjacent()) {
            // Adjacent to player - attack
            this.attackPlayer();
        } else {
            // Normal behavior - move toward player
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

    // A* pathfinding to find optimal path to target
    findPath(targetX, targetY) {
        const grid = this.mapGenerator.getGrid();
        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const startKey = `${this.x},${this.y}`;
        const targetKey = `${targetX},${targetY}`;
        
        openSet.push({ x: this.x, y: this.y });
        gScore.set(startKey, 0);
        fScore.set(startKey, this.manhattanDistance(this.x, this.y, targetX, targetY));
        
        while (openSet.length > 0) {
            // Find node with lowest fScore
            openSet.sort((a, b) => {
                const aKey = `${a.x},${a.y}`;
                const bKey = `${b.x},${b.y}`;
                return (fScore.get(aKey) || Infinity) - (fScore.get(bKey) || Infinity);
            });
            
            const current = openSet.shift();
            const currentKey = `${current.x},${current.y}`;
            
            // Reached target
            if (currentKey === targetKey) {
                return this.reconstructPath(cameFrom, current);
            }
            
            closedSet.add(currentKey);
            
            // Check all neighbors
            const neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 }
            ];
            
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                // Skip if already evaluated or invalid
                if (closedSet.has(neighborKey)) continue;
                if (!this.isValidMove(neighbor.x, neighbor.y)) continue;
                
                // Skip if occupied by player (unless it's the target)
                if (grid[neighbor.y][neighbor.x].hasPlayer && neighborKey !== targetKey) continue;
                
                const tentativeGScore = (gScore.get(currentKey) || Infinity) + 1;
                
                if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
                    continue;
                }
                
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + this.manhattanDistance(neighbor.x, neighbor.y, targetX, targetY));
            }
        }
        
        return null; // No path found
    }
    
    // Manhattan distance heuristic
    manhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
    
    // Reconstruct path from A* result
    reconstructPath(cameFrom, current) {
        const path = [{ x: current.x, y: current.y }];
        let currentKey = `${current.x},${current.y}`;
        
        while (cameFrom.has(currentKey)) {
            current = cameFrom.get(currentKey);
            currentKey = `${current.x},${current.y}`;
            path.unshift({ x: current.x, y: current.y });
        }
        
        return path;
    }
    
    // Make a single move toward player using A*
    makeMove() {
        if (this.currentMovementPoints <= 0) {
            return;
        }
        
        // Find path to player
        const path = this.findPath(this.player.x, this.player.y);
        
        if (path && path.length > 1) {
            // path[0] is current position, path[1] is next step
            const nextStep = path[1];
            this.moveTo(nextStep.x, nextStep.y);
        } else {
            // No path found, end turn
            this.currentMovementPoints = 0;
            this.turnManager.updateMovementIndicator(this.currentMovementPoints, this.maxMovementPoints);
            this.turnManager.endTurn();
        }
    }
    
    // Retreat away from player using A*
    retreat() {
        if (this.currentMovementPoints <= 0) {
            return;
        }
        
        // Find the valid position farthest from player
        const grid = this.mapGenerator.getGrid();
        const possibleMoves = [
            { x: this.x + 1, y: this.y },
            { x: this.x - 1, y: this.y },
            { x: this.x, y: this.y + 1 },
            { x: this.x, y: this.y - 1 }
        ];
        
        let bestMove = null;
        let maxDistance = -1;
        
        for (const move of possibleMoves) {
            if (this.isValidMove(move.x, move.y) && !grid[move.y][move.x].hasPlayer) {
                const distance = this.manhattanDistance(move.x, move.y, this.player.x, this.player.y);
                if (distance > maxDistance) {
                    maxDistance = distance;
                    bestMove = move;
                }
            }
        }
        
        if (bestMove) {
            this.moveTo(bestMove.x, bestMove.y);
        } else {
            // Can't retreat, end turn
            this.currentMovementPoints = 0;
            this.turnManager.updateMovementIndicator(this.currentMovementPoints, this.maxMovementPoints);
            this.turnManager.endTurn();
        }
    }
    
    // Move to specific position
    moveTo(newX, newY) {
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
        
        // Continue moving if points remain and not adjacent to player
        if (this.currentMovementPoints > 0 && !this.isPlayerAdjacent()) {
            const healthPercent = (this.currentHealth / this.maxHealth);
            if (healthPercent <= 0.3) {
                // Continue retreating
                setTimeout(() => this.retreat(), 300);
            } else {
                // Continue approaching
                setTimeout(() => this.makeMove(), 300);
            }
        } else {
            // No more moves or adjacent to player, end turn
            this.turnManager.endTurn();
        }
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
