// HUD and UI rendering
import { clamp, lerp } from './utils.js';

export class UI {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.scoreDisplay = 0;
        this.shownMessages = [];
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    update(actualScore) {
        // Smooth score counting
        if (this.scoreDisplay < actualScore) {
            this.scoreDisplay += Math.ceil((actualScore - this.scoreDisplay) * 0.1);
            if (this.scoreDisplay > actualScore) this.scoreDisplay = actualScore;
        }

        this.shownMessages = this.shownMessages.filter(m => {
            m.timer--;
            m.y -= 0.5;
            return m.timer > 0;
        });
    }

    addMessage(text, x, y, color = '#ffffff') {
        this.shownMessages.push({ text, x, y, timer: 50, maxTimer: 50, color });
    }

    drawHUD(ctx, player, wave, sector, waveProgress, totalWaves) {
        ctx.save();
        // Reset shadow for UI
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // ─── Health Bar (top left) ───
        const hbX = 20, hbY = 20, hbW = 200, hbH = 16;
        const hpRatio = player.hp / player.maxHp;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, hbX, hbY, hbW, hbH, 4);
        ctx.fill();
        ctx.stroke();

        // HP fill with color gradient
        let hpColor;
        if (hpRatio > 0.6) hpColor = '#44ff44';
        else if (hpRatio > 0.3) hpColor = '#ffcc00';
        else hpColor = '#ff3333';

        if (hpRatio > 0) {
            ctx.fillStyle = hpColor;
            ctx.shadowColor = hpColor;
            ctx.shadowBlur = 8;
            this.roundRect(ctx, hbX + 2, hbY + 2, (hbW - 4) * hpRatio, hbH - 4, 3);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // HP text
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px "Orbitron", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${player.hp} / ${player.maxHp}`, hbX + hbW / 2, hbY + hbH / 2 + 4);

        // Label
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '10px "Orbitron", monospace';
        ctx.fillText('HULL', hbX, hbY - 4);

        // ─── Special Charge Bar (below health) ───
        const sbX = 20, sbY = 46, sbW = 200, sbH = 12;
        const specialRatio = player.specialCharge / player.specialMaxCharge;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, sbX, sbY, sbW, sbH, 4);
        ctx.fill();
        ctx.stroke();

        // Fill
        if (specialRatio > 0) {
            const specialGrad = ctx.createLinearGradient(sbX, 0, sbX + sbW, 0);
            specialGrad.addColorStop(0, '#006688');
            specialGrad.addColorStop(1, '#00ffff');
            ctx.fillStyle = specialGrad;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = specialRatio >= 1 ? 15 : 4;
            this.roundRect(ctx, sbX + 2, sbY + 2, (sbW - 4) * specialRatio, sbH - 4, 3);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Label
        ctx.fillStyle = specialRatio >= 1 ? '#00ffff' : 'rgba(255,255,255,0.5)';
        ctx.font = '9px "Orbitron", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('NOVA CANNON [E]', sbX, sbY - 3);

        // Ready indicator
        if (specialRatio >= 1) {
            const pulse = Math.sin(performance.now() * 0.008) * 0.3 + 0.7;
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 10px "Orbitron", monospace';
            ctx.textAlign = 'right';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            ctx.fillText('READY!', sbX + sbW, sbY - 3);
            ctx.restore();
        }

        // ─── Score (top right) ───
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px "Orbitron", monospace';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.fillText(this.scoreDisplay.toLocaleString(), this.width - 20, 35);
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px "Orbitron", monospace';
        ctx.fillText('SCORE', this.width - 20, 16);

        // ─── Wave / Sector indicator (top center) ───
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '10px "Orbitron", monospace';
        ctx.fillText(`SECTOR ${sector}`, this.width / 2, 16);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Orbitron", monospace';
        ctx.fillText(`WAVE ${wave} / ${totalWaves}`, this.width / 2, 34);

        // Wave progress bar
        const wpX = this.width / 2 - 80, wpY = 40, wpW = 160, wpH = 6;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        this.roundRect(ctx, wpX, wpY, wpW, wpH, 3);
        ctx.fill();

        if (waveProgress > 0) {
            ctx.fillStyle = '#00ccff';
            ctx.shadowColor = '#00ccff';
            ctx.shadowBlur = 6;
            this.roundRect(ctx, wpX, wpY, wpW * clamp(waveProgress, 0, 1), wpH, 3);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // ─── Floating messages ───
        for (const msg of this.shownMessages) {
            const alpha = msg.timer / msg.maxTimer;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = msg.color;
            ctx.font = 'bold 14px "Orbitron", monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = msg.color;
            ctx.shadowBlur = 8;
            ctx.fillText(msg.text, msg.x, msg.y);
            ctx.restore();
        }

        ctx.restore();
    }

    drawBossHealth(ctx, boss) {
        if (!boss || !boss.alive) return;

        ctx.save();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        const bx = this.width / 2 - 150, by = 55, bw = 300, bh = 12;
        const hpRatio = boss.hp / boss.maxHp;

        // Label
        ctx.fillStyle = '#cc44ff';
        ctx.font = 'bold 12px "Orbitron", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#cc44ff';
        ctx.shadowBlur = 10;
        ctx.fillText('⚠ BOSS ⚠', this.width / 2, by - 5);
        ctx.shadowBlur = 0;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = '#cc44ff';
        ctx.lineWidth = 1;
        this.roundRect(ctx, bx, by, bw, bh, 4);
        ctx.fill();
        ctx.stroke();

        // Fill
        if (hpRatio > 0) {
            const gradient = ctx.createLinearGradient(bx, 0, bx + bw, 0);
            gradient.addColorStop(0, '#cc44ff');
            gradient.addColorStop(1, '#ff44aa');
            ctx.fillStyle = gradient;
            ctx.shadowColor = '#cc44ff';
            ctx.shadowBlur = 10;
            this.roundRect(ctx, bx + 2, by + 2, (bw - 4) * hpRatio, bh - 4, 3);
            ctx.fill();
        }

        ctx.restore();
    }

    drawStartScreen(ctx, time) {
        ctx.save();

        // Title
        const pulse = Math.sin(time * 0.003) * 5;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 56px "Orbitron", sans-serif`;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 30 + pulse;
        ctx.fillText('VOID ASSAULT', this.width / 2, this.height / 2 - 80);

        // Subtitle
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px "Orbitron", monospace';
        ctx.fillText('ARCADE SPACE SHOOTER', this.width / 2, this.height / 2 - 45);

        // Start prompt (blinking)
        if (Math.floor(time / 500) % 2 === 0) {
            ctx.fillStyle = '#00ffff';
            ctx.font = '18px "Orbitron", monospace';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            ctx.fillText('PRESS ENTER TO START', this.width / 2, this.height / 2 + 20);
        }

        // Controls
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '12px monospace';
        const controls = [
            'W / ↑ - THRUST',
            'A D / ← → - ROTATE',
            'SPACE - FIRE',
            'E - SPECIAL ATTACK'
        ];
        controls.forEach((line, i) => {
            ctx.fillText(line, this.width / 2, this.height / 2 + 80 + i * 22);
        });

        ctx.restore();
    }

    drawGameOver(ctx, score, sector, wave, time) {
        ctx.save();

        // Overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.textAlign = 'center';

        // Game Over
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 48px "Orbitron", sans-serif';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 25;
        ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 60);

        // Stats
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px "Orbitron", monospace';
        ctx.fillText(`FINAL SCORE: ${score.toLocaleString()}`, this.width / 2, this.height / 2 - 10);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '13px "Orbitron", monospace';
        ctx.fillText(`Sector ${sector} - Wave ${wave}`, this.width / 2, this.height / 2 + 20);

        // Restart prompt
        if (Math.floor(time / 500) % 2 === 0) {
            ctx.fillStyle = '#00ffff';
            ctx.font = '16px "Orbitron", monospace';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            ctx.fillText('PRESS ENTER TO RESTART', this.width / 2, this.height / 2 + 70);
        }

        ctx.restore();
    }

    drawWaveAnnouncement(ctx, text, timer, maxTimer) {
        const progress = timer / maxTimer;
        let alpha;
        if (progress > 0.8) alpha = (1 - progress) * 5;
        else if (progress < 0.2) alpha = progress * 5;
        else alpha = 1;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px "Orbitron", sans-serif';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.fillText(text, this.width / 2, this.height / 2);
        ctx.restore();
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
