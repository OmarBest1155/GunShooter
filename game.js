const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Player properties
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 50,
    height: 50,
    speed: 10,
    color: '#00ff00'
};

// Player deformation properties
const playerDeform = {
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    recover: 0.15  // Recovery speed
};

// Bullets array
const bullets = [];
const bulletSpeed = 30;
const bulletSize = 5;

// Enemies array
const enemies = [];
const enemySpeed = 2;
const enemySpawnRate = 60; // Spawn enemy every 60 frames
let frameCount = 0;
let score = 0;

// Enemy properties
const enemy = {
    width: 40,
    height: 40,
    color: '#ff0000'
};

// Add new crack system
const crackSystem = {
    patterns: [
        { points: [[0,0], [0.2,-0.1], [0.4,0.1], [0.6,-0.2]], spread: 0.15 },
        { points: [[0,0], [-0.1,0.2], [0.1,0.4], [-0.2,0.6]], spread: 0.12 },
        { points: [[0,0], [0.15,0.15], [0.3,0.1], [0.45,0.2]], spread: 0.1 }
    ],
    animations: []
};

function createCrack(enemy, intensity) {
    const centerX = enemy.x + enemy.width / 2;
    const centerY = enemy.y + enemy.height / 2;
    
    crackSystem.patterns.forEach(pattern => {
        const angle = Math.random() * Math.PI * 2;
        const scale = enemy.width * 0.8;
        
        const crack = {
            points: pattern.points.map(([x, y]) => ({
                x: centerX + Math.cos(angle) * x * scale + (Math.random() - 0.5) * pattern.spread * scale,
                y: centerY + Math.sin(angle) * y * scale + (Math.random() - 0.5) * pattern.spread * scale,
                baseX: x * scale,
                baseY: y * scale
            })),
            progress: 0,
            growthSpeed: 0.1,
            enemy: enemy,
            intensity: intensity,
            angle: angle
        };
        
        crackSystem.animations.push(crack);
    });
}

// Game controls
const keys = {
    a: false,
    d: false
};

// Object pools
const POOL_SIZE = 100;
const bulletPool = Array(POOL_SIZE).fill().map(() => ({ 
    active: false, 
    x: 0, 
    y: 0, 
    vx: 0, 
    vy: 0,
    speed: bulletSpeed 
}));
const enemyPool = Array(POOL_SIZE).fill().map(() => ({ 
    active: false, 
    x: 0, 
    y: 0, 
    vx: 0,
    vy: 0,
    width: enemy.width, 
    height: enemy.height,
    maxHealth: 2,
    health: 2
}));

// Add wall animation properties
const walls = {
    left: {
        color: '#333333',
        activeColor: '#ff0000',
        width: 10,
        compression: 0,
        isActive: false
    },
    right: {
        color: '#333333',
        activeColor: '#ff0000',
        width: 10,
        compression: 0,
        isActive: false
    }
};

// Add bounce animation properties
const bounce = {
    active: false,
    direction: 1,
    strength: 0,
    duration: 500,
    startTime: 0,
    targetX: 0
};

// Add particle system
const particles = [];
const PARTICLE_COUNT = 20;
const PARTICLE_LIFETIME = 500;

function createBounceParticles(x, y, direction) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x,
            y: y + Math.random() * player.height,
            vx: direction * (Math.random() * 5 + 2),
            vy: (Math.random() - 0.5) * 5,
            life: PARTICLE_LIFETIME,
            color: `hsl(${Math.random() * 30 + 0}, 100%, 50%)`
        });
    }
}

// Add explosion system
const explosions = [];
const EXPLOSION_PARTICLES = 15;
const EXPLOSION_LIFETIME = 1000;
const EXPLOSION_SPEED = 3;

function createExplosion(enemy) {
    const pieces = [];
    const size = 10; // Size of each piece
    
    for (let i = 0; i < EXPLOSION_PARTICLES; i++) {
        const angle = (Math.PI * 2 / EXPLOSION_PARTICLES) * i;
        pieces.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            size: size,
            vx: Math.cos(angle) * EXPLOSION_SPEED * (Math.random() + 0.5),
            vy: Math.sin(angle) * EXPLOSION_SPEED * (Math.random() + 0.5),
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            life: EXPLOSION_LIFETIME,
            color: enemy.color,
            alpha: 1
        });
    }
    explosions.push(pieces);
}

// Get object from pool
function getFromPool(pool) {
    return pool.find(obj => !obj.active);
}

// Event listeners
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'a') keys.a = true;
    if (e.key.toLowerCase() === 'd') keys.d = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() === 'a') keys.a = false;
    if (e.key.toLowerCase() === 'd') keys.d = false;
});

// Add mouse position tracking
const mouse = {
    x: 0,
    y: 0
};

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Add hit effects system
const hitEffects = [];
function createHitEffect(x, y) {
    // Create pixel-like particles
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i + Math.random() * 0.5;
        const speed = 2 + Math.random() * 3;
        hitEffects.push({
            x, y,
            size: 4 + Math.random() * 4,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            alpha: 1,
            decay: 0.02 + Math.random() * 0.02,
            color: Math.random() > 0.5 ? '#ffff00' : '#ff6600',
            type: 'pixel'
        });
    }
}

// Add wind particles system
const windParticles = [];
const MAX_WIND_PARTICLES = 20;
function createWindParticle(direction) {
    const PARTICLES_PER_FRAME = 2;
    for (let i = 0; i < PARTICLES_PER_FRAME; i++) {
        if (windParticles.length < MAX_WIND_PARTICLES) {
            const side = direction === 'left' ? player.x + player.width : player.x;
            windParticles.push({
                x: side,
                y: player.y + Math.random() * player.height,
                size: 2 + Math.random() * 3,
                speed: 15 + Math.random() * 10,
                alpha: 0.8,
                direction,
                rotation: Math.random() * Math.PI * 2
            });
        }
    }
}

// Add bullet trail system before hit effects
const bulletTrails = [];
function createBulletTrail(x, y, angle) {
    // Limit number of trails
    if (bulletTrails.length > 5) {
        bulletTrails.shift(); // Remove oldest trail
    }
    
    bulletTrails.push({
        x, y,
        angle,
        length: 15,
        width: 2,
        alpha: 1,
        decay: 0.2,
        lifeTime: 100 // milliseconds
    });
}

// Modify window click event
window.addEventListener('click', (e) => {
    const bullet = getFromPool(bulletPool);
    if (bullet) {
        bullet.x = player.x + player.width / 2;
        bullet.y = player.y;
        
        // Calculate direction
        const dx = mouse.x - bullet.x;
        const dy = mouse.y - bullet.y;
        const angle = Math.atan2(dy, dx);
        
        // Set velocity components
        bullet.vx = Math.cos(angle) * bullet.speed;
        bullet.vy = Math.sin(angle) * bullet.speed;
        bullet.active = true;
        createBulletTrail(bullet.x, bullet.y, Math.atan2(bullet.vy, bullet.vx));
    }
});

document.getElementById('upgradeBtn').addEventListener('click', () => {
    // Will be implemented later
    const btn = document.getElementById('upgradeBtn');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        btn.style.transform = '';
    }, 100);
});

let lastTime = 0;
function updateGame(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Update bounce animation
    if (bounce.active) {
        const progress = (timestamp - bounce.startTime) / bounce.duration;
        if (progress < 1) {
            const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease out
            player.x = player.x + (bounce.targetX - player.x) * easeOut;
        } else {
            bounce.active = false;
        }
    }

    // Update walls
    walls.left.compression *= 0.9;
    walls.right.compression *= 0.9;
    walls.left.isActive = false;
    walls.right.isActive = false;

    // Move player with bounce effect
    if (!bounce.active) {
        if (keys.a) {
            player.x -= player.speed;
            if (player.x < walls.left.width) {
                walls.left.isActive = true;
                walls.left.compression = 20;
                bounce.active = true;
                bounce.startTime = timestamp;
                bounce.targetX = canvas.width * 0.3;
                createBounceParticles(walls.left.width, player.y, 1);
                // Add deformation
                playerDeform.scaleX = 0.5;  // Squish horizontally
                playerDeform.scaleY = 1.4;  // Stretch vertically
                playerDeform.rotation = -0.1; // Slight tilt
            }
        }
        if (keys.d) {
            player.x += player.speed;
            if (player.x + player.width > canvas.width - walls.right.width) {
                walls.right.isActive = true;
                walls.right.compression = 20;
                bounce.active = true;
                bounce.startTime = timestamp;
                bounce.targetX = canvas.width * 0.7 - player.width;
                createBounceParticles(canvas.width - walls.right.width, player.y, -1);
                // Add deformation
                playerDeform.scaleX = 0.5;
                playerDeform.scaleY = 1.4;
                playerDeform.rotation = 0.1;
            }
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= deltaTime;
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update bullets
    bulletPool.forEach(bullet => {
        if (!bullet.active) return;
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        // Check if bullet is off screen
        if (bullet.x < 0 || bullet.x > canvas.width || 
            bullet.y < 0 || bullet.y > canvas.height) {
            bullet.active = false;
        }
    });

    // Spawn enemies
    frameCount++;
    if (frameCount % enemySpawnRate === 0) {
        const enemy = getFromPool(enemyPool);
        if (enemy) {
            enemy.x = Math.random() * (canvas.width - enemy.width);
            enemy.y = -enemy.height;
            enemy.health = enemy.maxHealth;  // Reset health
            // Calculate direction towards player
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const angle = Math.atan2(dy, dx);
            enemy.vx = Math.cos(angle) * enemySpeed;
            enemy.vy = Math.sin(angle) * enemySpeed;
            enemy.active = true;
        }
    }

    // Update enemies
    enemyPool.forEach(enemy => {
        if (!enemy.active) return;
        
        // Move enemy towards player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const angle = Math.atan2(dy, dx);
        enemy.vx = Math.cos(angle) * enemySpeed;
        enemy.vy = Math.sin(angle) * enemySpeed;
        
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Check collision with player
        if (enemyHitsPlayer(enemy, player)) {
            alert('Game Over! Score: ' + score);
            enemyPool.forEach(e => e.active = false);
            bulletPool.forEach(b => b.active = false);
            score = 0;
            enemy.active = false;
            // Reset player position
            player.x = canvas.width / 2;
            player.y = canvas.height - 100;
            return;
        }

        // Check bullet collisions
        const activeBullets = bulletPool.filter(b => b.active);
        for (const bullet of activeBullets) {
            if (collision(bullet, enemy)) {
                enemy.health--;
                bullet.active = false;
                createHitEffect(bullet.x, bullet.y);
                // Create crack animation when hit
                createCrack(enemy, (enemy.maxHealth - enemy.health) / enemy.maxHealth);
                
                if (enemy.health <= 0) {
                    createExplosion(enemy);
                    enemy.active = false;
                    score += 10;
                }
                break;
            }
        }
    });

    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        const pieces = explosions[i];
        let allDead = true;
        
        for (let j = pieces.length - 1; j >= 0; j--) {
            const piece = pieces[j];
            piece.x += piece.vx;
            piece.y += piece.vy;
            piece.rotation += piece.rotationSpeed;
            piece.life -= deltaTime;
            piece.alpha = piece.life / EXPLOSION_LIFETIME;
            piece.vy += 0.1; // Add gravity effect
            
            if (piece.life > 0) allDead = false;
        }
        
        if (allDead) explosions.splice(i, 1);
    }

    // Update crack animations
    crackSystem.animations = crackSystem.animations.filter(crack => {
        if (!crack.enemy.active) return false;
        
        crack.progress += crack.growthSpeed;
        if (crack.progress > 1) crack.progress = 1;
        
        // Make cracks follow enemy
        const centerX = crack.enemy.x + crack.enemy.width / 2;
        const centerY = crack.enemy.y + crack.enemy.height / 2;
        
        crack.points.forEach((point, i) => {
            point.x = centerX + Math.cos(crack.angle) * point.baseX;
            point.y = centerY + Math.sin(crack.angle) * point.baseY;
        });
        
        return crack.enemy.active;
    });

    // Update hit effects
    for (let i = hitEffects.length - 1; i >= 0; i--) {
        const effect = hitEffects[i];
        if (effect.type === 'pixel') {
            effect.x += effect.vx;
            effect.y += effect.vy;
            effect.rotation += effect.rotationSpeed;
            effect.alpha -= effect.decay;
            if (effect.alpha <= 0) hitEffects.splice(i, 1);
        }
    }

    // Update wind particles - make continuous during movement
    if (keys.a || keys.d) {
        createWindParticle(keys.a ? 'left' : 'right');
    }
    for (let i = windParticles.length - 1; i >= 0; i--) {
        const wind = windParticles[i];
        wind.x += wind.direction === 'left' ? wind.speed : -wind.speed;
        wind.rotation += 0.1;
        wind.alpha -= 0.04;
        if (wind.alpha <= 0) windParticles.splice(i, 1);
    }

    // Update bullet trails
    for (let i = bulletTrails.length - 1; i >= 0; i--) {
        const trail = bulletTrails[i];
        trail.alpha -= trail.decay;
        trail.lifeTime -= deltaTime;
        if (trail.alpha <= 0 || trail.lifeTime <= 0) {
            bulletTrails.splice(i, 1);
        }
    }

    // Update player deformation
    playerDeform.scaleX += (1 - playerDeform.scaleX) * playerDeform.recover;
    playerDeform.scaleY += (1 - playerDeform.scaleY) * playerDeform.recover;
    playerDeform.rotation += (0 - playerDeform.rotation) * playerDeform.recover;

    updateWaveEffects(timestamp);
}

// Collision detection function
function collision(bullet, enemy) {
    // Find the closest point to the circle within the rectangle
    const closestX = Math.max(enemy.x, Math.min(bullet.x, enemy.x + enemy.width));
    const closestY = Math.max(enemy.y, Math.min(bullet.y, enemy.y + enemy.height));

    // Calculate the distance between the circle's center and the closest point
    const distanceX = bullet.x - closestX;
    const distanceY = bullet.y - closestY;
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

    // If the distance is less than the circle's radius, collision detected
    return distanceSquared <= (bulletSize * bulletSize);
}

function enemyHitsPlayer(enemy, player) {
    return enemy.x < player.x + player.width &&
           enemy.x + enemy.width > player.x &&
           enemy.y < player.y + player.height &&
           enemy.y + enemy.height > player.y;
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw walls with compression effect
    ctx.fillStyle = walls.left.isActive ? walls.left.activeColor : walls.left.color;
    ctx.fillRect(0, 0, walls.left.width + walls.left.compression, canvas.height);
    
    ctx.fillStyle = walls.right.isActive ? walls.right.activeColor : walls.right.color;
    ctx.fillRect(canvas.width - walls.right.width - walls.right.compression, 0, 
                 walls.right.width + walls.right.compression, canvas.height);

    // Draw particles
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / PARTICLE_LIFETIME;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw player with deformation and shadow effect
    ctx.save();
    if (bounce.active) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 20;
    }
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(playerDeform.rotation);
    ctx.scale(playerDeform.scaleX, playerDeform.scaleY);
    ctx.fillStyle = player.color;
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    ctx.restore();
    ctx.shadowBlur = 0;

    // Draw active bullets
    ctx.fillStyle = '#ff0000';
    bulletPool.forEach(bullet => {
        if (!bullet.active) return;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bulletSize, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw active enemies
    enemyPool.forEach(enemy => {
        if (!enemy.active) return;
        
        // Draw enemy
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Draw damage visualization
        crackSystem.animations.forEach(crack => {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 5;
            
            ctx.beginPath();
            const visiblePoints = Math.floor(crack.points.length * crack.progress);
            for (let i = 0; i < visiblePoints; i++) {
                const point = crack.points[i];
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(point.x + 1, point.y + 1);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        });
        
        // Draw rounded health bar
        const healthBarWidth = enemy.width * 1.2; // Make bar wider than enemy
        const healthBarHeight = 8; // Increased height
        const healthBarY = enemy.y - healthBarHeight - 4;
        const healthBarX = enemy.x + (enemy.width - healthBarWidth) / 2;
        
        // Health bar background with round corners
        ctx.fillStyle = '#400000';
        ctx.beginPath();
        ctx.roundRect(
            healthBarX,
            healthBarY,
            healthBarWidth,
            healthBarHeight,
            4 // Corner radius
        );
        ctx.fill();
        
        // Health bar foreground with round corners
        ctx.fillStyle = '#ff0000';
        const currentHealthWidth = (enemy.health / enemy.maxHealth) * healthBarWidth;
        ctx.beginPath();
        ctx.roundRect(
            healthBarX,
            healthBarY,
            currentHealthWidth,
            healthBarHeight,
            4
        );
        ctx.fill();
    });

    // Draw explosions
    explosions.forEach(pieces => {
        pieces.forEach(piece => {
            ctx.save();
            ctx.globalAlpha = piece.alpha;
            ctx.translate(piece.x, piece.y);
            ctx.rotate(piece.rotation);
            ctx.fillStyle = piece.color;
            ctx.fillRect(-piece.size/2, -piece.size/2, piece.size, piece.size);
            ctx.restore();
        });
    });

    // Draw bullet trails
    bulletTrails.forEach(trail => {
        ctx.save();
        ctx.translate(trail.x, trail.y);
        ctx.rotate(trail.angle);
        const gradient = ctx.createLinearGradient(0, 0, -trail.length, 0);
        gradient.addColorStop(0, `rgba(255, 200, 0, ${trail.alpha})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(-trail.length, -trail.width/2, trail.length, trail.width);
        ctx.restore();
    });

    // Draw hit effects
    hitEffects.forEach(effect => {
        if (effect.type === 'pixel') {
            ctx.save();
            ctx.globalAlpha = effect.alpha;
            ctx.translate(effect.x, effect.y);
            ctx.rotate(effect.rotation);
            ctx.fillStyle = effect.color;
            ctx.fillRect(-effect.size/2, -effect.size/2, effect.size, effect.size);
            ctx.restore();
        }
    });

    // Draw wind particles
    windParticles.forEach(wind => {
        ctx.save();
        ctx.globalAlpha = wind.alpha;
        ctx.translate(wind.x, wind.y);
        ctx.rotate(wind.rotation);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-wind.size/2, -wind.size/2, wind.size, wind.size);
        ctx.restore();
    });
}

// Wave system
const waveSystem = {
    currentWave: 1,
    maxWaves: 100,
    progress: 0,
    progressBlocks: document.querySelector('.progressBlocks'),
    waveNumber: document.querySelector('.waveNumber'),
    isTransitioning: false
};

// Update the wave display function
function updateWaveDisplay() {
    waveSystem.waveNumber.textContent = `WAVE ${waveSystem.currentWave}`;
    waveSystem.progressBlocks.style.width = `${waveSystem.progress}%`;
}

function updateWaveEffects(timestamp) {
    if (!waveSystem.isTransitioning) {
        const oscillation = Math.sin(timestamp * 0.002) * 2;
        waveSystem.progressBlocks.style.filter = `brightness(${100 + oscillation}%) contrast(120%)`;
    }
}

// Initialize wave display
updateWaveDisplay();

function gameLoop(timestamp) {
    updateGame(timestamp);
    drawGame();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// Add wave bar particle system
const waveBarParticles = [];
// Update wave bar particle system constants
const MAX_BAR_PARTICLES = 15; // Reduced from 30
const PARTICLE_SPAWN_RATE = 100; // New spawn rate limiter
let lastParticleSpawn = 0;

function createWaveBarParticle() {
    const now = performance.now();
    if (now - lastParticleSpawn < PARTICLE_SPAWN_RATE) return null;
    lastParticleSpawn = now;

    const waveBar = document.getElementById('waveBar');
    const rect = waveBar.getBoundingClientRect();
    
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const side = Math.random() > 0.5 ? 'left' : 'right';
    const startY = rect.top + Math.random() * rect.height;
    
    particle.style.left = side === 'left' ? rect.left + 'px' : (rect.right - 4) + 'px';
    particle.style.top = startY + 'px';
    
    const speed = 0.5 + Math.random(); // Reduced speed
    const angle = (Math.random() * 30 - 15) * (Math.PI / 180);
    const vx = Math.cos(angle) * speed * (side === 'left' ? 1 : -1);
    const vy = Math.sin(angle) * speed;
    
    document.body.appendChild(particle);
    
    return {
        element: particle,
        x: parseFloat(particle.style.left),
        y: parseFloat(particle.style.top),
        vx,
        vy,
        life: 800 + Math.random() * 500 // Reduced lifetime
    };
}

function updateWaveBarParticles(deltaTime) {
    // Create new particles with rate limiting
    if (waveBarParticles.length < MAX_BAR_PARTICLES) {
        const newParticle = createWaveBarParticle();
        if (newParticle) waveBarParticles.push(newParticle);
    }
    
    // Update particles using transform for better performance
    for (let i = waveBarParticles.length - 1; i >= 0; i--) {
        const particle = waveBarParticles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= deltaTime;
        
        particle.element.style.transform = 
            `translate3d(${particle.x}px, ${particle.y}px, 0)`;
        particle.element.style.opacity = particle.life / 1300;
        
        if (particle.life <= 0) {
            particle.element.remove();
            waveBarParticles.splice(i, 1);
        }
    }
}

// Add to updateGame function before requestAnimationFrame
function updateGame(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Update bounce animation
    if (bounce.active) {
        const progress = (timestamp - bounce.startTime) / bounce.duration;
        if (progress < 1) {
            const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease out
            player.x = player.x + (bounce.targetX - player.x) * easeOut;
        } else {
            bounce.active = false;
        }
    }

    // Update walls
    walls.left.compression *= 0.9;
    walls.right.compression *= 0.9;
    walls.left.isActive = false;
    walls.right.isActive = false;

    // Move player with bounce effect
    if (!bounce.active) {
        if (keys.a) {
            player.x -= player.speed;
            if (player.x < walls.left.width) {
                walls.left.isActive = true;
                walls.left.compression = 20;
                bounce.active = true;
                bounce.startTime = timestamp;
                bounce.targetX = canvas.width * 0.3;
                createBounceParticles(walls.left.width, player.y, 1);
                // Add deformation
                playerDeform.scaleX = 0.5;  // Squish horizontally
                playerDeform.scaleY = 1.4;  // Stretch vertically
                playerDeform.rotation = -0.1; // Slight tilt
            }
        }
        if (keys.d) {
            player.x += player.speed;
            if (player.x + player.width > canvas.width - walls.right.width) {
                walls.right.isActive = true;
                walls.right.compression = 20;
                bounce.active = true;
                bounce.startTime = timestamp;
                bounce.targetX = canvas.width * 0.7 - player.width;
                createBounceParticles(canvas.width - walls.right.width, player.y, -1);
                // Add deformation
                playerDeform.scaleX = 0.5;
                playerDeform.scaleY = 1.4;
                playerDeform.rotation = 0.1;
            }
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= deltaTime;
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update bullets
    bulletPool.forEach(bullet => {
        if (!bullet.active) return;
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        // Check if bullet is off screen
        if (bullet.x < 0 || bullet.x > canvas.width || 
            bullet.y < 0 || bullet.y > canvas.height) {
            bullet.active = false;
        }
    });

    // Spawn enemies
    frameCount++;
    if (frameCount % enemySpawnRate === 0) {
        const enemy = getFromPool(enemyPool);
        if (enemy) {
            enemy.x = Math.random() * (canvas.width - enemy.width);
            enemy.y = -enemy.height;
            enemy.health = enemy.maxHealth;  // Reset health
            // Calculate direction towards player
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const angle = Math.atan2(dy, dx);
            enemy.vx = Math.cos(angle) * enemySpeed;
            enemy.vy = Math.sin(angle) * enemySpeed;
            enemy.active = true;
        }
    }

    // Update enemies
    enemyPool.forEach(enemy => {
        if (!enemy.active) return;
        
        // Move enemy towards player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const angle = Math.atan2(dy, dx);
        enemy.vx = Math.cos(angle) * enemySpeed;
        enemy.vy = Math.sin(angle) * enemySpeed;
        
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Check collision with player
        if (enemyHitsPlayer(enemy, player)) {
            alert('Game Over! Score: ' + score);
            enemyPool.forEach(e => e.active = false);
            bulletPool.forEach(b => b.active = false);
            score = 0;
            enemy.active = false;
            // Reset player position
            player.x = canvas.width / 2;
            player.y = canvas.height - 100;
            return;
        }

        // Check bullet collisions
        const activeBullets = bulletPool.filter(b => b.active);
        for (const bullet of activeBullets) {
            if (collision(bullet, enemy)) {
                enemy.health--;
                bullet.active = false;
                createHitEffect(bullet.x, bullet.y);
                // Create crack animation when hit
                createCrack(enemy, (enemy.maxHealth - enemy.health) / enemy.maxHealth);
                
                if (enemy.health <= 0) {
                    createExplosion(enemy);
                    enemy.active = false;
                    score += 10;
                }
                break;
            }
        }
    });

    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        const pieces = explosions[i];
        let allDead = true;
        
        for (let j = pieces.length - 1; j >= 0; j--) {
            const piece = pieces[j];
            piece.x += piece.vx;
            piece.y += piece.vy;
            piece.rotation += piece.rotationSpeed;
            piece.life -= deltaTime;
            piece.alpha = piece.life / EXPLOSION_LIFETIME;
            piece.vy += 0.1; // Add gravity effect
            
            if (piece.life > 0) allDead = false;
        }
        
        if (allDead) explosions.splice(i, 1);
    }

    // Update crack animations
    crackSystem.animations = crackSystem.animations.filter(crack => {
        if (!crack.enemy.active) return false;
        
        crack.progress += crack.growthSpeed;
        if (crack.progress > 1) crack.progress = 1;
        
        // Make cracks follow enemy
        const centerX = crack.enemy.x + crack.enemy.width / 2;
        const centerY = crack.enemy.y + crack.enemy.height / 2;
        
        crack.points.forEach((point, i) => {
            point.x = centerX + Math.cos(crack.angle) * point.baseX;
            point.y = centerY + Math.sin(crack.angle) * point.baseY;
        });
        
        return crack.enemy.active;
    });

    // Update hit effects
    for (let i = hitEffects.length - 1; i >= 0; i--) {
        const effect = hitEffects[i];
        if (effect.type === 'pixel') {
            effect.x += effect.vx;
            effect.y += effect.vy;
            effect.rotation += effect.rotationSpeed;
            effect.alpha -= effect.decay;
            if (effect.alpha <= 0) hitEffects.splice(i, 1);
        }
    }

    // Update wind particles - make continuous during movement
    if (keys.a || keys.d) {
        createWindParticle(keys.a ? 'left' : 'right');
    }
    for (let i = windParticles.length - 1; i >= 0; i--) {
        const wind = windParticles[i];
        wind.x += wind.direction === 'left' ? wind.speed : -wind.speed;
        wind.rotation += 0.1;
        wind.alpha -= 0.04;
        if (wind.alpha <= 0) windParticles.splice(i, 1);
    }

    // Update bullet trails
    for (let i = bulletTrails.length - 1; i >= 0; i--) {
        const trail = bulletTrails[i];
        trail.alpha -= trail.decay;
        trail.lifeTime -= deltaTime;
        if (trail.alpha <= 0 || trail.lifeTime <= 0) {
            bulletTrails.splice(i, 1);
        }
    }

    // Update player deformation
    playerDeform.scaleX += (1 - playerDeform.scaleX) * playerDeform.recover;
    playerDeform.scaleY += (1 - playerDeform.scaleY) * playerDeform.recover;
    playerDeform.rotation += (0 - playerDeform.rotation) * playerDeform.recover;

    updateWaveBarParticles(deltaTime);
    updateWaveEffects(timestamp);
}
