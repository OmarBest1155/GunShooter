class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.speed = 7;
        this.width = 5;
        this.height = 5;
        this.angle = angle;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }

    draw(ctx) {
        ctx.fillStyle = '#yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
