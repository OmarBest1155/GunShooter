class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = 5;
        this.color = '#00ff00';
    }

    update(input) {
        if (input.isKeyPressed('ArrowLeft')) this.x -= this.speed;
        if (input.isKeyPressed('ArrowRight')) this.x += this.speed;
        if (input.isKeyPressed('ArrowUp')) this.y -= this.speed;
        if (input.isKeyPressed('ArrowDown')) this.y += this.speed;

        this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
        this.y = Math.max(0, Math.min(this.y, canvas.height - this.height));
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
