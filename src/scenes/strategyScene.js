import { Button } from "../ui/button.js";
const {
    enable3d,
    Scene3D,
    ExtendedObject3D,
    THREE,
    ThirdPersonControls,
    PointerLock,
    PointerDrag,
    JoyStick,
} = ENABLE3D;

const isTouchDevice = "ontouchstart" in window;

export default class StrategyScene extends Scene3D {
    constructor() {
        super({ key: "StrategyScene" });
    }

    init(data) {
        if (data.length != undefined) {
            let [width, height] = data;
            this.width = width;
            this.height = height;
            this.changeResolution = true;
        } else {
            this.changeResolution = false;
        }

        this.accessThirdDimension();
    }

    create() {
        // Get graphics settings
        if (this.changeResolution) {
            this.scale.resize(this.width, this.height);
            this.third.renderer.setSize(this.width, this.height);
            this.third.camera.aspect = this.width / this.height;
            this.third.camera.updateProjectionMatrix();
        }

        // Create environment
        this.third.warpSpeed("light", "sky");

        // Add ground
        this.ground = this.third.physics.add.box({
            x: 11.5,
            y: 0,
            z: 11.5,
            width: 20,
            depth: 20,
            height: 1,
            mass: 0,
        });

        // Adjust the camera
        this.third.camera.position.set(-15, 15, 0);
        this.third.camera.lookAt(10, -5, 0);

        // Controls
        this.keys = {
            w: this.input.keyboard.addKey("w"),
            a: this.input.keyboard.addKey("a"),
            s: this.input.keyboard.addKey("s"),
            d: this.input.keyboard.addKey("d"),
        };

        // Box without physics
        this.third.add.box({ x: 0, y: 0, z: 0 }, { lambert: { color: "red" } });    // Origin
        this.third.add.box({ x: 2, y: 0, z: 0 }, { lambert: { color: "blue" } });   // X
        this.third.add.box({ x: 0, y: 0, z: 2 }, { lambert: { color: "green" } });  // Z
        this.third.add.box({ x: 0, y: 2, z: 0 }, { lambert: { color: "yellow" } }); // Y
    }

    update() {
        if (this.keys.w.isDown) {
            this.third.camera.position.x -= 0.1;
        } else if (this.keys.s.isDown) {
            this.third.camera.position.x += 0.1;
        }

        if (this.keys.d.isDown) {
            this.third.camera.position.z -= 0.1;
        } else if (this.keys.a.isDown) {
            this.third.camera.position.z += 0.1;
        }
    }
}
