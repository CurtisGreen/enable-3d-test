import { Button } from "../ui/button.js";
import { updateResolution } from "../utilities.js";
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

export default class MainScene extends Scene3D {
    constructor() {
        super({ key: "MainScene" });
    }

    init(data) {
        if (data.length != undefined) {
            let [width, height] = data;
            this.width = width;
            this.height = height;
        }

        this.accessThirdDimension();

        this.placementBox = {};
        this.canJump = true;
        this.move = false;
        this.moveTop = 0;
        this.moveRight = 0;
        this.player = {};
        this.prevY = 0;
        this.prevInnerWidth = 0;
        this.prevInnerHeight = 0;
    }

    preload() {
        this.third.load.preload("floorTexture", "assets/img/phaser-logo.png");
        this.third.load.preload("orc", "assets/img/orc.glb");
    }

    async create() {
        // Get graphics settings
        updateResolution(this);

        // Create environment
        this.third.warpSpeed("light", "sky");

        // Load texture and add ground
        this.third.load.texture("floorTexture").then((texture) => {
            texture.wrapS = texture.wrapT = 1000; // RepeatWrapping
            texture.offset.set(0, 0);
            texture.repeat.set(2, 2);

            // Add ground
            this.ground = this.third.physics.add.box(
                {
                    x: 0,
                    y: -1.5,
                    z: 1,
                    width: 20,
                    depth: 20,
                    height: 1,
                    mass: 0,
                },
                {
                    phong: { map: texture, transparent: true },
                }
            );
        });

        // Box without physics
        this.third.add.box({ x: 1, y: 2 }, { lambert: { color: 0xeb4034 } });

        // Boxes with physics
        this.test = this.third.physics.add.box({ x: -1, y: 0.5 });
        let test2 = this.third.physics.add.box({ x: 3, y: 0.5 });
        let test3 = this.third.physics.add.box({ x: -2, y: 0.5 });

        // Show where you will add a box
        this.placementBox = this.third.add.box(
            { x: 1, y: 0, z: 1, width: 1, height: 0.1 },
            { lambert: { color: 0x0000ff } }
        );

        // Create box on click
        this.input.on("pointerdown", (pointer) => {
            this.third.physics.add.box(this.getGroundPointer());
        });

        // Controls
        this.keys = {
            a: this.input.keyboard.addKey("a"),
            w: this.input.keyboard.addKey("w"),
            d: this.input.keyboard.addKey("d"),
            s: this.input.keyboard.addKey("s"),
            space: this.input.keyboard.addKey(32),
            shift: this.input.keyboard.addKey("shift"),
        };

        if (isTouchDevice) {
            this.createMobileControls();
        }

        // Create player
        this.third.load.gltf("orc").then((player) => {
            const scene = player.scenes[0];

            this.player = new ExtendedObject3D();
            this.player.name = "player";
            this.player.add(scene);
            this.player.position.set(7, 1, 0);
            this.third.add.existing(this.player);

            this.third.physics.add.existing(this.player, {
                shape: "sphere",
                radius: 0.25,
                width: 0.5,
                offset: { y: -0.15 },
            });

            this.player.body.setFriction(0.8);
            this.player.body.setAngularFactor(0, 0, 0);
            this.player.body.setCcdMotionThreshold(1e-7);
            this.player.body.setCcdSweptSphereRadius(0.25);

            // Control player
            this.controls = new ThirdPersonControls(this.third.camera, this.player, {
                offset: new THREE.Vector3(0, 1, 0),
                targetRadius: 4, // Distance from character
                sensitivity: { x: 0.11, y: 0.11 },
            });
            this.controls.theta = 90;

            // Get mouse to control camera
            if (!isTouchDevice) {
                console.log(this.game.canvas);
                this.pointerLock = new PointerLock(this.game.canvas);
                let pointerDrag = new PointerDrag(this.game.canvas);

                pointerDrag.onMove((delta) => {
                    if (this.pointerLock.isLocked()) {
                        // Limit looking at sky
                        if (
                            this.controls.phi > -7 ||
                            (this.controls.phi <= -7 && delta.y > 0)
                        ) {
                            this.moveTop = -delta.y;
                        }

                        this.moveRight = delta.x;
                    }
                });
            }
        });

        this.events.on("shutdown", () => {
            this.pointerLock.exit();
        });

        // Directions
        let width = this.cameras.main.width;
        let text = "Move: WASD\n";
        text += "Rotate: Move mouse\n";
        text += "Place blocks: left click";
        this.directions = this.add.text(width / 2, 40, text);
        this.directions.setOrigin(0.5, 0);
    }

    getGroundPointer() {
        if (this.ground) {
            // Check line of sight to ground
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera({ x: 0, y: -0.05 }, this.third.camera); // Use position relative from center
            const intersection = raycaster.intersectObject(this.ground);

            if (intersection.length != 0) {
                let output = {
                    x: Math.round(intersection[0].point.x),
                    y: Math.round(intersection[0].point.y),
                    z: Math.round(intersection[0].point.z),
                };
                return output;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    // Mobile joystick controls
    createMobileControls() {
        const joystick = new JoyStick();
        const axis = joystick.add.axis({
            styles: { left: 35, bottom: 35, size: 100 },
        });
        axis.onMove((event) => {
            // Update camera
            const { top, right } = event;
            this.moveTop = top * 25;
            this.moveRight = right * 25;
        });

        // Jump button
        const buttonA = joystick.add.button({
            letter: "A",
            styles: { right: 35, bottom: 110, size: 80 },
        });
        buttonA.onClick(() => this.jump());

        // Move button
        const buttonB = joystick.add.button({
            letter: "B",
            styles: { right: 110, bottom: 35, size: 80 },
        });
        buttonB.onClick(() => (this.move = true));
        buttonB.onRelease(() => (this.move = false));
    }

    jump() {
        if (this.player && this.canJump) {
            this.player.body.applyForceY(6);
        }
    }

    updateMovement() {
        // Move player
        if (this.player && this.player.body) {
            // Update controls
            this.controls.update(this.moveRight, -this.moveTop);
            if (!isTouchDevice) this.moveRight = this.moveTop = 0;

            let turnSpeed = 0;
            if (isTouchDevice) {
                turnSpeed = 2;
            } else {
                turnSpeed = 4;
            }

            // Get camera direction
            const v3 = new THREE.Vector3();
            const rotation = this.third.camera.getWorldDirection(v3);
            const theta = Math.atan2(rotation.x, rotation.z);

            // Get player direction
            const playerRotation = this.player.getWorldDirection(v3);
            const playerTheta = Math.atan2(playerRotation.x, playerRotation.z);
            this.player.body.setAngularVelocityY(0);

            // Turn player
            const l = Math.abs(theta - playerTheta);
            let d = Math.PI / 24;
            if (l > d) {
                if (l > Math.PI - d) {
                    turnSpeed *= -1;
                }
                if (theta < playerTheta) {
                    turnSpeed *= -1;
                }

                this.player.body.setAngularVelocityY(turnSpeed);
            }

            // Move
            let moveSpeed = 4;
            let x = 0,
                y = this.player.body.velocity.y,
                z = 0,
                curAngle = 0,
                forwards = false,
                backwards = false;

            // Forward/backwards
            if (this.keys.w.isDown || this.move) {
                forwards = true;
                curAngle = theta;
            } else if (this.keys.s.isDown) {
                backwards = true;
                curAngle = theta + Math.PI;
            }

            // Left
            if (this.keys.a.isDown) {
                if (forwards) {
                    curAngle += Math.PI / 4;
                } else if (backwards) {
                    curAngle -= Math.PI / 4;
                } else {
                    curAngle = theta + Math.PI / 2;
                }
            }
            // Right
            else if (this.keys.d.isDown) {
                if (forwards) {
                    curAngle -= Math.PI / 4;
                } else if (backwards) {
                    curAngle += Math.PI / 4;
                } else {
                    curAngle = theta - Math.PI / 2;
                }
            }

            // Shift for sprint
            if (this.keys.shift.isDown) {
                moveSpeed *= 2;
            }

            // Set player velocity
            if (curAngle != 0) {
                x = Math.sin(curAngle) * moveSpeed;
                z = Math.cos(curAngle) * moveSpeed;
                this.player.body.setVelocity(x, y, z);
            } else {
                this.player.body.setVelocity(0, y, 0);
            }

            // Jump
            if (this.keys.space.isDown) {
                this.jump();
            }

            // Check jump conditions
            if (
                this.player.position.y <= this.prevY &&
                this.player.body.velocity.y > -0.1 &&
                this.player.body.velocity.y < 0.1
            ) {
                this.canJump = true;
            } else {
                this.canJump = false;
            }
            this.prevY = this.player.position.y;
        }
    }

    updatePlacementBox() {
        let point = this.getGroundPointer();
        if (point && this.placementBox.position != undefined) {
            this.placementBox.position.x = point.x;
            this.placementBox.position.y = point.y;
            this.placementBox.position.z = point.z;
            this.placementBox.visible = true;
        } else {
            this.placementBox.visible = false;
        }
    }

    update() {
        this.updateMovement();
        this.updatePlacementBox();

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

    pausePointerLock(isPaused) {
        if (this.pointerLock != undefined) {
            this.pointerLock._isRunning = !isPaused;
        }
    }
}
