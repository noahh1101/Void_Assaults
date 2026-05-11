// Player ship with inertia physics
import { wrapPosition } from './utils.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2;
        this.radius = 15;

        // Physics
        this.rotationSpeed = 0.065;
        this.thrustPower = 0.14;
        this.maxSpeed = 5;
        this.drag = 0.992;

        // Combat
        this.hp = 100;
        this.maxHp = 100;
        this.fireCooldown = 0;
        this.fireRate = 10;
        this.bulletSpeed = 8;

        // Special attack - NOVA CANNON
        this.specialCharge = 0;
        this.specialMaxCharge = 500; // requires dealing ~500 damage worth of hits
        this.specialReady = false;
        this.specialCooldown = 0; // short cooldown after firing
        this.specialGlowTimer = 0; // visual glow when ready

        // State
        this.invulnerable = 0;
        this.isThrusting = false;
        this.alive = true;

        // Power-ups
        this.rapidFire = 0;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2;
        this.hp = this.maxHp;
        this.alive = true;
        this.invulnerable = 0;
        this.fireCooldown = 0;
        this.rapidFire = 0;
        this.isThrusting = false;
        this.specialCharge = 0;
        this.specialReady = false;
        this.specialCooldown = 0;
        this.specialGlowTimer = 0;
    }

    update(keys, width, height) {
        if (!this.alive) return;

        // Rotation
        if (keys['ArrowLeft'] || keys['KeyA']) this.angle -= this.rotationSpeed;
        if (keys['ArrowRight'] || keys['KeyD']) this.angle += this.rotationSpeed;

        // Thrust
        this.isThrusting = !!(keys['ArrowUp'] || keys['KeyW']);
        if (this.isThrusting) {
            this.vx += Math.cos(this.angle) * this.thrustPower;
            this.vy += Math.sin(this.angle) * this.thrustPower;
        }

        // Speed limit
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }

        // Drag
        this.vx *= this.drag;
        this.vy *= this.drag;

        // Position
        this.x += this.vx;
        this.y += this.vy;

        // Screen wrap
        wrapPosition(this, width, height);

        // Cooldowns
        if (this.fireCooldown > 0) this.fireCooldown--;
        if (this.invulnerable > 0) this.invulnerable--;
        if (this.rapidFire > 0) this.rapidFire--;
        if (this.specialCooldown > 0) this.specialCooldown--;

        // Check if special is ready
        this.specialReady = this.specialCharge >= this.specialMaxCharge && this.specialCooldown <= 0;

        // Glow animation when special is ready
        if (this.specialReady) {
            this.specialGlowTimer += 0.06;
        } else {
            this.specialGlowTimer = 0;
        }
    }

    canShoot() {
        return this.fireCooldown <= 0 && this.alive;
    }

    shoot() {
        const rate = this.rapidFire > 0 ? Math.floor(this.fireRate / 2) : this.fireRate;
        this.fireCooldown = rate;
        return {
            x: this.x + Math.cos(this.angle) * 22,
            y: this.y + Math.sin(this.angle) * 22,
            vx: Math.cos(this.angle) * this.bulletSpeed + this.vx * 0.25,
            vy: Math.sin(this.angle) * this.bulletSpeed + this.vy * 0.25,
            owner: 'player'
        };
    }

    addSpecialCharge(amount) {
        if (this.specialCharge < this.specialMaxCharge) {
            this.specialCharge = Math.min(this.specialCharge + amount, this.specialMaxCharge);
        }
    }

    canShootSpecial() {
        return this.specialReady && this.alive;
    }

    shootSpecial() {
        this.specialCharge = 0;
        this.specialReady = false;
        this.specialGlowTimer = 0;
        this.specialCooldown = 60; // 1 second cooldown
        return {
            x: this.x + Math.cos(this.angle) * 30,
            y: this.y + Math.sin(this.angle) * 30,
            vx: Math.cos(this.angle) * 3.5,
            vy: Math.sin(this.angle) * 3.5,
            angle: this.angle
        };
    }

    takeDamage(amount) {
        if (this.invulnerable > 0 || !this.alive) return false;
        this.hp -= amount;
        this.invulnerable = 60;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
        return true;
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();

        // ── Special Ready Glow (drawn before rotation, around the ship) ──
        if (this.specialReady) {
            const glowPulse = Math.sin(this.specialGlowTimer) * 0.3 + 0.5;
            const glowRadius = 35 + Math.sin(this.specialGlowTimer * 1.5) * 8;

            // Outer glow ring
            ctx.save();
            ctx.globalAlpha = glowPulse * 0.3;
            const glow = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, glowRadius
            );
            glow.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
            glow.addColorStop(0.6, 'rgba(0, 200, 255, 0.1)');
            glow.addColorStop(1, 'rgba(0, 100, 255, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // Rotating energy ring
            ctx.globalAlpha = glowPulse * 0.5;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            for (let i = 0; i < 3; i++) {
                const a = this.specialGlowTimer * 2 + (i * Math.PI * 2 / 3);
                ctx.beginPath();
                ctx.arc(this.x, this.y, 28, a, a + 0.6);
                ctx.stroke();
            }
            ctx.restore();
        }

        // ── Ship drawing ──
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        // Invulnerability flash
        if (this.invulnerable > 0 && Math.floor(this.invulnerable / 4) % 2 === 0) {
            ctx.globalAlpha = 0.35;
        }

        // Glow
        ctx.shadowColor = this.specialReady ? '#00ffff' : '#00ffff';
        ctx.shadowBlur = this.specialReady ? 35 : 20;

        // Ship body
        ctx.fillStyle = this.specialReady ? '#00e8ff' : '#00d4e8';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-13, 15);
        ctx.lineTo(-5, 10);
        ctx.lineTo(0, 13);
        ctx.lineTo(5, 10);
        ctx.lineTo(13, 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = this.specialReady ? '#aaffff' : '#80ffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(-4, 2);
        ctx.lineTo(4, 2);
        ctx.closePath();
        ctx.fill();

        // Thruster flame
        if (this.isThrusting) {
            const flicker = Math.random() * 10;
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ff9900';
            ctx.beginPath();
            ctx.moveTo(-5, 14);
            ctx.lineTo(0, 26 + flicker);
            ctx.lineTo(5, 14);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffdd44';
            ctx.beginPath();
            ctx.moveTo(-3, 14);
            ctx.lineTo(0, 19 + flicker * 0.4);
            ctx.lineTo(3, 14);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}
