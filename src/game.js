const { enable3d, Canvas } = ENABLE3D;
import MainScene from "./scenes/mainScene.js";
import PreloadScene from "./scenes/preloadScene.js";
import MenuScene from "./scenes/menuScene.js";

const config = {
    type: Phaser.WEBGL,
    backgroundColor: "#ffffff",
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth * Math.max(1, window.devicePixelRatio / 2),
        height: window.innerHeight * Math.max(1, window.devicePixelRatio / 2),
    },
    parent: "phaser-game",
    scene: [PreloadScene, MainScene, MenuScene],
    ...Canvas(),
};

window.addEventListener("load", () => {
    enable3d(() => new Phaser.Game(config)).withPhysics("lib");
});
