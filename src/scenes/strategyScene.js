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
        }

        this.accessThirdDimension();

        this.selectionBox = {};
        this.currentDirection = 0; // Forward, left, down, right
        this.prevInnerWidth = 0;
        this.prevInnerHeight = 0;
    }

    create() {
        // Get graphics settings
        this.updateResolution();

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
        this.angleDiff = 10;
        let startX = -5;
        this.third.camera.position.set(startX, 15, 0);
        this.third.camera.lookAt(startX + this.angleDiff, 0, 0);

        // Controls
        this.keys = this.input.keyboard.addKeys({
            w: "w",
            a: "a",
            s: "s",
            d: "d",
            left: "left",
            right: "right",
            down: "down",
        });

        this.keys.left.on("up", () => {
            this.rotateCamera("left");
        });
        this.keys.right.on("up", () => {
            this.rotateCamera("right");
        });

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
            const [point, object] = this.getIntersection([this.unit, this.ground]);
            if (point && object.id == this.unit.id) {
                this.unit.material.color.set("red");
                this.unitSelected = true;
            } else if (this.unitSelected) {
                this.unit.material.color.set("gray");
                this.unitSelected = false;
            }
        });
    }

    update() {
        this.keyboardMove();
        this.mouseMove();

        this.updateSelectionBox();

        // Lerp camera to destination
        if (this.lerping) {
            let curPos = this.third.camera.position.lerp(this.lerpDest, 0.2);
            const { x, y, z } = this.lerpCenter;

            if (
                curPos.x >= this.lerpDest.x - 0.1 &&
                curPos.x <= this.lerpDest.x + 0.1 &&
                curPos.z >= this.lerpDest.z - 0.1 &&
                curPos.y <= this.lerpDest.y + 0.1
            ) {
                this.lerping = false;
                this.third.camera.position.set(
                    this.lerpDest.x,
                    this.lerpDest.y,
                    this.lerpDest.z
                );
            }

            // Keep center constant
            this.third.camera.lookAt(x, y, z);
        }

        // Check resolution change
        if (
            window.innerHeight != this.prevInnerHeight ||
            window.innerWidth != this.prevInnerWidth
        ) {
            this.updateResolution();
            this.prevInnerWidth = window.innerWidth;
            this.prevInnerHeight = window.innerHeight;
        }
    }

    moveDirection(dir) {
        if (this.lerping) {
            return;
        }

        // Get cardinal direction based on camera rotation
        let forward, right, forwardVal, rightVal;
        switch (this.currentDirection) {
            case 0: // Forwards
                forward = "x";
                right = "z";
                forwardVal = 0.1;
                rightVal = 0.1;
                break;
            case 1: // Left
                forward = "z";
                right = "x";
                forwardVal = -0.1;
                rightVal = 0.1;
                break;
            case 2: // Down
                forward = "x";
                right = "z";
                forwardVal = -0.1;
                rightVal = -0.1;
                break;
            case 3: // Right
                forward = "z";
                right = "x";
                forwardVal = 0.1;
                rightVal = -0.1;
                break;
        }

        switch (dir) {
            case "forward":
                this.third.camera.position[forward] += forwardVal;
                break;
            case "backward":
                this.third.camera.position[forward] -= forwardVal;
                break;
            case "right":
                this.third.camera.position[right] += rightVal;
                break;
            case "left":
                this.third.camera.position[right] -= rightVal;
                break;
        }
    }

    keyboardMove() {
        // Move map with wasd
        if (this.keys.w.isDown) {
            this.moveDirection("forward");
        } else if (this.keys.s.isDown) {
            this.moveDirection("backward");
        }

        if (this.keys.d.isDown) {
            this.moveDirection("right");
        } else if (this.keys.a.isDown) {
            this.moveDirection("left");
        }
    }

    rotateCamera(dir) {
        let { x, y, z } = this.third.camera.position;
        x = Math.round(x);
        y = Math.round(y);
        z = Math.round(z);
        let [rightX, rightY, rightZ] = [x, y, z];
        let [leftX, leftY, leftZ] = [x, y, z];
        let [lookX, lookY, lookZ] = [x, 0, z];

        // Find point currentrightY looking at and left/right changes
        switch (this.currentDirection) {
            case 0: // Forwards
                lookX += this.angleDiff;

                rightZ += this.angleDiff;
                rightX += this.angleDiff;

                leftZ -= this.angleDiff;
                leftX += this.angleDiff;
                break;
            case 1: // Left
                lookZ -= this.angleDiff;

                rightZ -= this.angleDiff;
                rightX += this.angleDiff;

                leftZ -= this.angleDiff;
                leftX -= this.angleDiff;
                break;
            case 2: // Down
                lookX -= this.angleDiff;

                rightZ -= this.angleDiff;
                rightX -= this.angleDiff;

                leftZ += this.angleDiff;
                leftX -= this.angleDiff;
                break;
            case 3: // Right
                lookZ += this.angleDiff;

                rightZ += this.angleDiff;
                rightX -= this.angleDiff;

                leftZ += this.angleDiff;
                leftX += this.angleDiff;
                break;
        }

        if (dir == "right") {
            this.currentDirection += 1;
            if (this.currentDirection > 3) {
                this.currentDirection = 0;
            }

            this.lerping = true;
            this.lerpDest = { x: rightX, y: rightY, z: rightZ };
            this.lerpCenter = { x: lookX, y: lookY, z: lookZ };
        } else if (dir == "left") {
            this.currentDirection -= 1;
            if (this.currentDirection < 0) {
                this.currentDirection = 3;
            }

            this.lerping = true;
            this.lerpDest = { x: leftX, y: leftY, z: leftZ };
            this.lerpCenter = { x: lookX, y: lookY, z: lookZ };
        }
    }

    mouseMove() {
        if (this.lerping) {
            return;
        }

        const { x, y } = this.getPointer2d();
        if (x <= -0.9) {
            //console.log("move left", x);
            this.moveDirection("left");
        } else if (x >= 0.9) {
            //console.log("move right", x);
            this.moveDirection("right");
        }

        if (y <= -0.9) {
            //console.log("move down", y);
            this.moveDirection("backward");
        } else if (y >= 0.9) {
            //console.log("move up", y);
            this.moveDirection("forward");
        }
    }

    getIntersection(objects, source = this.getPointer2d()) {
        if (objects.length != 0) {
            // Check line of sight to object
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(source, this.third.camera);
            const intersection = raycaster.intersectObjects(objects);

            if (intersection.length != 0) {
                let output = {
                    x: Math.round(intersection[0].point.x),
                    y: Math.round(intersection[0].point.y),
                    z: Math.round(intersection[0].point.z),
                };
                return [output, intersection[0].object];
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
        //console.log(pointer.x, pointer.y);
        return { x, y };
    }

    updateSelectionBox() {
        const [point, object] = this.getIntersection([this.unit, this.ground]);
        if (point && this.selectionBox.position != undefined) {
            // Selected unit
            if (object.id == this.unit.id) {
                this.selectionBox.visible = false;
                if (!this.unitSelected) {
                    this.unit.material.color.set(0x0000ff);
                }
            }
            // Selected ground
            else {
                this.selectionBox.position.x = point.x;
                this.selectionBox.position.y = point.y;
                this.selectionBox.position.z = point.z;
                this.selectionBox.visible = true;

                if (!this.unitSelected) {
                    this.unit.material.color.set("gray");
                }
            }
        } else {
            this.selectionBox.visible = false;
            if (!this.unitSelected) {
                this.unit.material.color.set("gray");
            }
        }
    }

    updateResolution() {
        let width, height;
        if (window.innerWidth - 10 < this.width) {
            width = window.innerWidth - 10;
        } else {
            width = this.width;
        }

        if (window.innerHeight - 10 < this.height) {
            height = window.innerHeight - 10;
        } else {
            height = this.height;
        }

        this.setResolution(width, height);
    }

    setResolution(width, height) {
        this.scale.resize(width, height);
        this.third.renderer.setSize(width, height);
        this.third.camera.aspect = width / height;
        this.third.camera.updateProjectionMatrix();

        console.log(width, height);
    }
}
