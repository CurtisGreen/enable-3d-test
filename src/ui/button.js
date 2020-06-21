export class Button extends Phaser.GameObjects.Graphics {
    constructor(scene, x, y, width, height, text) {
        super(scene);
        let shape = new Phaser.Geom.Rectangle(x, y, width, height);

        this.lineStyle(2, 0xeb4034);
        this.strokeRectShape(shape);
        this.setInteractive(shape, Phaser.Geom.Rectangle.Contains);
        this.on("pointerover", () => {
            this.lineStyle(2, 0xffffff);
            this.strokeRectShape(shape);
        });
        this.on("pointerout", () => {
            this.lineStyle(2, 0xeb4034);
            this.strokeRectShape(shape);
        });

        scene.add.text(x + width / 2, y + height / 2, text).setOrigin(0.5, 0.5);

        scene.add.existing(this);
    }
}
