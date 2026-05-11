// Special Blast - NOVA CANNON
// A massive, unique area-of-effect projectile with devastating power
// Fired by the player when special charge is full (E key)

export class SpecialBlast {
    constructor(x, y, vx, vy, angle) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.angle = angle;

        // Massive blast - much larger than normal bullets
        this.radius = 50;
        this.maxRadius = 50;
        this.aoeRadius = 220; // huge area of effect on detonation
        this.damage = 15;     // devastating damage

        // Lifetime
        this.lifetime = 150; // ~2.5 seconds
        this.maxLifetime = 150;
        this.alive = true;

        // Visual effects state
        this.pulseTimer = 0;
        this.trail = [];
        this.ringWaves = [];
        this.lightningArcs = [];
        this.innerRotation = 0;
        this.spawnTime = performance.now();

        // Initial burst effect
        this.birthFlash = 1.0;
    }

    update() {
        if (!this.alive) return;

        // Birth flash decay
        if (this.birthFlash > 0) {
            this.birthFlash -= 0.04;
        }

        // Store trail positions with size variation
        this.trail.push({
            x: this.x,
            y: this.y,
            alpha: 1,
            size: this.radius * (0.5 + Math.random() * 0.3)
        });
        if (this.trail.length > 25) this.trail.shift();

        // Decay trail
        for (let i = 0; i < this.trail.length; i++) {
            this.trail[i].alpha = (i + 1) / this.trail.length * 0.7;
        }

        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Pulse animation - breathing effect
        this.pulseTimer += 0.12;
        this.radius = this.maxRadius + Math.sin(this.pulseTimer) * 8 + Math.sin(this.pulseTimer * 2.7) * 3;

        // Inner rotation for energy arcs
        this.innerRotation += 0.08;

        // Lifetime
        this.lifetime--;
        if (this.lifetime <= 0) {
            this.alive = false;
        }

        // Update ring waves
        for (let i = this.ringWaves.length - 1; i >= 0; i--) {
            this.ringWaves[i].radius += 5;
            this.ringWaves[i].alpha -= 0.025;
            if (this.ringWaves[i].alpha <= 0) {
                this.ringWaves.splice(i, 1);
            }
        }

        // Spawn periodic ring waves
        if (this.alive && this.lifetime % 6 === 0) {
            this.ringWaves.push({
                x: this.x, y: this.y,
                radius: this.radius,
                alpha: 0.6
            });
        }

        // Generate lightning arcs
        if (this.alive && Math.random() < 0.3) {
            const arcAngle = Math.random() * Math.PI * 2;
            const arcLen = this.radius * (1.5 + Math.random() * 1.5);
            this.lightningArcs.push({
                x: this.x, y: this.y,
                angle: arcAngle,
                length: arcLen,
                alpha: 1,
                segments: Math.floor(3 + Math.random() * 4)
            });
        }

        // Decay lightning
        for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
            this.lightningArcs[i].alpha -= 0.12;
            if (this.lightningArcs[i].alpha <= 0) {
                this.lightningArcs.splice(i, 1);
            }
        }
    }

    isOffScreen(width, height) {
        return this.x < -150 || this.x > width + 150 || this.y < -150 || this.y > height + 150;
    }

    draw(ctx) {
        if (!this.alive) return;

        const lifeRatio = this.lifetime / this.maxLifetime;
        const time = performance.now() - this.spawnTime;

        ctx.save();

        // ── Birth Flash ──
        if (this.birthFlash > 0) {
            ctx.save();
            ctx.globalAlpha = this.birthFlash * 0.4;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 4 * this.birthFlash, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // ── Trail ──
        for (const t of this.trail) {
            ctx.save();
            ctx.globalAlpha = t.alpha * 0.35;
            const trailGrad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.size);
            trailGrad.addColorStop(0, 'rgba(0, 255, 255, 0.6)');
            trailGrad.addColorStop(0.5, 'rgba(0, 150, 255, 0.3)');
            trailGrad.addColorStop(1, 'rgba(100, 0, 255, 0)');
            ctx.fillStyle = trailGrad;
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // ── Expanding ring waves ──
        for (const ring of this.ringWaves) {
            ctx.save();
            ctx.globalAlpha = ring.alpha;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // ── Lightning arcs ──
        for (const arc of this.lightningArcs) {
            ctx.save();
            ctx.globalAlpha = arc.alpha * 0.8;
            ctx.strokeStyle = '#aaffff';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 8;
            ctx.beginPath();

            let px = arc.x;
            let py = arc.y;
            ctx.moveTo(px, py);

            for (let s = 0; s < arc.segments; s++) {
                const segLen = arc.length / arc.segments;
                const jitter = (Math.random() - 0.5) * 20;
                px += Math.cos(arc.angle) * segLen + Math.cos(arc.angle + Math.PI / 2) * jitter;
                py += Math.sin(arc.angle) * segLen + Math.sin(arc.angle + Math.PI / 2) * jitter;
                ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.restore();
        }

        // ── Outer halo (huge glow) ──
        const outerGlow = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 3
        );
        outerGlow.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
        outerGlow.addColorStop(0.3, 'rgba(0, 180, 255, 0.15)');
        outerGlow.addColorStop(0.6, 'rgba(100, 0, 255, 0.06)');
        outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // ── Main body - multi-layered energy sphere ──
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 50;

        // Outer sphere
        const bodyGrad = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        bodyGrad.addColorStop(0, 'rgba(200, 255, 255, 0.9)');
        bodyGrad.addColorStop(0.4, 'rgba(0, 220, 255, 0.7)');
        bodyGrad.addColorStop(0.7, 'rgba(0, 100, 255, 0.4)');
        bodyGrad.addColorStop(1, 'rgba(80, 0, 200, 0.2)');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright core
        ctx.shadowBlur = 35;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = '#ccffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // White-hot center
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // ── Rotating energy arcs (multiple layers) ──
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;

        // Outer rotating arcs
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < 4; i++) {
            const arcAngle = this.innerRotation + (i * Math.PI * 2 / 4);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 1.4, arcAngle, arcAngle + 0.7);
            ctx.stroke();
        }

        // Inner counter-rotating arcs
        ctx.strokeStyle = '#aaddff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 5; i++) {
            const arcAngle = -this.innerRotation * 1.5 + (i * Math.PI * 2 / 5);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.8, arcAngle, arcAngle + 0.5);
            ctx.stroke();
        }

        // ── Hexagonal grid overlay (sci-fi feel) ──
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        for (let i = 0; i < 6; i++) {
            const a = this.innerRotation * 0.5 + (i * Math.PI / 3);
            const x1 = this.x + Math.cos(a) * this.radius * 0.4;
            const y1 = this.y + Math.sin(a) * this.radius * 0.4;
            const x2 = this.x + Math.cos(a) * this.radius * 1.2;
            const y2 = this.y + Math.sin(a) * this.radius * 1.2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// ── AOE Explosion effect when the blast detonates ──
// Massive screen-filling explosion with multiple visual layers
export class SpecialExplosion {
    constructor(x, y, aoeRadius) {
        this.x = x;
        this.y = y;
        this.maxRadius = aoeRadius;
        this.currentRadius = 0;
        this.lifetime = 50; // ~0.85 seconds (longer for dramatic effect)
        this.maxLifetime = 50;
        this.alive = true;

        // Multiple shockwave rings expanding at different speeds
        this.rings = [];
        for (let i = 0; i < 6; i++) {
            this.rings.push({
                radius: 0,
                targetRadius: aoeRadius * (0.3 + i * 0.15),
                speed: 6 + i * 4,
                alpha: 1 - i * 0.1,
                width: 4 - i * 0.5
            });
        }

        // Debris particles
        this.debris = [];
        for (let i = 0; i < 30; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 3 + Math.random() * 8;
            this.debris.push({
                x: x, y: y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                alpha: 1,
                size: 2 + Math.random() * 4
            });
        }

        // Screen flash
        this.flashAlpha = 0.6;
    }

    update() {
        this.lifetime--;
        if (this.lifetime <= 0) {
            this.alive = false;
            return;
        }

        const progress = 1 - (this.lifetime / this.maxLifetime);
        this.currentRadius = this.maxRadius * Math.min(1, progress * 1.5);

        // Flash decay
        if (this.flashAlpha > 0) {
            this.flashAlpha -= 0.06;
        }

        for (const ring of this.rings) {
            ring.radius += ring.speed;
            ring.alpha *= 0.94;
        }

        // Update debris
        for (const d of this.debris) {
            d.x += d.vx;
            d.y += d.vy;
            d.vx *= 0.96;
            d.vy *= 0.96;
            d.alpha *= 0.95;
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        const alpha = this.lifetime / this.maxLifetime;

        ctx.save();

        // ── Full-screen flash ──
        if (this.flashAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.flashAlpha;
            ctx.fillStyle = '#aaffff';
            ctx.fillRect(
                this.x - ctx.canvas.width,
                this.y - ctx.canvas.height,
                ctx.canvas.width * 3,
                ctx.canvas.height * 3
            );
            ctx.restore();
        }

        // ── Main expanding fill ──
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.currentRadius
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.5})`);
        gradient.addColorStop(0.2, `rgba(200, 255, 255, ${alpha * 0.4})`);
        gradient.addColorStop(0.5, `rgba(0, 200, 255, ${alpha * 0.25})`);
        gradient.addColorStop(0.8, `rgba(80, 0, 200, ${alpha * 0.1})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // ── Expanding shockwave rings ──
        for (const ring of this.rings) {
            if (ring.alpha <= 0.01) continue;
            ctx.save();
            ctx.globalAlpha = ring.alpha * alpha;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = Math.max(1, ring.width);
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(this.x, this.y, ring.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // ── Debris sparks ──
        for (const d of this.debris) {
            if (d.alpha <= 0.01) continue;
            ctx.save();
            ctx.globalAlpha = d.alpha;
            ctx.fillStyle = '#aaffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // ── Center flash core ──
        if (this.lifetime > this.maxLifetime * 0.5) {
            const coreAlpha = alpha * alpha;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 40;
            ctx.globalAlpha = coreAlpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 25 * coreAlpha, 0, Math.PI * 2);
            ctx.fill();

            // Cross flare
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = coreAlpha * 0.6;
            const flareLen = this.currentRadius * 0.6;
            ctx.beginPath();
            ctx.moveTo(this.x - flareLen, this.y);
            ctx.lineTo(this.x + flareLen, this.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - flareLen);
            ctx.lineTo(this.x, this.y + flareLen);
            ctx.stroke();
        }

        ctx.restore();
    }
}
