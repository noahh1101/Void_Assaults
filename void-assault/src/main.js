// Main Game Loop and State Management
import { Player } from './player.js';
import { Bullet } from './bullet.js';
import { Drone, Stalker, Shooter } from './enemy.js';
import { Boss } from './boss.js';
import { PowerUp } from './powerup.js';
import { ParticleSystem } from './particles.js';
import { Starfield } from './stars.js';
import { UI } from './ui.js';
import { SpecialBlast, SpecialExplosion } from './special_blast.js';
import { circleCollision, randomEdgeSpawn, distance } from './utils.js';

// ─── GAME STATES ───
const STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    BOSS: 'boss',
    GAMEOVER: 'gameover'
};

// ─── WAVE DEFINITIONS ───
function getWaves(sector) {
    const mult = 1 + (sector - 1) * 0.4;
    return [
        { drones: Math.floor(5 * mult), stalkers: 0, shooters: 0 },
        { drones: Math.floor(4 * mult), stalkers: Math.floor(2 * mult), shooters: 0 },
        { drones: Math.floor(4 * mult), stalkers: Math.floor(3 * mult), shooters: Math.floor(1 * mult) },
    ];
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input
        this.keys = {};
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });

        // Systems
        this.particles = new ParticleSystem();
        this.starfield = new Starfield(this.width, this.height);
        this.ui = new UI(this.width, this.height);

        // Screen shake
        this.shakeAmount = 0;
        this.shakeDecay = 0.9;

        // State
        this.state = STATE.MENU;
        this.score = 0;
        this.sector = 1;
        this.waveIndex = 0;
        this.waves = [];
        this.announcement = null;

        // Entities
        this.player = new Player(this.width / 2, this.height / 2);
        this.bullets = [];
        this.enemies = [];
        this.powerups = [];
        this.boss = null;
        this.specialBlasts = [];
        this.specialExplosions = [];

        // Wave spawning
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.spawnInterval = 50;
        this.totalEnemiesInWave = 0;
        this.enemiesKilledInWave = 0;

        // Start
        this.lastTime = performance.now();
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        if (this.starfield) this.starfield.resize(this.width, this.height);
        if (this.ui) this.ui.resize(this.width, this.height);
    }

    shake(amount) {
        this.shakeAmount = Math.max(this.shakeAmount, amount);
    }

    // ─── STATE MANAGEMENT ───

    startGame() {
        this.state = STATE.PLAYING;
        this.score = 0;
        this.sector = 1;
        this.waveIndex = 0;
        this.bullets = [];
        this.enemies = [];
        this.powerups = [];
        this.boss = null;
        this.specialBlasts = [];
        this.specialExplosions = [];
        this.player.reset(this.width / 2, this.height / 2);
        this.ui.scoreDisplay = 0;

        this.waves = getWaves(this.sector);
        this.startWave();
    }

    startWave() {
        const wave = this.waves[this.waveIndex];
        this.spawnQueue = [];
        this.enemiesKilledInWave = 0;

        for (let i = 0; i < wave.drones; i++) this.spawnQueue.push('drone');
        for (let i = 0; i < wave.stalkers; i++) this.spawnQueue.push('stalker');
        for (let i = 0; i < wave.shooters; i++) this.spawnQueue.push('shooter');

        // Shuffle spawn queue
        for (let i = this.spawnQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
        }

        this.totalEnemiesInWave = this.spawnQueue.length;
        this.spawnTimer = 30; // initial delay
        this.spawnInterval = Math.max(25, 50 - this.sector * 5);

        this.announcement = {
            text: `WAVE ${this.waveIndex + 1}`,
            timer: 90,
            maxTimer: 90
        };
    }

    startBoss() {
        this.state = STATE.BOSS;
        this.boss = new Boss(this.width, this.height);
        this.boss.scaleForSector(this.sector);
        this.enemies = [];
        this.spawnQueue = [];

        this.announcement = {
            text: '⚠ BOSS INCOMING ⚠',
            timer: 120,
            maxTimer: 120
        };
    }

    nextSector() {
        this.sector++;
        this.waveIndex = 0;
        this.waves = getWaves(this.sector);
        this.state = STATE.PLAYING;
        this.boss = null;
        this.bullets = [];

        this.announcement = {
            text: `SECTOR ${this.sector}`,
            timer: 120,
            maxTimer: 120
        };

        setTimeout(() => this.startWave(), 2000);
    }

    gameOver() {
        this.state = STATE.GAMEOVER;
        this.particles.explosion(this.player.x, this.player.y, '#00ffff');
        this.particles.explosion(this.player.x, this.player.y, '#ffffff');
        this.shake(15);
    }

    // ─── SPAWNING ───

    spawnEnemy(type) {
        const pos = randomEdgeSpawn(this.width, this.height);
        // Ensure not too close to player
        if (distance(pos.x, pos.y, this.player.x, this.player.y) < 150) {
            pos.x = (pos.x + this.width / 2) % this.width;
            pos.y = (pos.y + this.height / 2) % this.height;
        }

        switch (type) {
            case 'drone': return new Drone(pos.x, pos.y);
            case 'stalker': return new Stalker(pos.x, pos.y);
            case 'shooter': return new Shooter(pos.x, pos.y);
        }
    }

    // ─── UPDATE ───

    update() {
        // Menu - wait for enter
        if (this.state === STATE.MENU) {
            this.starfield.update();
            if (this.keys['Enter'] || this.keys['Space']) {
                this.keys['Enter'] = false;
                this.keys['Space'] = false;
                this.startGame();
            }
            return;
        }

        // Game over - wait for enter
        if (this.state === STATE.GAMEOVER) {
            this.starfield.update();
            this.particles.update();
            if (this.keys['Enter']) {
                this.keys['Enter'] = false;
                this.startGame();
            }
            return;
        }

        // ── Active gameplay ──
        this.starfield.update();

        // Player
        this.player.update(this.keys, this.width, this.height);

        if (!this.player.alive) {
            this.gameOver();
            return;
        }

        // Thruster particles
        if (this.player.isThrusting) {
            const tx = this.player.x - Math.cos(this.player.angle) * 18;
            const ty = this.player.y - Math.sin(this.player.angle) * 18;
            this.particles.thruster(tx, ty, this.player.angle);
        }

        // Shooting
        if ((this.keys['Space'] || this.keys['KeyJ']) && this.player.canShoot()) {
            const bulletData = this.player.shoot();
            this.bullets.push(new Bullet(bulletData.x, bulletData.y, bulletData.vx, bulletData.vy, 'player'));
        }

        // Special attack (E key)
        if (this.keys['KeyE'] && this.player.canShootSpecial()) {
            this.keys['KeyE'] = false; // consume
            const data = this.player.shootSpecial();
            this.specialBlasts.push(new SpecialBlast(data.x, data.y, data.vx, data.vy, data.angle));
            this.shake(14);
            this.particles.explosion(this.player.x, this.player.y, '#00ffff');
            this.ui.addMessage('NOVA CANNON!', this.player.x, this.player.y - 40, '#00ffff');
        }

        // ── Spawn enemies ──
        if (this.state === STATE.PLAYING && this.spawnQueue.length > 0) {
            this.spawnTimer--;
            if (this.spawnTimer <= 0) {
                const type = this.spawnQueue.shift();
                const enemy = this.spawnEnemy(type);
                this.enemies.push(enemy);
                this.spawnTimer = this.spawnInterval;
            }
        }

        // ── Update entities ──
        // Bullets
        this.bullets.forEach(b => b.update());
        this.bullets = this.bullets.filter(b => !b.isDead && !b.isOffScreen(this.width, this.height));

        // Enemies
        this.enemies.forEach(e => e.update(this.player.x, this.player.y, this.width, this.height));

        // Shooter bullets
        this.enemies.forEach(e => {
            if (e.type === 'shooter' && e.wantsToShoot) {
                const bd = e.getShootData(this.player.x, this.player.y);
                this.bullets.push(new Bullet(bd.x, bd.y, bd.vx, bd.vy, 'enemy'));
                e.wantsToShoot = false;
            }
        });

        // Boss
        if (this.boss && this.boss.alive) {
            this.boss.update(this.player.x, this.player.y, this.width, this.height);

            // Boss bullets
            for (const bd of this.boss.pendingBullets) {
                this.bullets.push(new Bullet(bd.x, bd.y, bd.vx, bd.vy, 'enemy'));
            }
        }

        // Power-ups
        this.powerups.forEach(p => p.update());
        this.powerups = this.powerups.filter(p => p.alive && !p.isOffScreen(this.height));

        // Special blasts
        for (let i = this.specialBlasts.length - 1; i >= 0; i--) {
            const sb = this.specialBlasts[i];
            sb.update();
            if (!sb.alive || sb.isOffScreen(this.width, this.height)) {
                // Detonate AOE if it expired naturally (not off-screen)
                if (!sb.isOffScreen(this.width, this.height)) {
                    this.detonateSpecialBlast(sb);
                }
                this.specialBlasts.splice(i, 1);
            }
        }

        // Special explosions (visual only)
        for (let i = this.specialExplosions.length - 1; i >= 0; i--) {
            this.specialExplosions[i].update();
            if (!this.specialExplosions[i].alive) {
                this.specialExplosions.splice(i, 1);
            }
        }

        // Particles
        this.particles.update();

        // ── Collision Detection ──
        this.checkCollisions();

        // ── Wave progression ──
        if (this.state === STATE.PLAYING) {
            const allSpawned = this.spawnQueue.length === 0;
            const allDead = this.enemies.length === 0;
            if (allSpawned && allDead) {
                this.waveIndex++;
                if (this.waveIndex >= this.waves.length) {
                    this.startBoss();
                } else {
                    this.startWave();
                }
            }
        }

        // Boss defeated
        if (this.state === STATE.BOSS && this.boss && !this.boss.alive) {
            this.score += 2000;
            this.particles.explosion(this.boss.x, this.boss.y, '#cc44ff');
            this.particles.explosion(this.boss.x, this.boss.y, '#ff44aa');
            this.particles.explosion(this.boss.x + 20, this.boss.y - 15, '#ffffff');
            this.particles.explosion(this.boss.x - 20, this.boss.y + 15, '#cc44ff');
            this.shake(20);

            this.ui.addMessage('+2000', this.boss.x, this.boss.y, '#cc44ff');

            setTimeout(() => this.nextSector(), 2500);
            this.boss = null;
        }

        // Announcement
        if (this.announcement) {
            this.announcement.timer--;
            if (this.announcement.timer <= 0) this.announcement = null;
        }

        // Screen shake decay
        if (this.shakeAmount > 0.5) {
            this.shakeAmount *= this.shakeDecay;
        } else {
            this.shakeAmount = 0;
        }

        // UI
        this.ui.update(this.score);
    }

    checkCollisions() {
        // Player bullets vs enemies
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            if (b.owner !== 'player') continue;

            // vs enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (e.isSpawning) continue;
                if (circleCollision(b.x, b.y, b.radius, e.x, e.y, e.radius)) {
                    e.takeDamage(1);
                    this.player.addSpecialCharge(15); // charge special on hit
                    this.particles.smallExplosion(b.x, b.y, '#ffcc00');
                    this.bullets.splice(i, 1);

                    if (!e.alive) {
                        this.score += e.points;
                        this.player.addSpecialCharge(30); // bonus charge on kill
                        this.enemiesKilledInWave++;
                        this.particles.explosion(e.x, e.y);
                        this.ui.addMessage(`+${e.points}`, e.x, e.y - 20, '#ffcc00');
                        this.shake(4);

                        // Power-up drop
                        if (PowerUp.shouldDrop()) {
                            this.powerups.push(PowerUp.createRandom(e.x, e.y));
                        }

                        this.enemies.splice(j, 1);
                    }
                    break;
                }
            }

            // vs boss
            if (this.boss && this.boss.alive && b.owner === 'player') {
                if (i < this.bullets.length) { // check if bullet was already removed
                    const bullet = this.bullets[i];
                    if (bullet && circleCollision(bullet.x, bullet.y, bullet.radius, this.boss.x, this.boss.y, this.boss.radius)) {
                        this.boss.takeDamage(1);
                        this.player.addSpecialCharge(10); // charge on boss hit
                        this.particles.smallExplosion(bullet.x, bullet.y, '#cc44ff');
                        this.bullets.splice(i, 1);
                        this.shake(2);
                    }
                }
            }
        }

        // Special blasts vs enemies (contact detonation)
        for (let i = this.specialBlasts.length - 1; i >= 0; i--) {
            const sb = this.specialBlasts[i];
            if (!sb.alive) continue;

            // Check contact with any enemy
            let detonated = false;
            for (const e of this.enemies) {
                if (e.isSpawning) continue;
                if (circleCollision(sb.x, sb.y, sb.radius, e.x, e.y, e.radius)) {
                    this.detonateSpecialBlast(sb);
                    sb.alive = false;
                    this.specialBlasts.splice(i, 1);
                    detonated = true;
                    break;
                }
            }

            // Check contact with boss
            if (!detonated && this.boss && this.boss.alive) {
                if (circleCollision(sb.x, sb.y, sb.radius, this.boss.x, this.boss.y, this.boss.radius)) {
                    this.detonateSpecialBlast(sb);
                    sb.alive = false;
                    this.specialBlasts.splice(i, 1);
                }
            }
        }

        // Enemy bullets vs player
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            if (b.owner !== 'enemy') continue;

            if (circleCollision(b.x, b.y, b.radius, this.player.x, this.player.y, this.player.radius)) {
                const damage = 8;
                if (this.player.takeDamage(damage)) {
                    this.particles.smallExplosion(b.x, b.y, '#ff4444');
                    this.shake(5);
                }
                this.bullets.splice(i, 1);
            }
        }

        // Enemies vs player (collision)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (e.isSpawning) continue;
            if (circleCollision(e.x, e.y, e.radius, this.player.x, this.player.y, this.player.radius)) {
                if (this.player.takeDamage(e.damage)) {
                    this.particles.explosion(e.x, e.y);
                    this.shake(8);
                }
                e.alive = false;
                this.score += Math.floor(e.points / 2);
                this.enemiesKilledInWave++;
                this.enemies.splice(i, 1);
            }
        }

        // Boss vs player
        if (this.boss && this.boss.alive) {
            if (circleCollision(this.boss.x, this.boss.y, this.boss.radius, this.player.x, this.player.y, this.player.radius)) {
                if (this.player.takeDamage(this.boss.damage)) {
                    this.particles.explosion(this.player.x, this.player.y, '#ff4444');
                    this.shake(12);
                }
            }
        }

        // Power-ups vs player
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            if (circleCollision(p.x, p.y, p.radius, this.player.x, this.player.y, this.player.radius + 5)) {
                if (p.type === 'health') {
                    this.player.heal(25);
                    this.ui.addMessage('+25 HP', p.x, p.y - 20, '#44ff44');
                } else {
                    this.player.rapidFire = 300; // 5 seconds
                    this.ui.addMessage('RAPID FIRE!', p.x, p.y - 20, '#ffcc00');
                }
                this.particles.scorePopup(p.x, p.y);
                this.powerups.splice(i, 1);
            }
        }
    }

    // ─── DRAW ───

    draw() {
        const ctx = this.ctx;

        // Clear
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, this.width, this.height);

        // Screen shake
        ctx.save();
        if (this.shakeAmount > 0) {
            const sx = (Math.random() - 0.5) * this.shakeAmount * 2;
            const sy = (Math.random() - 0.5) * this.shakeAmount * 2;
            ctx.translate(sx, sy);
        }

        // Background
        this.starfield.draw(ctx);

        if (this.state === STATE.MENU) {
            this.ui.drawStartScreen(ctx, performance.now());
            ctx.restore();
            return;
        }

        // Power-ups
        this.powerups.forEach(p => p.draw(ctx));

        // Bullets
        this.bullets.forEach(b => b.draw(ctx));

        // Enemies
        this.enemies.forEach(e => e.draw(ctx));

        // Boss
        if (this.boss) this.boss.draw(ctx, performance.now());

        // Player
        this.player.draw(ctx);

        // Particles (on top)
        this.particles.draw(ctx);

        // Special blasts & explosions (above particles, inside shake)
        this.specialBlasts.forEach(sb => sb.draw(ctx));
        this.specialExplosions.forEach(se => se.draw(ctx));

        ctx.restore(); // end shake

        // HUD (no shake)

        if (this.state === STATE.PLAYING || this.state === STATE.BOSS) {
            const waveProgress = this.state === STATE.BOSS ? 1 :
                (this.totalEnemiesInWave > 0 ? this.enemiesKilledInWave / this.totalEnemiesInWave : 0);
            this.ui.drawHUD(ctx, this.player, this.waveIndex + 1, this.sector, waveProgress, this.waves.length);

            if (this.boss && this.boss.alive) {
                this.ui.drawBossHealth(ctx, this.boss);
            }

            if (this.announcement) {
                this.ui.drawWaveAnnouncement(ctx, this.announcement.text, this.announcement.timer, this.announcement.maxTimer);
            }
        }

        if (this.state === STATE.GAMEOVER) {
            // Draw remaining entities dimmed
            this.ui.drawHUD(ctx, this.player, this.waveIndex + 1, this.sector, 0, this.waves.length);
            this.ui.drawGameOver(ctx, this.score, this.sector, this.waveIndex + 1, performance.now());
        }
    }

    // ─── GAME LOOP ───

    // Detonate a special blast, dealing AOE damage
    detonateSpecialBlast(blast) {
        // Visual explosion
        this.specialExplosions.push(new SpecialExplosion(blast.x, blast.y, blast.aoeRadius));
        this.particles.explosion(blast.x, blast.y, '#00ffff');
        this.particles.explosion(blast.x, blast.y, '#ffffff');
        this.shake(12);

        // Damage all enemies in AOE radius
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (e.isSpawning) continue;
            const dist = distance(blast.x, blast.y, e.x, e.y);
            if (dist <= blast.aoeRadius) {
                e.takeDamage(blast.damage);
                this.particles.smallExplosion(e.x, e.y, '#00ffff');

                if (!e.alive) {
                    this.score += e.points;
                    this.enemiesKilledInWave++;
                    this.particles.explosion(e.x, e.y);
                    this.ui.addMessage(`+${e.points}`, e.x, e.y - 20, '#00ffff');

                    if (PowerUp.shouldDrop()) {
                        this.powerups.push(PowerUp.createRandom(e.x, e.y));
                    }
                    this.enemies.splice(i, 1);
                }
            }
        }

        // Damage boss if in range
        if (this.boss && this.boss.alive) {
            const dist = distance(blast.x, blast.y, this.boss.x, this.boss.y);
            if (dist <= blast.aoeRadius + this.boss.radius) {
                this.boss.takeDamage(blast.damage);
                this.particles.smallExplosion(this.boss.x, this.boss.y, '#cc44ff');
                this.shake(6);
            }
        }
    }

    gameLoop(now) {
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }
}

// ─── INIT ───
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
