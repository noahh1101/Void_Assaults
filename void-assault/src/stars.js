// Starfield background with parallax layers

export class Starfield {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.layers = [
            this.createLayer(80, 0.3, 1),   // far - dim, slow
            this.createLayer(50, 0.6, 1.5),  // mid
            this.createLayer(25, 1.0, 2.5),  // near - bright, fast
        ];
    }

    createLayer(count, brightness, speed) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: 0.5 + Math.random() * 1.5,
                brightness: brightness * (0.5 + Math.random() * 0.5),
                speed: speed,
                twinkle: Math.random() * Math.PI * 2
            });
        }
        return stars;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    update() {
        for (const layer of this.layers) {
            for (const star of layer) {
                star.y += star.speed * 0.3;
                star.twinkle += 0.02;
                if (star.y > this.height) {
                    star.y = -2;
                    star.x = Math.random() * this.width;
                }
            }
        }
    }

    draw(ctx) {
        for (const layer of this.layers) {
            for (const star of layer) {
                const twinkleAlpha = 0.6 + Math.sin(star.twinkle) * 0.4;
                const alpha = star.brightness * twinkleAlpha;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }
}
