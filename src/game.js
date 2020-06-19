const { enable3d, Canvas } = ENABLE3D
import MainScene from './scenes/mainScene.js'
import PreloadScene from './scenes/preloadScene.js'

const config = {
  type: Phaser.WEBGL,
  backgroundColor: '#ffffff',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  parent: "phaser-game",
  scene: [PreloadScene, MainScene],
  ...Canvas()
}

window.addEventListener('load', () => {
  enable3d(() => new Phaser.Game(config)).withPhysics('./lib')
})