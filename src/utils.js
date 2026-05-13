// Utility functions for Void Assault

export function wrapPosition(entity, width, height, margin = 30) {
    if (entity.x < -margin) entity.x = width + margin;
    else if (entity.x > width + margin) entity.x = -margin;
    if (entity.y < -margin) entity.y = height + margin;
    else if (entity.y > height + margin) entity.y = -margin;
}

export function distance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function circleCollision(x1, y1, r1, x2, y2, r2) {
    return distance(x1, y1, x2, y2) < r1 + r2;
}

export function randomEdgeSpawn(width, height, margin = 50) {
    const side = Math.floor(Math.random() * 4);
    switch (side) {
        case 0: return { x: randomRange(0, width), y: -margin };
        case 1: return { x: width + margin, y: randomRange(0, height) };
        case 2: return { x: randomRange(0, width), y: height + margin };
        case 3: return { x: -margin, y: randomRange(0, height) };
    }
}
