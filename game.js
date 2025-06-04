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

// Window click event - use object pool for bullets
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
    }
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

    // Update player deformation
    playerDeform.scaleX += (1 - playerDeform.scaleX) * playerDeform.recover;
    playerDeform.scaleY += (1 - playerDeform.scaleY) * playerDeform.recover;
    playerDeform.rotation += (0 - playerDeform.rotation) * playerDeform.recover;
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
        
        // Draw health bar
        const healthBarWidth = enemy.width;
        const healthBarHeight = 5;
        const healthBarY = enemy.y - healthBarHeight - 2;
        
        // Health bar background
        ctx.fillStyle = '#400000';
        ctx.fillRect(enemy.x, healthBarY, healthBarWidth, healthBarHeight);
        
        // Health bar foreground
        ctx.fillStyle = '#ff0000';
        const currentHealthWidth = (enemy.health / enemy.maxHealth) * healthBarWidth;
        ctx.fillRect(enemy.x, healthBarY, currentHealthWidth, healthBarHeight);
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

    // Draw score
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
}

function gameLoop(timestamp) {
    updateGame(timestamp);
    drawGame();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
