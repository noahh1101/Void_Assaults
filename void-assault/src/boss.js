// Boss entity with burst and charge attack patterns
import { angleBetween, distance, randomRange } from './utils.js';

export class Boss {
    constructor(width, height) {
        this.x = width / 2;
        this.y = -80;
        this.targetY = 120;
        this.vx = 0;
        this.vy = 0;
        this.angle = Math.PI / 2;
        this.radius = 45;

        // Stats
        this.hp = 500;
        this.maxHp = 500;
        this.alive = true;
        this.damage = 20;
        this.bulletDamage = 12;

        // State
        this.phase = 'entering'; // entering, idle, burst, charge, cooldown
        this.phaseTimer = 0;
        this.idleDuration = 90;
        this.speed = 1.5;
        this.entering = true;

        // Attack timers
        this.attackCycle = 0;
        this.burstCount = 0;
        this.chargeTarget = null;
        this.chargeSpeed = 8;

        // Visual
        this.pulseTimer = 0;
        this.hitFlash = 0;

        // Bullets to spawn
        this.pendingBullets = [];
    }

    scaleForSector(sector) {
        const mult = 1 + (sector - 1) * 0.4;
        this.hp = Math.floor(500 * mult);
        this.maxHp = this.hp;
        this.speed = 1.5 + (sector - 1) * 0.3;
    }

    update(playerX, playerY, width, height) {
        if (!this.alive) return;
        this.pulseTimer += 0.05;
        if (this.hitFlash > 0) this.hitFlash--;
        this.pendingBullets = [];

        this.angle = angleBetween(this.x, this.y, playerX, playerY);

        if (this.phase === 'entering') {
            this.vy = 2;
            this.y += this.vy;
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.vy = 0;
                this.phase = 'idle';
                this.phaseTimer = this.idleDuration;
            }
            return;
        }

        this.phaseTimer--;

        switch (this.phase) {
            case 'idle':
                // Drift slowly toward player X
                const dx = playerX - this.x;
                this.vx = Math.sign(dx) * Math.min(Math.abs(dx) * 0.01, this.speed * 0.5);
                this.x += this.vx;

                if (this.phaseTimer <= 0) {
                    this.attackCycle++;
                    if (this.attackCycle % 3 === 0) {
                        this.phase = 'charge';
                        this.chargeTarget = { x: playerX, y: playerY };
                        this.phaseTimer = 30; // wind-up
                    } else {
                        this.phase = 'burst';
                        this.burstCount = 0;
                        this.phaseTimer = 8;
                    }
                }
                break;

            case 'burst':
                if (this.phaseTimer <= 0) {
                    // Fire burst
                    this.fireBurst(playerX, playerY);
                    this.burstCount++;
                    if (this.burstCount >= 3) {
                        this.phase = 'cooldown';
                        this.phaseTimer = 60;
                    } else {
                        this.phaseTimer = 15;
                    }
                }
                break;

            case 'charge':
                if (this.phaseTimer > 0) {
                    // Wind up - vibrate
                    this.x += (Math.random() - 0.5) * 4;
                } else {
                    // Charge toward target
                    const ca = angleBetween(this.x, this.y, this.chargeTarget.x, this.chargeTarget.y);
                    this.vx = Math.cos(ca) * this.chargeSpeed;
                    this.vy = Math.sin(ca) * this.chargeSpeed;
                    this.x += this.vx;
                    this.y += this.vy;

                    // If reached target area or went off screen enough
                    const distToTarget = distance(this.x, this.y, this.chargeTarget.x, this.chargeTarget.y);
                    if (distToTarget < 30 || this.x < -60 || this.x > width + 60 || this.y < -60 || this.y > height + 60) {
                        this.phase = 'returning';
                        this.phaseTimer = 40;
                    }
                }
                break;

            case 'returning':
                // Return to top area
                const retX = width / 2;
                const retY = this.targetY;
                const ra = angleBetween(this.x, this.y, retX, retY);
                this.vx = Math.cos(ra) * 3;
                this.vy = Math.sin(ra) * 3;
                this.x += this.vx;
                this.y += this.vy;

                if (distance(this.x, this.y, retX, retY) < 30) {
                    this.x = retX;
                    this.y = retY;
                    this.vx = 0;
                    this.vy = 0;
                    this.phase = 'cooldown';
                    this.phaseTimer = 50;
                }
                break;

            case 'cooldown':
                this.vx *= 0.95;
                this.vy *= 0.95;
                if (this.phaseTimer <= 0) {
                    this.phase = 'idle';
                    this.phaseTimer = this.idleDuration;
                }
                break;
        }

        // Clamp to screen
        if (this.phase !== 'charge' && this.phase !== 'returning') {
            this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(height * 0.6, this.y));
        }
    }

    fireBurst(playerX, playerY) {
        const baseAngle = angleBetween(this.x, this.y, playerX, playerY);
        const bulletCount = 8;
        const spreadAngle = Math.PI * 0.6;
        const bulletSpeed = 4.5;

        for (let i = 0; i < bulletCount; i++) {
            const a = baseAngle - spreadAngle / 2 + (i / (bulletCount - 1)) * spreadAngle;
            this.pendingBullets.push({
                x: this.x + Math.cos(a) * 50,
                y: this.y + Math.sin(a) * 50,
                vx: Math.cos(a) * bulletSpeed,
                vy: Math.sin(a) * bulletSpeed,
                owner: 'enemy'
            });
        }
    }

    takeDamage(amount = 1) {
        this.hp -= amount;
        this.hitFlash = 6;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }

    draw(ctx, time) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        const pulse = Math.sin(this.pulseTimer) * 0.15 + 1;

        // Hit flash
        if (this.hitFlash > 0) {
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 30;
        } else {
            ctx.shadowColor = '#cc44ff';
            ctx.shadowBlur = 25 * pulse;
        }

        // Charge wind-up visual
        if (this.phase === 'charge' && this.phaseTimer > 0) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 40;
        }

        const drawAngle = this.angle + Math.PI / 2;

        ctx.rotate(drawAngle);

        // Body - hexagonal
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#8822cc';
        ctx.strokeStyle = '#cc44ff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const r = 42 * pulse;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner ring
        ctx.strokeStyle = '#dd66ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2 + this.pulseTimer * 0.3;
            const r = 25;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.stroke();

        // Eye / core
        ctx.fillStyle = '#ff44ff';
        ctx.shadowColor = '#ff44ff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, 10 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Wing details
        ctx.strokeStyle = '#cc44ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-30, -10);
        ctx.lineTo(-45, 0);
        ctx.lineTo(-30, 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(30, -10);
        ctx.lineTo(45, 0);
        ctx.lineTo(30, 10);
        ctx.stroke();

        ctx.restore();
    }
}
