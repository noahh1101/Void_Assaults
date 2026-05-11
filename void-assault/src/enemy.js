// Enemy types: Drone, Stalker, Shooter
import { wrapPosition, angleBetween, distance, randomRange } from './utils.js';

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.type = type;
        this.alive = true;
        this.spawnTimer = 30;
    }

    get isSpawning() {
        return this.spawnTimer > 0;
    }

    baseUpdate(width, height) {
        this.x += this.vx;
        this.y += this.vy;
        if (this.spawnTimer > 0) this.spawnTimer--;
        wrapPosition(this, width, height);
    }

    takeDamage(amount = 1) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.alive = false;
        }
    }

    drawGlow(ctx, color) {
        if (this.isSpawning) {
            ctx.globalAlpha = 1 - (this.spawnTimer / 30);
        }
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
    }
}

// DRONE - follows the player slowly
export class Drone extends Enemy {
    constructor(x, y) {
        super(x, y, 'drone');
        this.speed = 1.2;
        this.hp = 1;
        this.radius = 12;
        this.points = 100;
        this.damage = 10;
    }

    update(playerX, playerY, width, height) {
        this.angle = angleBetween(this.x, this.y, playerX, playerY);
        this.vx += Math.cos(this.angle) * 0.04;
        this.vy += Math.sin(this.angle) * 0.04;

        const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (spd > this.speed) {
            this.vx = (this.vx / spd) * this.speed;
            this.vy = (this.vy / spd) * this.speed;
        }

        this.baseUpdate(width, height);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);
        this.drawGlow(ctx, '#44ff44');

        ctx.fillStyle = '#33cc33';
        ctx.strokeStyle = '#44ff44';
        ctx.lineWidth = 1.5;

        // Diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(-10, 0);
        ctx.lineTo(0, 12);
        ctx.lineTo(10, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Core
        ctx.fillStyle = '#88ff88';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// STALKER - tries to flank and collide
export class Stalker extends Enemy {
    constructor(x, y) {
        super(x, y, 'stalker');
        this.speed = 2.8;
        this.hp = 1;
        this.radius = 10;
        this.points = 250;
        this.damage = 15;
        this.flanking = true;
        this.flankTimer = 60 + Math.floor(Math.random() * 60);
        this.flankAngle = (Math.random() > 0.5 ? 1 : -1) * Math.PI / 3;
    }

    update(playerX, playerY, width, height) {
        this.flankTimer--;
        if (this.flankTimer <= 0) {
            this.flanking = !this.flanking;
            this.flankTimer = this.flanking ? 60 + Math.floor(Math.random() * 40) : 40 + Math.floor(Math.random() * 30);
            this.flankAngle = (Math.random() > 0.5 ? 1 : -1) * Math.PI / 3;
        }

        let targetAngle = angleBetween(this.x, this.y, playerX, playerY);
        if (this.flanking) {
            targetAngle += this.flankAngle;
        }

        this.angle = targetAngle;
        this.vx += Math.cos(this.angle) * 0.08;
        this.vy += Math.sin(this.angle) * 0.08;

        const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (spd > this.speed) {
            this.vx = (this.vx / spd) * this.speed;
            this.vy = (this.vy / spd) * this.speed;
        }

        this.baseUpdate(width, height);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);
        this.drawGlow(ctx, '#ffaa00');

        ctx.fillStyle = '#ee8800';
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 1.5;

        // Elongated triangle
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(-7, 10);
        ctx.lineTo(0, 6);
        ctx.lineTo(7, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Core
        ctx.fillStyle = '#ffcc44';
        ctx.beginPath();
        ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// SHOOTER - maintains distance and fires
export class Shooter extends Enemy {
    constructor(x, y) {
        super(x, y, 'shooter');
        this.speed = 1.0;
        this.hp = 2;
        this.radius = 14;
        this.points = 500;
        this.damage = 10;
        this.bulletDamage = 8;
        this.preferredDist = 250;
        this.shootCooldown = 120;
        this.shootTimer = 60 + Math.floor(Math.random() * 60);
        this.wantsToShoot = false;
    }

    update(playerX, playerY, width, height) {
        const dist = distance(this.x, this.y, playerX, playerY);
        this.angle = angleBetween(this.x, this.y, playerX, playerY);

        // Maintain distance
        let moveAngle = this.angle;
        if (dist < this.preferredDist - 50) {
            moveAngle = this.angle + Math.PI; // retreat
        } else if (dist > this.preferredDist + 50) {
            moveAngle = this.angle; // approach
        } else {
            // strafe
            moveAngle = this.angle + Math.PI / 2;
        }

        this.vx += Math.cos(moveAngle) * 0.03;
        this.vy += Math.sin(moveAngle) * 0.03;

        const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (spd > this.speed) {
            this.vx = (this.vx / spd) * this.speed;
            this.vy = (this.vy / spd) * this.speed;
        }

        // Shooting
        this.wantsToShoot = false;
        this.shootTimer--;
        if (this.shootTimer <= 0 && !this.isSpawning) {
            this.wantsToShoot = true;
            this.shootTimer = this.shootCooldown;
        }

        this.baseUpdate(width, height);
    }

    getShootData(playerX, playerY) {
        const a = angleBetween(this.x, this.y, playerX, playerY);
        const bulletSpeed = 4;
        return {
            x: this.x + Math.cos(a) * 18,
            y: this.y + Math.sin(a) * 18,
            vx: Math.cos(a) * bulletSpeed,
            vy: Math.sin(a) * bulletSpeed,
            owner: 'enemy'
        };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);
        this.drawGlow(ctx, '#ff4444');

        ctx.fillStyle = '#cc2222';
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 1.5;

        // Pentagon shape
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const r = 14;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Turret
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(-2, -16, 4, 8);

        // Core
        ctx.fillStyle = '#ff8888';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
