const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

const input = new InputHandler();
const player = new Player(canvas.width / 2, canvas.height / 2);
let enemies = [];
let bullets = [];
let score = 0;

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    bullets.push(new Bullet(player.x + player.width/2, player.y + player.height/2, angle));
});

function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch(side) {
        case 0: x = 0; y = Math.random() * canvas.height; break;
        case 1: x = canvas.width; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = 0; break;
        case 3: x = Math.random() * canvas.width; y = canvas.height; break;
    }
    enemies.push(new Enemy(x, y));
}

function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);
                score += 10;
                document.getElementById('scoreValue').textContent = score;
            }
        });
    });
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (Math.random() < 0.02) spawnEnemy();

    player.update(input);
    player.draw(ctx);

    enemies.forEach((enemy, index) => {
        enemy.update(player.x, player.y);
        enemy.draw(ctx);
        
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            alert('Game Over! Score: ' + score);
            location.reload();
        }
    });

    bullets = bullets.filter(bullet => {
        bullet.update();
        bullet.draw(ctx);
        return bullet.x > 0 && bullet.x < canvas.width &&
               bullet.y > 0 && bullet.y < canvas.height;
    });

    checkCollisions();
    requestAnimationFrame(gameLoop);
}

gameLoop();
