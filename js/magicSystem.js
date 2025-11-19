// Magic System - Extensible spell system with cooldowns, damage, and attack shapes

// Base Spell class
class Spell {
    constructor(name, damage, cooldown, shape, visualConfig) {
        this.name = name;
        this.damage = damage;
        this.cooldown = cooldown; // in turns
        this.currentCooldown = 0;
        this.shape = shape; // AttackShape instance
        this.visualConfig = visualConfig; // { type: 'sprite'|'css'|'svg', ... }
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

        switch (direction) {
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

        switch (direction) {
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

        switch (direction) {
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
        switch (direction) {
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
        switch (direction) {
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
        // Check for beam render type
        if (spell.visualConfig && spell.visualConfig.renderType === 'beam') {
            this.createBeamEffect(spell, originX, originY, affectedTiles, onHitCallback);
            return;
        }

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

    // Helper to get the center screen coordinates of a tile
    getTileCenter(x, y) {
        const isoX = (x - y) * (this.config.tileSize / 2) * this.config.scale;
        const isoY = (x + y) * (this.config.tileSize / 4) * this.config.scale;
        const offsetX = this.config.mapWidth * this.config.tileSize * this.config.scale;
        const offsetY = this.config.tileSize * 2 * this.config.scale;

        return {
            x: isoX + offsetX + (this.config.tileSize * this.config.scale) / 2,
            y: isoY + offsetY + (this.config.tileSize * this.config.scale) / 2
        };
    }

    // Create a continuous beam effect
    createBeamEffect(spell, startX, startY, affectedTiles, onHitCallback) {
        if (affectedTiles.length === 0) return;

        const startPos = this.getTileCenter(startX, startY);
        // Target the last tile in the line
        const lastTile = affectedTiles[affectedTiles.length - 1];
        const endPos = this.getTileCenter(lastTile.x, lastTile.y);

        // Calculate length and angle
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        // Create beam element
        const beam = document.createElement('div');
        beam.className = 'spell-beam';
        beam.style.position = 'absolute';
        beam.style.left = `${startPos.x}px`;
        beam.style.top = `${startPos.y}px`;
        beam.style.width = `${length}px`;
        beam.style.height = `${40 * this.config.scale}px`; // Height for the bolt visual
        beam.style.transformOrigin = '0 50%';
        beam.style.transform = `translateY(-50%) rotate(${angle}deg)`;
        beam.style.pointerEvents = 'none';
        beam.style.zIndex = 10000;

        // Render visual
        this.renderProjectileVisual(beam, spell.visualConfig);

        this.mapElement.appendChild(beam);

        // Apply damage and cleanup
        setTimeout(() => {
            // Apply damage to all tiles
            affectedTiles.forEach(tile => {
                if (onHitCallback) {
                    onHitCallback(tile.x, tile.y, spell.damage);
                }
                // Create impact effect on each tile
                const tilePos = this.getTileCenter(tile.x, tile.y);
                this.createImpactEffect(tilePos.x, tilePos.y);
            });

            // Fade out and remove
            beam.style.transition = 'opacity 0.2s';
            beam.style.opacity = '0';
            setTimeout(() => {
                if (beam.parentNode) {
                    beam.parentNode.removeChild(beam);
                }
            }, 200);
        }, 200); // Short delay for visual impact
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
        projectile.style.pointerEvents = 'none';
        projectile.style.zIndex = 10000;

        // Render visual based on config
        this.renderProjectileVisual(projectile, spell.visualConfig);

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

        // Render visual based on config
        this.renderProjectileVisual(projectile, spell.visualConfig);

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

    // Render visual for projectile
    renderProjectileVisual(element, config) {
        if (!config) {
            // Default fallback
            element.style.backgroundColor = 'orange';
            element.style.borderRadius = '50%';
            return;
        }

        if (config.type === 'sprite') {
            element.style.imageRendering = 'pixelated';
            element.style.backgroundImage = `url('${config.path}')`;
            element.style.backgroundSize = 'contain';
            element.style.backgroundRepeat = 'no-repeat';
            element.style.backgroundPosition = 'center';
        } else if (config.type === 'css') {
            // Apply CSS styles
            Object.assign(element.style, config.style);
            if (config.className) {
                element.classList.add(config.className);
            }
        } else if (config.type === 'svg') {
            // Create SVG element
            element.innerHTML = config.svgContent;
            // Ensure SVG fills the container
            const svg = element.querySelector('svg');
            if (svg) {
                svg.style.width = '100%';
                svg.style.height = '100%';
                svg.style.overflow = 'visible';
            }
        }
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
            new RangedSingleTileShape(3), // 3 tile range
            {
                type: 'css',
                style: {
                    background: 'radial-gradient(circle, #ffeb3b 20%, #ff9800 60%, #f44336 100%)',
                    borderRadius: '50%',
                    boxShadow: '0 0 10px #ff9800, 0 0 20px #f44336'
                },
                className: 'pulsing-fireball'
            }
        );
    }
}

// Lightning - Line attack
class Lightning extends Spell {
    constructor() {
        super(
            'Lightning',
            2, // damage
            2, // cooldown (2 turns)
            new LineShape(5), // 5 tile range
            {
                type: 'svg',
                renderType: 'beam',
                svgContent: `
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0,50 L20,30 L40,70 L60,30 L80,70 L100,50" stroke="#03a9f4" stroke-width="4" fill="none" filter="drop-shadow(0 0 5px #03a9f4)" vector-effect="non-scaling-stroke">
                            <animate attributeName="d" 
                                values="M0,50 L20,30 L40,70 L60,30 L80,70 L100,50; 
                                        M0,50 L20,70 L40,30 L60,70 L80,30 L100,50; 
                                        M0,50 L20,30 L40,70 L60,30 L80,70 L100,50" 
                                dur="0.1s" repeatCount="indefinite" />
                        </path>
                    </svg>
                `
            }
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
            {
                type: 'css',
                style: {
                    background: 'radial-gradient(circle, #5d4037 30%, #3e2723 100%)',
                    borderRadius: '50%',
                    border: '2px solid #ff5722',
                    boxShadow: '0 0 15px #ff5722'
                }
            }
        );
    }
}
