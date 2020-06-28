const { enable3d, Canvas } = ENABLE3D;
import MainScene from "./scenes/mainScene.js";
import PreloadScene from "./scenes/preloadScene.js";
import MenuScene from "./scenes/menuScene.js";
import StrategyScene from "./scenes/strategyScene.js";
import RunScene from "./scenes/runScene.js";

const config = {
    type: Phaser.WEBGL,
    backgroundColor: "#ffffff",
    scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth * Math.max(1, window.devicePixelRatio / 2) - 10,
        height: window.innerHeight * Math.max(1, window.devicePixelRatio / 2) - 10,
    },
    parent: "phaser-game",
    scene: [PreloadScene, MainScene, StrategyScene, MenuScene, RunScene],
    ...Canvas(),
};

window.addEventListener("load", () => {
    enable3d(() => new Phaser.Game(config)).withPhysics("lib");
});
