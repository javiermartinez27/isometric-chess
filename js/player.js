// Player Module
class Player {
    constructor(config, mapElement, mapContainer, mapGenerator, turnManager) {
        this.config = config;
        this.mapElement = mapElement;
        this.mapContainer = mapContainer;
        this.mapGenerator = mapGenerator;
        this.turnManager = turnManager;
        this.x = 0;
        this.y = 0;
        this.element = null;
        this.healthBar = null;
        this.maxMovementPoints = 5;  // Can be upgraded
        this.currentMovementPoints = 5;
        this.maxHealth = 10;
        this.currentHealth = 10;
        this.attackPoints = 1;  // Can be upgraded
        this.isSelectingAttackDirection = false;
        this.isSelectingSpellDirection = false;
        this.animator = null;
        this.animationFrameId = null;
        this.magicSystem = null;
        this.spellTargetIndicators = []; // Visual indicators for spell targets
    }

    // Create the player
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

        // Mark player position in grid
        grid[this.y][this.x].hasPlayer = true;

        // Create player element
        this.element = document.createElement('div');
        this.element.className = 'player-sprite';
        this.element.style.position = 'absolute';
        const playerSize = 120 * this.config.scale;  // Larger to accommodate sprite
        this.element.style.width = `${playerSize}px`;
        this.element.style.height = `${playerSize}px`;
        this.element.style.imageRendering = 'pixelated';  // Crisp pixel art

        // Position the player
        this.updatePosition();

        // Add player to map
        this.mapElement.appendChild(this.element);

        // Initialize sprite animator
        this.initializeAnimator();

        // Create health bar
        this.createHealthBar();

        // Start animation loop
        this.startAnimationLoop();
    }

    // Update player position on screen
    updatePosition() {
        const isoX = (this.x - this.y) * (this.config.tileSize / 2) * this.config.scale;
        const isoY = (this.x + this.y) * (this.config.tileSize / 4) * this.config.scale;

        const offsetX = this.config.mapWidth * this.config.tileSize * this.config.scale;
        const offsetY = this.config.tileSize * 2 * this.config.scale;
        const playerSize = 120 * this.config.scale;  // Match sprite size
        this.element.style.left = `${isoX + offsetX + (this.config.tileSize * this.config.scale) / 2 - playerSize / 2}px`;
        this.element.style.top = `${isoY + offsetY + (this.config.tileSize * this.config.scale) / 2 - playerSize + 80}px`;
        this.element.style.width = `${playerSize}px`;
        this.element.style.height = `${playerSize}px`;
        this.element.style.zIndex = this.mapGenerator.calculateZIndex(this.x, this.y);

        // Center camera on player
        this.centerCamera();
    }

    // Center the camera on the player
    centerCamera() {
        const isoX = (this.x - this.y) * (this.config.tileSize / 2) * this.config.scale;
        const isoY = (this.x + this.y) * (this.config.tileSize / 4) * this.config.scale;

        const offsetX = this.config.mapWidth * this.config.tileSize * this.config.scale;
        const offsetY = this.config.tileSize * 2 * this.config.scale;

        // Calculate the player's absolute position in the map
        const playerScreenX = isoX + offsetX + this.config.tileSize / 2;
        const playerScreenY = isoY + offsetY + this.config.tileSize / 2;

        // Get viewport dimensions
        const viewportWidth = this.mapContainer.clientWidth;
        const viewportHeight = this.mapContainer.clientHeight;

        // Calculate scroll position to center player
        const scrollX = playerScreenX - viewportWidth / 2;
        const scrollY = playerScreenY - viewportHeight / 2;

        // Smooth scroll to player position
        this.mapContainer.scrollTo({
            left: scrollX,
            top: scrollY,
            behavior: 'smooth'
        });
    }

    // Start player's turn
    startTurn() {
        this.currentMovementPoints = this.maxMovementPoints;
        this.isSelectingAttackDirection = false;
        this.isSelectingSpellDirection = false;
        // Update spell cooldowns
        if (this.magicSystem) {
            this.magicSystem.updateCooldowns();
        }
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
        const isoY = (this.x + this.y) * (this.config.tileSize / 4) * this.config.scale - 70;

        const offsetX = this.config.mapWidth * this.config.tileSize * this.config.scale;
        const offsetY = this.config.tileSize * 2 * this.config.scale;

        this.healthBar.style.left = `${isoX + offsetX + (this.config.tileSize * this.config.scale) / 2 - 20}px`;
        this.healthBar.style.top = `${isoY + offsetY}px`;

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
            this.turnManager.gameOver();
        }
    }

    // Start attack mode
    startAttack() {
        if (!this.turnManager.isEntityTurn(this) || this.currentMovementPoints <= 0) {
            return;
        }
        this.isSelectingAttackDirection = true;
        this.turnManager.showAttackDirectionPrompt();
    }

    // Attack in a direction
    attack(direction) {
        if (!this.isSelectingAttackDirection) return;

        let targetX = this.x;
        let targetY = this.y;

        switch (direction) {
            case 'up': targetY--; break;
            case 'down': targetY++; break;
            case 'left': targetX--; break;
            case 'right': targetX++; break;
        }

        // Check if target is in bounds
        if (targetX < 0 || targetX >= this.config.mapWidth ||
            targetY < 0 || targetY >= this.config.mapHeight) {
            this.isSelectingAttackDirection = false;
            this.turnManager.hideAttackDirectionPrompt();
            return;
        }

        // Play attack animation
        this.playAttackAnimation();

        // Check if enemy is at target position
        const grid = this.mapGenerator.getGrid();
        if (grid[targetY][targetX].hasEnemy) {
            // Find and damage the enemy
            const enemy = this.turnManager.getEntityAt(targetX, targetY);
            if (enemy) {
                enemy.takeDamage(this.attackPoints);
            }
        }

        // Attack consumes all remaining movement points and ends turn
        this.currentMovementPoints = 0;
        this.turnManager.updateMovementIndicator(this.currentMovementPoints, this.maxMovementPoints);

        this.isSelectingAttackDirection = false;
        this.turnManager.hideAttackDirectionPrompt();

        // End turn
        this.turnManager.endTurn();
    }

    // Get remaining movement points
    getRemainingMoves() {
        return this.currentMovementPoints;
    }

    // Get max movement points
    getMaxMoves() {
        return this.maxMovementPoints;
    }

    // Upgrade movement points (for future upgrades)
    upgradeMovement(additionalPoints) {
        this.maxMovementPoints += additionalPoints;
    }

    // Handle keyboard input
    handleKeyPress(event) {
        // Handle spell direction selection
        if (this.isSelectingSpellDirection) {
            switch (event.key) {
                case 'ArrowUp':
                    event.preventDefault();
                    this.castSpell('up');
                    return;
                case 'ArrowDown':
                    event.preventDefault();
                    this.castSpell('down');
                    return;
                case 'ArrowLeft':
                    event.preventDefault();
                    this.castSpell('left');
                    return;
                case 'ArrowRight':
                    event.preventDefault();
                    this.castSpell('right');
                    return;
                case 'Escape':
                    this.isSelectingSpellDirection = false;
                    this.turnManager.hideSpellDirectionPrompt();
                    this.hideSpellTargetIndicators();
                    return;
            }
            return;
        }

        // Handle attack direction selection
        if (this.isSelectingAttackDirection) {
            switch (event.key) {
                case 'ArrowUp':
                    event.preventDefault();
                    this.attack('up');
                    return;
                case 'ArrowDown':
                    event.preventDefault();
                    this.attack('down');
                    return;
                case 'ArrowLeft':
                    event.preventDefault();
                    this.attack('left');
                    return;
                case 'ArrowRight':
                    event.preventDefault();
                    this.attack('right');
                    return;
                case 'Escape':
                    this.isSelectingAttackDirection = false;
                    this.turnManager.hideAttackDirectionPrompt();
                    return;
            }
            return;
        }

        // Handle attack button
        if (event.key === 'a' || event.key === 'A') {
            this.startAttack();
            return;
        }

        // Handle spell casting button
        if (event.key === 's' || event.key === 'S') {
            this.startSpellCast();
            return;
        }

        // Only allow movement if it's player's turn and they have movement points
        if (!this.turnManager.isEntityTurn(this) || this.currentMovementPoints <= 0) {
            return;
        }

        let newX = this.x;
        let newY = this.y;

        switch (event.key) {
            case 'ArrowUp':
                newY--;
                break;
            case 'ArrowDown':
                newY++;
                break;
            case 'ArrowLeft':
                newX--;
                break;
            case 'ArrowRight':
                newX++;
                break;
            default:
                return;  // Ignore other keys
        }

        // Prevent default arrow key behavior (scrolling)
        event.preventDefault();

        // Check if move is valid
        if (this.isValidMove(newX, newY)) {
            const grid = this.mapGenerator.getGrid();

            // Check if space is occupied by enemy
            if (grid[newY][newX].hasEnemy) {
                return; // Can't move into enemy space
            }

            // Update grid - remove player from old position
            grid[this.y][this.x].hasPlayer = false;

            // Move player
            this.x = newX;
            this.y = newY;

            // Update grid - add player to new position
            grid[this.y][this.x].hasPlayer = true;

            this.updatePosition();
            this.updateHealthBar();

            // Decrease movement points
            this.currentMovementPoints--;
            this.turnManager.updateMovementIndicator(this.currentMovementPoints, this.maxMovementPoints);

            // End turn if no movement points left
            if (this.currentMovementPoints <= 0) {
                this.turnManager.endTurn();
            }
        }
    }

    // Check if a move is valid
    isValidMove(x, y) {
        return this.mapGenerator.isValidPosition(x, y);
    }

    // Initialize sprite animator
    initializeAnimator() {
        this.animator = new SpriteAnimator(this.element, this.config);

        // Add animations
        this.animator.addAnimation(
            'idle',
            'art/player/Idle.png',
            8,  // 8 frames
            10, // 10 fps
            true // loop
        );

        this.animator.addAnimation(
            'attack',
            'art/player/Attack1.png',
            5,  // 5 frames
            12, // 12 fps
            false // don't loop
        );

        // Start with idle animation
        this.animator.play('idle');
    }

    // Start animation loop
    startAnimationLoop() {
        const animate = (currentTime) => {
            if (this.animator) {
                this.animator.update(currentTime);
            }
            this.animationFrameId = requestAnimationFrame(animate);
        };
        this.animationFrameId = requestAnimationFrame(animate);
    }

    // Play attack animation
    playAttackAnimation() {
        if (this.animator) {
            this.animator.play('attack', () => {
                // Return to idle after attack completes
                this.animator.play('idle');
            });
        }
    }

    // Initialize magic system
    initializeMagicSystem() {
        this.magicSystem = new MagicSystem(this.config, this.mapElement, this.mapGenerator);

        // Add fireball spell
        this.magicSystem.addSpell(new Fireball());
        this.magicSystem.addSpell(new Lightning());

        // Can add more spells here in the future
        // this.magicSystem.addSpell(new LightningBolt());
        // this.magicSystem.addSpell(new Meteor());
    }

    // Start spell casting mode
    startSpellCast() {
        if (!this.turnManager.isEntityTurn(this) || this.currentMovementPoints <= 0) {
            return;
        }

        if (!this.magicSystem) {
            return;
        }

        const activeSpell = this.magicSystem.getActiveSpell();
        if (!activeSpell || !activeSpell.isReady()) {
            return;
        }

        this.isSelectingSpellDirection = true;
        this.turnManager.showSpellDirectionPrompt(activeSpell);

        // Show target indicators for all possible directions
        this.showSpellTargetIndicators();
    }

    // Cast spell in a direction
    castSpell(direction) {
        if (!this.isSelectingSpellDirection || !this.magicSystem) return;

        // Hide target indicators
        this.hideSpellTargetIndicators();

        const success = this.magicSystem.castSpell(
            this.x,
            this.y,
            direction,
            (targetX, targetY, damage) => {
                // Check if enemy is at target position
                const grid = this.mapGenerator.getGrid();
                if (targetX >= 0 && targetX < this.config.mapWidth &&
                    targetY >= 0 && targetY < this.config.mapHeight &&
                    grid[targetY][targetX].hasEnemy) {
                    // Find and damage the enemy
                    const enemy = this.turnManager.getEntityAt(targetX, targetY);
                    if (enemy) {
                        enemy.takeDamage(damage);
                    }
                }
            }
        );

        if (success) {
            // Spell casting consumes all remaining movement points and ends turn
            this.currentMovementPoints = 0;
            this.turnManager.updateMovementIndicator(this.currentMovementPoints, this.maxMovementPoints);

            this.isSelectingSpellDirection = false;
            this.turnManager.hideSpellDirectionPrompt();

            // End turn after a short delay to see the spell effect
            setTimeout(() => {
                this.turnManager.endTurn();
            }, 500);
        }
    }

    // Switch to next spell
    switchSpell() {
        if (this.magicSystem) {
            this.magicSystem.nextSpell();
            return this.magicSystem.getActiveSpell();
        }
        return null;
    }

    // Get current spell
    getCurrentSpell() {
        return this.magicSystem ? this.magicSystem.getActiveSpell() : null;
    }

    // Show spell target indicators
    showSpellTargetIndicators() {
        // Clear any existing indicators first
        this.hideSpellTargetIndicators();

        const activeSpell = this.magicSystem.getActiveSpell();
        if (!activeSpell) return;

        const directions = ['up', 'down', 'left', 'right'];
        const uniqueTiles = new Set(); // Track unique tiles to avoid duplicates

        directions.forEach(direction => {
            const affectedTiles = activeSpell.getAffectedTiles(this.x, this.y, direction);

            affectedTiles.forEach(tile => {
                // Only show indicator if tile is in bounds
                if (tile.x >= 0 && tile.x < this.config.mapWidth &&
                    tile.y >= 0 && tile.y < this.config.mapHeight) {
                    const tileKey = `${tile.x},${tile.y}`;
                    if (!uniqueTiles.has(tileKey)) {
                        uniqueTiles.add(tileKey);
                        this.createTargetIndicator(tile.x, tile.y);
                    }
                }
            });
        });
    }

    // Create a single target indicator
    createTargetIndicator(x, y) {
        const indicator = document.createElement('div');
        indicator.className = 'spell-target-indicator';
        indicator.style.position = 'absolute';

        // Make the indicator smaller than the full tile
        const indicatorSize = this.config.tileSize * this.config.scale * 0.5; // 70% of tile size
        indicator.style.width = `${indicatorSize}px`;
        indicator.style.height = `${indicatorSize}px`;
        indicator.style.border = '3px solid #9C27B0';
        indicator.style.backgroundColor = 'rgba(156, 39, 176, 0.2)';
        indicator.style.pointerEvents = 'none';
        indicator.style.borderRadius = '4px';
        indicator.style.boxSizing = 'border-box';

        // Calculate isometric position
        const isoX = (x - y) * (this.config.tileSize / 2) * this.config.scale;
        const isoY = (x + y) * (this.config.tileSize / 4) * this.config.scale;
        const offsetX = this.config.mapWidth * this.config.tileSize * this.config.scale;
        const offsetY = this.config.tileSize * 2 * this.config.scale - 25; // Added small Y offset

        // Center the smaller indicator on the tile
        const centerOffset = (this.config.tileSize * this.config.scale - indicatorSize) / 2;
        indicator.style.left = `${isoX + offsetX + centerOffset}px`;
        indicator.style.top = `${isoY + offsetY + centerOffset}px`;
        indicator.style.zIndex = this.mapGenerator.calculateZIndex(x, y) - 1;

        // Add pulsing animation
        indicator.style.animation = 'spell-target-pulse 1s infinite';

        this.mapElement.appendChild(indicator);
        this.spellTargetIndicators.push(indicator);
    }

    // Hide all spell target indicators
    hideSpellTargetIndicators() {
        this.spellTargetIndicators.forEach(indicator => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        });
        this.spellTargetIndicators = [];
    }

    // Cleanup (for map regeneration)
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        if (this.healthBar && this.healthBar.parentNode) {
            this.healthBar.parentNode.removeChild(this.healthBar);
        }
    }
}
