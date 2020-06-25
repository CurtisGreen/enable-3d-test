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

        this.selectionBox = {};
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
        this.third.add.box({ x: 0, y: 0, z: 0 }, { lambert: { color: "red" } }); // Origin
        this.third.add.box({ x: 2, y: 0, z: 0 }, { lambert: { color: "blue" } }); // X
        this.third.add.box({ x: 0, y: 0, z: 2 }, { lambert: { color: "green" } }); // Z
        this.third.add.box({ x: 0, y: 2, z: 0 }, { lambert: { color: "yellow" } }); // Y

        // Add selectable unit
        this.unit = this.third.add.box(
            { x: 10, y: 1, z: 10 },
            { lambert: { color: "gray" } }
        );

        // Show where your cursor is
        this.selectionBox = this.third.add.box(
            { x: 1, y: 0, z: 1, width: 1, height: 0.1 },
            { lambert: { color: 0x0000ff } }
        );

        // Create box on click
        this.input.on("pointerdown", (pointer) => {
            const [point, id] = this.getIntersection([this.unit, this.ground]);
            if (point) {
                this.third.physics.add.box(point);
            }
        });
    }

    update() {
        if (this.keys.w.isDown) {
            this.third.camera.position.x += 0.1;
        } else if (this.keys.s.isDown) {
            this.third.camera.position.x -= 0.1;
        }

        if (this.keys.d.isDown) {
            this.third.camera.position.z += 0.1;
        } else if (this.keys.a.isDown) {
            this.third.camera.position.z -= 0.1;
        }

        this.updateSelectionBox();
    }

    getIntersection(objects) {
        if (objects.length != 0) {
            // Check line of sight to object
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(this.getPointer2d(), this.third.camera);
            const intersection = raycaster.intersectObjects(objects);

            if (intersection.length != 0) {
                let output = {
                    x: Math.round(intersection[0].point.x),
                    y: Math.round(intersection[0].point.y),
                    z: Math.round(intersection[0].point.z),
                };
                return [output, intersection[0].object.id];
            } else {
                return [false, false];
            }
        } else {
            return [false, false];
        }
    }

    getPointer2d() {
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        const pointer = this.input.activePointer;
        const x = (pointer.x / this.cameras.main.width) * 2 - 1;
        const y = -(pointer.y / this.cameras.main.height) * 2 + 1;
        return { x, y };
    }

    updateSelectionBox() {
        const [point, id] = this.getIntersection([this.unit, this.ground]);
        if (point && this.selectionBox.position != undefined) {
            // Selected unit
            if (id == this.unit.id) {
                this.selectionBox.visible = false;
                this.unit.material.color.set(0x0000ff);
            }
            // Selected ground
            else {
                this.selectionBox.position.x = point.x;
                this.selectionBox.position.y = point.y;
                this.selectionBox.position.z = point.z;
                this.selectionBox.visible = true;
                this.unit.material.color.set("gray");
            }
        } else {
            this.selectionBox.visible = false;
            this.unit.material.color.set("gray");
        }
    }
}
