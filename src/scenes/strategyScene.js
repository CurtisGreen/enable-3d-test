import { Button } from "../ui/button.js";
import {
    getPointer,
    updateResolution,
    setResolution,
    cameraDebug,
} from "../utilities.js";
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
        updateResolution(this);

        // Create environment
        this.third.warpSpeed("light", "sky");

        // Add ground
        this.ground = this.third.physics.add.box({
            x: 11.5,
            y: -0.5,
            z: 11.5,
            width: 20,
            depth: 20,
            height: 1,
            mass: 0,
        });

        // Adjust the camera
        this.angleDiff = 10;
        this.maxCameraY = 15;
        this.minCameraY = 5;
        let startX = -5;
        this.third.camera.position.set(startX, this.maxCameraY, 0);
        this.third.camera.lookAt(startX + this.angleDiff, 0, 0);

        // Controls
        this.keys = this.input.keyboard.addKeys({
            w: "w",
            a: "a",
            s: "s",
            d: "d",
            left: "left",
            right: "right",
            up: "up",
            down: "down",
        });

        this.keys.left.on("up", () => {
            this.rotateCamera("left");
        });
        this.keys.right.on("up", () => {
            this.rotateCamera("right");
        });
        this.keys.up.on("up", () => {
            this.rotateCamera("up");
        });
        this.keys.down.on("up", () => {
            this.rotateCamera("down");
        });

        // Check mouse scroll
        this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (deltaY > 0) {
                this.rotateCamera("up");
            } else {
                this.rotateCamera("down");
            }
        });

        // Box without physics
        this.third.add.box({ x: 0, y: 0, z: 0 }, { lambert: { color: "red" } }); // Origin
        this.third.add.box({ x: 2, y: 0, z: 0 }, { lambert: { color: "blue" } }); // X
        this.third.add.box({ x: 0, y: 0, z: 2 }, { lambert: { color: "green" } }); // Z
        this.third.add.box({ x: 0, y: 2, z: 0 }, { lambert: { color: "yellow" } }); // Y

        // Add selectable unit
        this.unit = this.third.add.box(
            { x: 10, y: 0.5, z: 10 },
            { lambert: { color: "gray" } }
        );

        // Show where your cursor is
        this.selectionBox = this.third.add.box(
            { x: 1, y: 0, z: 1, width: 1, height: 0.1 },
            { lambert: { color: 0x0000ff } }
        );

        // Select or move units on mouse down
        this.input.on("pointerdown", (pointer) => {
            const [point, object] = this.getIntersection([this.unit, this.ground]);
            // Clicked on unit
            if (point && object.id == this.unit.id) {
                this.unit.material.color.set("red");
                this.unitSelected = true;
            }
            // Clicked on ground
            else if (this.unitSelected) {
                this.unit.material.color.set("gray");
                this.unitSelected = false;

                let endX = point.x;
                let endZ = point.z;
                let temp = this.unit.position.clone();
                this.tweens.add({
                    targets: temp,
                    x: endX,
                    z: endZ,
                    duration: 1000,
                    ease: (t) => {
                        return t;
                    },
                    onComplete: () => {},
                    onUpdate: () => {
                        this.unit.position.set(temp.x, temp.y, temp.z);
                    },
                    delay: 50,
                });
            }
        });

        // Directions
        let width = this.cameras.main.width;
        let text = "Move: WASD or hover mouse toward screen edge\n";
        text += "Rotate: left/right arrow keys\n";
        text += "Zoom: mouse wheel or up/down arrow keys\n";
        text += "Move block: click block then click another location";
        this.directions = this.add.text(width / 2, 40, text, { color: "black" });
        this.directions.setOrigin(0.5, 0);
    }

    update() {
        this.keyboardMove();
        this.mouseMove();
        this.updateSelectionBox();

        cameraDebug(this);

        // Lerp camera to destination
        if (this.lerping) {
            let curPos = this.third.camera.position.lerp(this.lerpDest, 0.2);
            const { x, y, z } = this.lerpCenter;

            if (
                curPos.x >= this.lerpDest.x - 0.1 &&
                curPos.x <= this.lerpDest.x + 0.1 &&
                curPos.z >= this.lerpDest.z - 0.1 &&
                curPos.z <= this.lerpDest.z + 0.1 &&
                curPos.y <= this.lerpDest.y + 0.1 &&
                curPos.y >= this.lerpDest.y - 0.1
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
            updateResolution(this);
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

        switch (dir) {
            case "right":
                this.currentDirection += 1;
                if (this.currentDirection > 3) {
                    this.currentDirection = 0;
                }

                this.lerpDest = { x: rightX, y: rightY, z: rightZ };
                this.lerping = true;
                break;
            case "left":
                this.currentDirection -= 1;
                if (this.currentDirection < 0) {
                    this.currentDirection = 3;
                }

                this.lerpDest = { x: leftX, y: leftY, z: leftZ };
                this.lerping = true;
                break;
            case "up":
                if (this.third.camera.position.y < this.maxCameraY) {
                    this.lerpDest = { x: x, y: y + 2, z: z };
                    this.lerping = true;
                }
                break;
            case "down":
                if (this.third.camera.position.y > this.minCameraY) {
                    this.lerpDest = { x: x, y: y - 2, z: z };
                    this.lerping = true;
                }
                break;
        }

        this.lerpCenter = { x: lookX, y: lookY, z: lookZ };
    }

    mouseMove() {
        if (this.lerping) {
            return;
        }

        const { x, y } = getPointer(this);
        if (x <= -0.9) {
            this.moveDirection("left");
        } else if (x >= 0.9) {
            this.moveDirection("right");
        }

        if (y <= -0.9) {
            this.moveDirection("backward");
        } else if (y >= 0.9) {
            this.moveDirection("forward");
        }
    }

    getIntersection(objects, source = getPointer(this)) {
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
}
