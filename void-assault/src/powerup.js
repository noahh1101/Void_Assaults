// Power-up system
import { randomRange } from './utils.js';

export class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'health' or 'rapid'
        this.radius = 12;
        this.lifetime = 400; // ~6.5 seconds
        this.pulseTimer = 0;
        this.vy = 0.3;
        this.alive = true;
    }

    update() {
        this.pulseTimer += 0.08;
        this.y += this.vy;
        this.lifetime--;
        if (this.lifetime <= 0) this.alive = false;
    }

    isOffScreen(height) {
        return this.y > height + 30;
    }

    draw(ctx) {
        const pulse = Math.sin(this.pulseTimer) * 0.3 + 1;
        const blink = this.lifetime < 90 && Math.floor(this.lifetime / 6) % 2 === 0;

        if (blink) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.type === 'health') {
            ctx.shadowColor = '#44ff44';
            ctx.shadowBlur = 18 * pulse;
            ctx.fillStyle = '#22cc22';
            ctx.strokeStyle = '#66ff66';
        } else {
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur = 18 * pulse;
            ctx.fillStyle = '#ddaa00';
            ctx.strokeStyle = '#ffdd44';
        }

        ctx.lineWidth = 1.5;

        // Outer ring
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Inner fill
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type === 'health' ? '+' : '⚡', 0, 0);

        ctx.restore();
    }

    static shouldDrop() {
        return Math.random() < 0.2; // 20% chance
    }

    static createRandom(x, y) {
        const type = Math.random() < 0.6 ? 'health' : 'rapid';
        return new PowerUp(x, y, type);
    }
}
