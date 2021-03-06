import { Button } from "../ui/button.js";

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
        const buttonWidth = 330;
        const buttonHeight = 50;
        let x = width / 2 - buttonWidth / 2;
        let y = height / 2 - buttonHeight * 2;

        this.add
            .text(x + buttonWidth / 2, y - buttonHeight, "Resolution")
            .setOrigin(0.5, 0.5);

        // Reduce height by browser bar
        let browserBarHeight = this.getBrowserBarHeight();

        // High
        let [fullWidth, fullHeight] = this.getResolution(1);
        let text = "Full screen (" + fullWidth + "x" + fullHeight + ")";
        let high = new Button(this, x, y, buttonWidth, buttonHeight, text);
        high.on("pointerdown", () => {
            console.log("high");
            console.log(fullHeight);
            this.scene.launch("MenuScene");
            this.scene.start("MainScene", [fullWidth, fullHeight - browserBarHeight]);
        });

        // Medium
        let [medWidth, medHeight] = this.getResolution(0.75);
        text = "Medium (" + medWidth + "x" + medHeight + ")";
        y += buttonHeight * 2;
        let medium = new Button(this, x, y, buttonWidth, buttonHeight, text);
        medium.on("pointerdown", () => {
            console.log("medium");
            this.scene.launch("MenuScene");
            this.scene.start("MainScene", [medWidth, medHeight - browserBarHeight]);
        });

        // Low
        let [lowWidth, lowHeight] = this.getResolution(0.5);
        text = "Low (" + lowWidth + "x" + lowHeight + ")";
        y += buttonHeight * 2;
        let low = new Button(this, x, y, buttonWidth, buttonHeight, text);
        low.on("pointerdown", () => {
            console.log("low");
            this.scene.launch("MenuScene");
            this.scene.start("MainScene", [lowWidth, lowHeight - browserBarHeight]);
        });
    }

    // Full: 1, Med: .75, Low: .5
    getResolution(resRatio) {
        const DPR = window.devicePixelRatio * resRatio;
        const { width, height } = window.screen;
        const WIDTH = Math.round(Math.max(width, height) * DPR);
        let HEIGHT = Math.round(Math.min(width, height) * DPR);

        return [WIDTH, HEIGHT];
    }

    getBrowserBarHeight() {
        const availableHeight =
            window.innerHeight * Math.max(1, window.devicePixelRatio / 2);
        const maxHeight = window.screen.height * Math.max(1, window.devicePixelRatio / 2);
        return maxHeight - availableHeight;
    }
}
