import { Button } from "../ui/button.js";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: "MenuScene" });

        this.currentLevel = "MainScene";
    }

    preload() {}

    create() {
        const buttonWidth = 160;
        const buttonHeight = 50;
        let x = 50;
        let y = 50;

        this.add
            .text(x + buttonWidth / 2, y - buttonHeight / 2, "Level select")
            .setOrigin(0.5, 0.5);

        // Third person, control character
        let lv1 = new Button(this, x, y, buttonWidth, buttonHeight, "Movement type 1");
        lv1.on("pointerdown", () => {
            if (this.currentLevel != "MainScene") {
                let curSceneObj = this.scene.get(this.currentLevel);
                let width = curSceneObj.width;
                let height = curSceneObj.height;
                this.scene.stop(this.currentLevel);

                console.log("lv1");
                this.scene.launch("MainScene", [width, height]);
                this.currentLevel = "MainScene";
            }
        });

        // Third person, controls camera, fixed angle
        y += buttonHeight * 2;
        let lv2 = new Button(this, x, y, buttonWidth, buttonHeight, "Movement type 2");
        lv2.on("pointerdown", () => {
            if (this.currentLevel != "StrategyScene") {
                let curSceneObj = this.scene.get(this.currentLevel);
                let width = curSceneObj.width;
                let height = curSceneObj.height;
                console.log(width, height);
                this.scene.stop(this.currentLevel);

                console.log("lv2");
                this.scene.launch("StrategyScene", [width, height]);
                this.currentLevel = "StrategyScene";
            }
        });

        // TBD
        /*(y += buttonHeight * 2;
        let lv3 = new Button(this, x, y, buttonWidth, buttonHeight, "Level 3");
        lv3.on("pointerdown", () => {
            //if (this.currentLevel != "MainCopyScene") {
                this.scene.stop(this.currentLevel);

                console.log("lv3");
                this.scene.launch("MainCopyScene", {});
                this.currentLevel = "MainCopyScene";
            //}
        });*/
    }
}
