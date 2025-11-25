// Sprite Animation System
class SpriteAnimator {
    constructor(element, config) {
        this.element = element;
        this.config = config;
        this.animations = {};
        this.currentAnimation = null;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.isPlaying = false;
        this.loop = true;
        this.onComplete = null;
        this.lastFrameTime = 0;
        this.frameWidth = 0;
    }

    // Add an animation to the animator
    addAnimation(name, spriteSheet, frameCount, fps = 10, loop = true) {
        this.animations[name] = {
            spriteSheet: spriteSheet,
            frameCount: frameCount,
            fps: fps,
            loop: loop,
            frameDuration: 1000 / fps  // milliseconds per frame
        };
    }

    // Play a specific animation
    play(animationName, onComplete = null) {
        if (!this.animations[animationName]) {
            console.warn(`Animation "${animationName}" not found`);
            return;
        }

        // If already playing this animation, don't restart
        if (this.currentAnimation === animationName && this.isPlaying) {
            return;
        }

        this.currentAnimation = animationName;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.isPlaying = true;
        this.onComplete = onComplete;
        this.lastFrameTime = performance.now();

        const anim = this.animations[animationName];
        this.loop = anim.loop;

        // Calculate frame width based on element size
        const elementWidth = this.element.offsetWidth;

        // If element is not yet in DOM or has no width, default to config size or wait
        if (elementWidth === 0) {
            // Try again next frame
            requestAnimationFrame(() => this.play(animationName, onComplete));
            return;
        }

        this.frameWidth = elementWidth;

        // Set the sprite sheet as background
        this.element.style.backgroundImage = `url('${anim.spriteSheet}')`;
        this.element.style.backgroundRepeat = 'no-repeat';
        this.element.style.backgroundSize = `${anim.frameCount * 100}% 100%`;

        this.updateFrame();
    }

    // Update animation frame
    update(currentTime) {
        if (!this.isPlaying || !this.currentAnimation) return;

        const anim = this.animations[this.currentAnimation];
        const deltaTime = currentTime - this.lastFrameTime;

        this.frameTimer += deltaTime;

        // Check if it's time to advance to next frame
        if (this.frameTimer >= anim.frameDuration) {
            this.frameTimer = 0;
            this.currentFrame++;

            // Check if animation is complete
            if (this.currentFrame >= anim.frameCount) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = anim.frameCount - 1;
                    this.isPlaying = false;
                    if (this.onComplete) {
                        this.onComplete();
                    }
                }
            }

            this.updateFrame();
        }

        this.lastFrameTime = currentTime;
    }

    // Update the background position to show current frame
    updateFrame() {
        if (!this.currentAnimation) return;

        const anim = this.animations[this.currentAnimation];
        // Calculate percentage position: frameIndex / (totalFrames - 1) * 100
        // This works because background-size is set to (frameCount * 100)%
        const xPosition = (this.currentFrame / (anim.frameCount - 1)) * 100;
        this.element.style.backgroundPosition = `${xPosition}% 0%`;
    }

    // Stop the current animation
    stop() {
        this.isPlaying = false;
    }

    // Get current animation name
    getCurrentAnimation() {
        return this.currentAnimation;
    }

    // Check if animator is playing
    getIsPlaying() {
        return this.isPlaying;
    }
}
