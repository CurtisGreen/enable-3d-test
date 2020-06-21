import { Button } from "../ui/button.js";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: "MenuScene" });

        this.currentLevel = 1;
    }

    preload() {}

    create() {
        const buttonWidth = 80;
        const buttonHeight = 50;
        let x = 50;
        let y = 50;

        this.add
            .text(x + buttonWidth / 2, y - buttonHeight / 2, "Level select")
            .setOrigin(0.5, 0.5);

        // High
        let lv1 = new Button(this, x, y, buttonWidth, buttonHeight, "Level 1");
        lv1.on("pointerdown", () => {
            console.log("lv1");
            if (this.currentLevel != 1) {
            }
            //this.scene.start("MainScene", 1);
        });

        // Medium
        y += buttonHeight * 2;
        let lv2 = new Button(this, x, y, buttonWidth, buttonHeight, "Level 2");
        lv2.on("pointerdown", () => {
            console.log("lv2");
            if (this.currentLevel != 2) {
            }
            //this.scene.start("MainScene", 0.75);
        });

        // Low
        y += buttonHeight * 2;
        let lv3 = new Button(this, x, y, buttonWidth, buttonHeight, "Level 3");
        lv3.on("pointerdown", () => {
            console.log("lv3");
            if (this.currentLevel != 3) {
            }
            //this.scene.start("MainScene", 0.5);
        });
    }
}
