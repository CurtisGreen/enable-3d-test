export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: "PreloadScene" });
    }

    preload() {}

    create() {
        this.cameras.main.setBackgroundColor(0xbababa);

        // Graphics settings
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const buttonWidth = 80;
        const buttonHeight = 50;
        let x = width / 2;
        let y = height / 2 - buttonHeight * 2;

        this.add.text(x + buttonWidth / 2, y - buttonHeight, "Resolution").setOrigin(0.5, 0.5);

        // High
        let high = new Button(this, x, y, buttonWidth, buttonHeight, "High");
        high.on("pointerdown", () => {
            console.log("high");
            this.scene.start("MainScene", 1);
        });

        // Medium
        y += buttonHeight * 2;
        let medium = new Button(this, x, y, buttonWidth, buttonHeight, "Medium");
        medium.on("pointerdown", () => {
            console.log("medium");
            this.scene.start("MainScene", 0.75);
        });

        // Low
        y += buttonHeight * 2;
        let low = new Button(this, x, y, buttonWidth, buttonHeight, "Low");
        low.on("pointerdown", () => {
            console.log("low");
            this.scene.start("MainScene", 0.5);
        });
    }
}

class Button extends Phaser.GameObjects.Graphics {
    constructor(scene, x, y, width, height, text) {
        super(scene);
        let shape = new Phaser.Geom.Rectangle(x, y, width, height);

        this.lineStyle(2, 0xeb4034);
        this.strokeRectShape(shape);
        this.setInteractive(shape, Phaser.Geom.Rectangle.Contains);
        this.on("pointerover", () => {
            this.lineStyle(2, 0xFFFFFF);
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
