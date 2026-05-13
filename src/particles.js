// Particle System for visual effects

export class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.97;
        this.vy *= 0.97;
        this.life--;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    get isDead() {
        return this.life <= 0;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, options = {}) {
        const {
            speed = 3,
            life = 30,
            color = '#fff',
            size = 3,
            spread = Math.PI * 2,
            angle = 0,
            colors = null
        } = options;

        for (let i = 0; i < count; i++) {
            const a = angle - spread / 2 + Math.random() * spread;
            const s = Math.random() * speed;
            const c = colors ? colors[Math.floor(Math.random() * colors.length)] : color;
            const l = life * (0.5 + Math.random() * 0.5);
            const sz = size * (0.5 + Math.random() * 0.5);
            this.particles.push(
                new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, l, c, sz)
            );
        }
    }

    explosion(x, y, color = '#ff6600') {
        this.emit(x, y, 25, {
            speed: 5,
            life: 35,
            size: 4,
            colors: [color, '#ffcc00', '#ff9900', '#ffffff']
        });
    }

    smallExplosion(x, y, color = '#ff6600') {
        this.emit(x, y, 10, {
            speed: 3,
            life: 20,
            size: 2.5,
            colors: [color, '#ffcc00', '#ffffff']
        });
    }

    thruster(x, y, angle, speed = 2) {
        this.emit(x, y, 2, {
            speed: speed,
            life: 15,
            size: 2,
            spread: 0.5,
            angle: angle + Math.PI,
            colors: ['#ff6600', '#ff9900', '#ffcc00']
        });
    }

    scorePopup(x, y) {
        this.emit(x, y, 5, {
            speed: 1.5,
            life: 25,
            size: 2,
            colors: ['#00ffff', '#80ffff', '#ffffff']
        });
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.update();
            return !p.isDead;
        });
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}
