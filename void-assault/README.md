# 🚀 Void Assault

**Arcade Space Shooter** inspirado em *Asteroids*, *Galaga* e *Vampire Survivors*.

## 🎮 Como Jogar

| Tecla | Ação |
|-------|------|
| **W** / **↑** | Propulsão |
| **A** / **←** | Girar esquerda |
| **D** / **→** | Girar direita |
| **SPACE** | Atirar |
| **ENTER** | Iniciar / Reiniciar |

## 🛸 Mecânicas

- **Física de Inércia:** A nave desliza no vácuo do espaço
- **Screen Wrap:** Saia por um lado, apareça no outro
- **Ondas:** Sobreviva às ondas de inimigos e enfrente o Boss
- **Power-ups:** Coletáveis de vida (+25 HP) e tiro rápido

## 👾 Inimigos

| Tipo | Comportamento | Pontos |
|------|--------------|--------|
| **Drone** (Verde) | Segue o jogador lentamente | 100 |
| **Stalker** (Laranja) | Flanqueia e tenta colidir | 250 |
| **Shooter** (Vermelho) | Mantém distância e dispara | 500 |

## 🏃 Executar Localmente

```bash
npx -y serve .
```

Acesse `http://localhost:3000` no navegador.

## 📁 Estrutura

```
/void-assault
├── index.html          # Ponto de entrada
├── README.md           # Este arquivo
└── /src
    ├── main.js         # Game loop e gerenciamento de estado
    ├── player.js       # Nave do jogador
    ├── enemy.js        # IA dos inimigos (Drone, Stalker, Shooter)
    ├── boss.js         # Boss com padrões de ataque
    ├── bullet.js       # Sistema de projéteis
    ├── powerup.js      # Power-ups
    ├── particles.js    # Sistema de partículas
    ├── stars.js        # Fundo estelar parallax
    ├── ui.js           # HUD e telas de menu
    └── utils.js        # Funções utilitárias
```
