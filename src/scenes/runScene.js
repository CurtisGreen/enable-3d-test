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

export default class RunScene extends Scene3D {
    constructor() {
        super({ key: "RunScene" });
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

    preload() {}

    async create() {
        // Get graphics settings
        updateResolution(this);

        // Create environment
        this.third.warpSpeed("light", "sky");

        // Add ground
        let length = 200;
        this.ground = this.third.physics.add.box(
            {
                x: 0,
                y: -1,
                z: 1,
                width: 6,
                depth: 40,
                height: 1,
                mass: 0,
            },
            { lambert: { color: "grey" } }
        );

        // Platforms
        let numSegments = 8;
        let segmentLength = length / numSegments;
        for (let i = 0; i < length; i++) {
            if (i % segmentLength == 0) {
                this.third.physics.add.box({
                    x: 0,
                    y: 0,
                    z: -1 * i,
                    width: 2,
                    height: 0.1,
                    depth: numSegments * 2,
                    mass: 0,
                });

                this.third.physics.add.box({
                    x: -4,
                    y: 0,
                    z: -1 * i + 4,
                    width: 2,
                    height: 0.1,
                    depth: numSegments * 2,
                    mass: 0,
                });

                // this.third.physics.add.box({
                //     x: 4,
                //     y: 0,
                //     z: -1 * i - 4,
                //     width: 2,
                //     height: 0.1,
                //     depth: numSegments * 2,
                //     mass: 0,
                // });
            }
        }

        // Walls
        // this.third.physics.add.box({
        //     x: -3,
        //     y: 0,
        //     z: 1,
        //     width: 1,
        //     depth: 40,
        //     height: 5,
        //     mass: 0,
        // });
        // this.third.physics.add.box({
        //     x: 3,
        //     y: 0,
        //     z: 1,
        //     width: 1,
        //     depth: 40,
        //     height: 5,
        //     mass: 0,
        // });

        // Make the player box
        this.player = this.third.physics.add.sphere({
            x: 0,
            y: 1,
            z: 0,
            radius: 1,
        });
        this.player.body.setFriction(0.8);
        this.player.body.setAngularFactor(0, 0, 0);
        this.player.body.setCcdMotionThreshold(1e-7);
        this.player.body.setCcdSweptSphereRadius(0.25);

        // Add collider to player
        this.player.body.on.collision((object, event) => {
            this.isTouching = true;
            this.isJumping = false;
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

        // Directions
        let width = this.cameras.main.width;
        let text = "Move: A, D, and space";
        this.directions = this.add.text(width / 2, 40, text);
        this.directions.setOrigin(0.5, 0);
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
        if (this.player && !this.isJumping && this.isTouching && !this.isFalling) {
            console.log("jump");
            this.player.body.applyForceY(6);
            this.isJumping = true;
            this.isTouching = false;
            this.canJump = false;

            // Lockout jump for half second
            let _this = this;
            setTimeout(function () {
                _this.canJump = true;
            }, 1000);
        }
    }

    updateMovement() {
        // Move player
        if (this.player && this.player.body) {
            let xVel = 0;
            // Left
            if (this.keys.a.isDown) {
                xVel = -4;
            }
            // Right
            else if (this.keys.d.isDown) {
                xVel = 4;
            }

            // Check jump conditions
            if (this.player.body.velocity.y < -0.1) {
                this.isFalling = true;
            } else {
                this.isFalling = false;
            }
            this.prevY = this.player.position.y;

            // Jump
            if (this.keys.space.isDown && this.canJump) {
                this.jump();
            }
            this.prevSpacePress = this.keys.space.isDown;

            // Player always moves forward
            let yVel = this.player.body.velocity.y; // Maintain jump
            this.player.body.setVelocity(xVel, yVel, -5);
            this.player.body.needUpdate = true;

            // Camera follows
            // let cameraX = this.player.position.x;
            // let cameraY = this.player.position.y;
            // let cameraZ = this.player.position.z + 0.1;
            // this.third.camera.position.set(cameraX, cameraY, cameraZ);
            this.third.camera.position.copy(this.player.position);
        }
    }

    update() {
        this.updateMovement();

        // Restart if player has fallen
        if (this.player.position.y < -10) {
            this.scene.restart();
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
}
