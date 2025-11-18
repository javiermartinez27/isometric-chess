// Magic System - Extensible spell system with cooldowns, damage, and attack shapes

// Base Spell class
class Spell {
    constructor(name, damage, cooldown, shape, spritePath, animationFrames = 1, animationFps = 10) {
        this.name = name;
        this.damage = damage;
        this.cooldown = cooldown; // in turns
        this.currentCooldown = 0;
        this.shape = shape; // AttackShape instance
        this.spritePath = spritePath;
        this.animationFrames = animationFrames;
        this.animationFps = animationFps;
    }

    // Check if spell is ready to cast
    isReady() {
        return this.currentCooldown === 0;
    }

    // Use the spell (starts cooldown)
    use() {
        if (!this.isReady()) {
            return false;
        }
        this.currentCooldown = this.cooldown;
        return true;
    }

    // Reduce cooldown by 1 turn
    reduceCooldown() {
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
        }
    }

    // Reset cooldown
    resetCooldown() {
        this.currentCooldown = 0;
    }

    // Get affected tiles based on origin and direction
    getAffectedTiles(originX, originY, direction) {
        return this.shape.getAffectedTiles(originX, originY, direction);
    }
}

// Attack Shape classes define which tiles are affected by a spell
class AttackShape {
    getAffectedTiles(originX, originY, direction) {
        // Override in subclasses
        return [];
    }
}

// Single tile in front of caster
class SingleTileShape extends AttackShape {
    getAffectedTiles(originX, originY, direction) {
        let targetX = originX;
        let targetY = originY;
        
        switch(direction) {
            case 'up': targetY--; break;
            case 'down': targetY++; break;
            case 'left': targetX--; break;
            case 'right': targetX++; break;
        }
        
        return [{ x: targetX, y: targetY }];
    }
}

// Single tile at a specific range in a direction
class RangedSingleTileShape extends AttackShape {
    constructor(range) {
        super();
        this.range = range;
    }

    getAffectedTiles(originX, originY, direction) {
        let targetX = originX;
        let targetY = originY;
        
        switch(direction) {
            case 'up': targetY -= this.range; break;
            case 'down': targetY += this.range; break;
            case 'left': targetX -= this.range; break;
            case 'right': targetX += this.range; break;
        }
        
        return [{ x: targetX, y: targetY }];
    }
}

// Line of tiles in a direction (range)
class LineShape extends AttackShape {
    constructor(range) {
        super();
        this.range = range;
    }

    getAffectedTiles(originX, originY, direction) {
        const tiles = [];
        let dx = 0, dy = 0;
        
        switch(direction) {
            case 'up': dy = -1; break;
            case 'down': dy = 1; break;
            case 'left': dx = -1; break;
            case 'right': dx = 1; break;
        }
        
        for (let i = 1; i <= this.range; i++) {
            tiles.push({
                x: originX + (dx * i),
                y: originY + (dy * i)
            });
        }
        
        return tiles;
    }
}

// Area of effect (square around target)
class AoEShape extends AttackShape {
    constructor(radius) {
        super();
        this.radius = radius; // 1 = 3x3, 2 = 5x5, etc.
    }

    getAffectedTiles(originX, originY, direction) {
        const tiles = [];
        let centerX = originX;
        let centerY = originY;
        
        // First get the center tile based on direction
        switch(direction) {
            case 'up': centerY--; break;
            case 'down': centerY++; break;
            case 'left': centerX--; break;
            case 'right': centerX++; break;
        }
        
        // Then get all tiles in radius around center
        for (let dx = -this.radius; dx <= this.radius; dx++) {
            for (let dy = -this.radius; dy <= this.radius; dy++) {
                tiles.push({
                    x: centerX + dx,
                    y: centerY + dy
                });
            }
        }
        
        return tiles;
    }
}

// Cross shape (4 directions from center)
class CrossShape extends AttackShape {
    constructor(range) {
        super();
        this.range = range;
    }

    getAffectedTiles(originX, originY, direction) {
        const tiles = [];
        let centerX = originX;
        let centerY = originY;
        
        // First get the center tile based on direction
        switch(direction) {
            case 'up': centerY--; break;
            case 'down': centerY++; break;
            case 'left': centerX--; break;
            case 'right': centerX++; break;
        }
        
        // Add center
        tiles.push({ x: centerX, y: centerY });
        
        // Add tiles in all 4 directions from center
        for (let i = 1; i <= this.range; i++) {
            tiles.push({ x: centerX + i, y: centerY }); // right
            tiles.push({ x: centerX - i, y: centerY }); // left
            tiles.push({ x: centerX, y: centerY + i }); // down
            tiles.push({ x: centerX, y: centerY - i }); // up
        }
        
        return tiles;
    }
}

// Magic System Manager
class MagicSystem {
    constructor(config, mapElement, mapGenerator) {
        this.config = config;
        this.mapElement = mapElement;
        this.mapGenerator = mapGenerator;
        this.spells = [];
        this.activeSpellIndex = 0;
        this.projectiles = []; // Active spell projectiles/effects
    }

    // Add a spell to the system
    addSpell(spell) {
        this.spells.push(spell);
    }

    // Get current active spell
    getActiveSpell() {
        if (this.spells.length === 0) return null;
        return this.spells[this.activeSpellIndex];
    }

    // Switch to next spell
    nextSpell() {
        if (this.spells.length === 0) return;
        this.activeSpellIndex = (this.activeSpellIndex + 1) % this.spells.length;
    }

    // Switch to previous spell
    previousSpell() {
        if (this.spells.length === 0) return;
        this.activeSpellIndex = (this.activeSpellIndex - 1 + this.spells.length) % this.spells.length;
    }

    // Reduce cooldowns on all spells (called at start of turn)
    updateCooldowns() {
        for (const spell of this.spells) {
            spell.reduceCooldown();
        }
    }

    // Cast the active spell
    castSpell(casterX, casterY, direction, onHitCallback) {
        const spell = this.getActiveSpell();
        if (!spell || !spell.use()) {
            return false;
        }

        // Get affected tiles
        const affectedTiles = spell.getAffectedTiles(casterX, casterY, direction);
        
        // Create visual projectile/effect
        this.createSpellEffect(spell, casterX, casterY, affectedTiles, onHitCallback);
        
        return true;
    }

    // Create visual spell effect
    createSpellEffect(spell, originX, originY, affectedTiles, onHitCallback) {
        // For ranged single target spells, create one projectile that travels
        if (affectedTiles.length === 1) {
            const target = affectedTiles[0];
            this.createTravelingProjectile(spell, originX, originY, target.x, target.y, onHitCallback);
        } else {
            // For multi-tile spells, create a projectile for each affected tile
            affectedTiles.forEach((tile, index) => {
                // Delay each projectile slightly for visual effect
                setTimeout(() => {
                    this.createProjectile(spell, originX, originY, tile.x, tile.y, onHitCallback);
                }, index * 50);
            });
        }
    }

    // Create a traveling projectile that moves smoothly from start to target
    createTravelingProjectile(spell, startX, startY, targetX, targetY, onHitCallback) {
        // Check if target is in bounds
        if (targetX < 0 || targetX >= this.config.mapWidth || 
            targetY < 0 || targetY >= this.config.mapHeight) {
            return;
        }

        // Create projectile element
        const projectile = document.createElement('div');
        projectile.className = 'spell-projectile';
        projectile.style.position = 'absolute';
        const spriteSize = 16 * this.config.scale;
        projectile.style.width = `${spriteSize}px`;
        projectile.style.height = `${spriteSize}px`;
        projectile.style.imageRendering = 'pixelated';
        projectile.style.pointerEvents = 'none';
        projectile.style.zIndex = 10000;
        
        // Set sprite
        if (spell.spritePath) {
            projectile.style.backgroundImage = `url('${spell.spritePath}')`;
            projectile.style.backgroundSize = 'contain';
            projectile.style.backgroundRepeat = 'no-repeat';
            projectile.style.backgroundPosition = 'center';
        } else {
            projectile.style.backgroundColor = 'orange';
            projectile.style.borderRadius = '50%';
        }

        // Calculate positions
        const offsetX = this.config.mapWidth * this.config.tileSize * this.config.scale;
        const offsetY = this.config.tileSize * 2 * this.config.scale - 60;
        
        // Start position (center of player tile)
        const startIsoX = (startX - startY) * (this.config.tileSize / 2) * this.config.scale;
        const startIsoY = (startX + startY) * (this.config.tileSize / 4) * this.config.scale;
        const startLeft = startIsoX + offsetX + (this.config.tileSize * this.config.scale) / 2 - spriteSize / 2;
        const startTop = startIsoY + offsetY + (this.config.tileSize * this.config.scale) / 2 - spriteSize / 2;
        
        // Target position (center of target tile)
        const targetIsoX = (targetX - targetY) * (this.config.tileSize / 2) * this.config.scale;
        const targetIsoY = (targetX + targetY) * (this.config.tileSize / 4) * this.config.scale;
        const targetLeft = targetIsoX + offsetX + (this.config.tileSize * this.config.scale) / 2 - spriteSize / 2;
        const targetTop = targetIsoY + offsetY + (this.config.tileSize * this.config.scale) / 2 - spriteSize / 2;

        // Calculate distance for animation duration
        const distance = Math.sqrt(Math.pow(targetLeft - startLeft, 2) + Math.pow(targetTop - startTop, 2));
        const duration = Math.min(600, Math.max(300, distance / 2)); // Scale duration with distance

        // Set initial position
        projectile.style.left = `${startLeft}px`;
        projectile.style.top = `${startTop}px`;
        
        // Add to DOM
        this.mapElement.appendChild(projectile);

        // Force a reflow to ensure the initial position is rendered
        projectile.offsetHeight;
        
        // Set transition AFTER adding to DOM
        projectile.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
        
        // Trigger animation with a tiny delay to ensure transition is applied
        setTimeout(() => {
            projectile.style.left = `${targetLeft}px`;
            projectile.style.top = `${targetTop}px`;
        }, 10);

        // Handle impact after animation (duration + initial delay)
        setTimeout(() => {
            // Apply damage at target
            if (onHitCallback) {
                onHitCallback(targetX, targetY, spell.damage);
            }

            // Create impact effect
            this.createImpactEffect(targetLeft + spriteSize / 2, targetTop + spriteSize / 2);

            // Remove projectile
            if (projectile.parentNode) {
                projectile.parentNode.removeChild(projectile);
            }
        }, duration + 10);
    }

    // Create a single projectile (for multi-tile spells)
    createProjectile(spell, startX, startY, targetX, targetY, onHitCallback) {
        // Check if target is in bounds
        if (targetX < 0 || targetX >= this.config.mapWidth || 
            targetY < 0 || targetY >= this.config.mapHeight) {
            return;
        }

        // Create projectile element
        const projectile = document.createElement('div');
        projectile.className = 'spell-projectile';
        projectile.style.position = 'absolute';
        // Smaller size for the fireball sprite (it's a small sprite)
        const spriteSize = 16 * this.config.scale;
        projectile.style.width = `${spriteSize}px`;
        projectile.style.height = `${spriteSize}px`;
        projectile.style.imageRendering = 'pixelated';
        projectile.style.pointerEvents = 'none';
        projectile.style.zIndex = 10000; // Always on top
        
        // Set sprite
        if (spell.spritePath) {
            projectile.style.backgroundImage = `url('${spell.spritePath}')`;
            projectile.style.backgroundSize = 'contain';
            projectile.style.backgroundRepeat = 'no-repeat';
            projectile.style.backgroundPosition = 'center';
        } else {
            projectile.style.backgroundColor = 'orange';
            projectile.style.borderRadius = '50%';
        }

        // Calculate start position (center of player tile)
        const startIsoX = (startX - startY) * (this.config.tileSize / 2) * this.config.scale;
        const startIsoY = (startX + startY) * (this.config.tileSize / 4) * this.config.scale;
        const offsetX = this.config.mapWidth * this.config.tileSize * this.config.scale;
        const offsetY = this.config.tileSize * 2 * this.config.scale;
        
        // Center the projectile on the tile
        const startLeft = startIsoX + offsetX + (this.config.tileSize * this.config.scale) / 2 - spriteSize / 2;
        const startTop = startIsoY + offsetY + (this.config.tileSize * this.config.scale) / 2 - spriteSize / 2;
        
        projectile.style.left = `${startLeft}px`;
        projectile.style.top = `${startTop}px`;

        this.mapElement.appendChild(projectile);

        // Calculate target position (center of target tile)
        const targetIsoX = (targetX - targetY) * (this.config.tileSize / 2) * this.config.scale;
        const targetIsoY = (targetX + targetY) * (this.config.tileSize / 4) * this.config.scale;
        
        const targetLeft = targetIsoX + offsetX + (this.config.tileSize * this.config.scale) / 2 - spriteSize / 2;
        const targetTop = targetIsoY + offsetY + (this.config.tileSize * this.config.scale) / 2 - spriteSize / 2;

        // Animate projectile to target
        projectile.style.transition = 'all 0.3s ease-out';
        
        // Trigger animation on next frame
        requestAnimationFrame(() => {
            projectile.style.left = `${targetLeft}px`;
            projectile.style.top = `${targetTop}px`;
        });

        // Handle impact after animation
        setTimeout(() => {
            // Check if something is at target position and apply damage
            if (onHitCallback) {
                onHitCallback(targetX, targetY, spell.damage);
            }

            // Create impact effect
            this.createImpactEffect(targetLeft + spriteSize / 2, targetTop + spriteSize / 2);

            // Remove projectile
            if (projectile.parentNode) {
                projectile.parentNode.removeChild(projectile);
            }
        }, 300);
    }

    // Create impact effect
    createImpactEffect(x, y) {
        const impact = document.createElement('div');
        impact.style.position = 'absolute';
        impact.style.left = `${x}px`;
        impact.style.top = `${y}px`;
        impact.style.width = `${16 * this.config.scale}px`;
        impact.style.height = `${16 * this.config.scale}px`;
        impact.style.backgroundColor = 'orange';
        impact.style.borderRadius = '50%';
        impact.style.opacity = '0.8';
        impact.style.pointerEvents = 'none';
        impact.style.zIndex = 10001;
        impact.style.transition = 'all 0.2s ease-out';

        this.mapElement.appendChild(impact);

        // Animate impact
        requestAnimationFrame(() => {
            impact.style.transform = 'scale(2)';
            impact.style.opacity = '0';
        });

        // Remove after animation
        setTimeout(() => {
            if (impact.parentNode) {
                impact.parentNode.removeChild(impact);
            }
        }, 200);
    }

    // Get all spells
    getSpells() {
        return this.spells;
    }
}

// Predefined Spells

// Fireball - Ranged single target, moderate damage
class Fireball extends Spell {
    constructor() {
        super(
            'Fireball',
            2, // damage
            0, // cooldown (0 = no cooldown)
            new RangedSingleTileShape(3), // 5 tile range
            'art/player/FB001.png',
            1, // animation frames
            10 // animation fps
        );
    }
}

// Example: Lightning Bolt - Line attack
class LightningBolt extends Spell {
    constructor() {
        super(
            'Lightning Bolt',
            1, // damage per tile
            2, // cooldown (2 turns)
            new LineShape(3), // 3 tile range
            null, // no sprite yet
            1,
            10
        );
    }
}

// Example: Meteor - AoE attack
class Meteor extends Spell {
    constructor() {
        super(
            'Meteor',
            3, // damage
            3, // cooldown (3 turns)
            new AoEShape(1), // 3x3 area
            null, // no sprite yet
            1,
            10
        );
    }
}
