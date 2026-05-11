// Bullet management

export class Bullet {
    constructor(x, y, vx, vy, owner = 'player') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.owner = owner;
        this.lifetime = owner === 'player' ? 70 : 120;
        this.radius = owner === 'player' ? 3 : 4;
        this.trail = [];
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 6) this.trail.shift();
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;
    }

    get isDead() {
        return this.lifetime <= 0;
    }

    isOffScreen(width, height) {
        return this.x < -30 || this.x > width + 30 || this.y < -30 || this.y > height + 30;
    }

    draw(ctx) {
        const color = this.owner === 'player' ? '#00ffff' : '#ff4444';
        const glowColor = this.owner === 'player' ? '#00ffff' : '#ff0000';

        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = (i + 1) / this.trail.length * 0.35;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Main bullet
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
