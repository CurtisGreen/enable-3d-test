//import { Scene3D } from '../lib/enable3d/phaser-extension'
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

    init() {
        this.placementBox = {};
        this.accessThirdDimension();

        this.selected = null;
        //this.mousePosition = new THREE.Vector3();
        //this.blockOffset = new THREE.Vector3();
        this.prev == { x: 0, y: 0 };

        this.canJump = true;
        this.move = false;
        this.moveTop = 0;
        this.moveRight = 0;
    }

    create() {
        // adjust width and height
        this.third.renderer.setSize(2000, 1000);
        this.third.camera.aspect = 2000 / 1000;
        this.third.camera.updateProjectionMatrix();

        this.third.warpSpeed("-orbitControls");

        this.third.add.box({ x: 1, y: 2 });
        this.test = this.third.physics.add.box({ x: -1, y: 0.5 });
        let test2 = this.third.physics.add.box({ x: 3, y: 0.5 });
        let test3 = this.third.physics.add.box({ x: -2, y: 0.5 });

        // Show where you will add a box
        this.placementBox = this.third.add.box(
            { x: 1, y: 1, z: 1, width: 1, height: 0.1 },
            { lambert: { color: 0x0000ff } }
        );

        // Create box on click
        this.input.on("pointerdown", (pointer) => {
            // const v3 = new THREE.Vector3();
            // const rotation = this.third.camera.getWorldDirection(v3);
            // this.third.physics.add.box(this.orc.position);

            this.third.physics.add.box(this.getGroundPointer());
        });

        // Load Orc
        this.third.load.gltf("assets/img/orc.glb").then((object) => {
            const scene = object.scenes[0];

            this.orc = new ExtendedObject3D();
            this.orc.name = "orc";
            this.orc.add(scene);
            this.orc.position.set(7, 1, 0);
            this.third.add.existing(this.orc);

            this.orc.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = child.receiveShadow = true;
                    child.material.metalness = 0;
                    child.material.roughness = 1;
                }
            });

            this.third.physics.add.existing(this.orc, {
                shape: "sphere",
                radius: 0.25,
                width: 0.5,
                offset: { y: -0.15 },
            });
            this.orc.body.setFriction(0.8);
            this.orc.body.setAngularFactor(0, 0, 0);
            this.orc.body.setCcdMotionThreshold(1e-7);
            this.orc.body.setCcdSweptSphereRadius(0.25);

            // Control orc
            this.controls = new ThirdPersonControls(this.third.camera, this.orc, {
                offset: new THREE.Vector3(0, 1, 0),
                targetRadius: 4, // Distance from character
                sensitivity: { x: 0.11, y: 0.11 },
            });

            // Initial view angle
            this.controls.theta = 90;

            // Add pointer lock and drag
            if (!isTouchDevice) {
                let pointerLock = new PointerLock(this.game.canvas);
                let pointerDrag = new PointerDrag(this.game.canvas);

                pointerDrag.onMove((delta) => {
                    if (pointerLock.isLocked()) {
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

        //test2.body.setCollisionFlags(0)

        //this.third.haveSomeFun()

        this.third.load.texture("assets/img/phaser-logo.png").then((grass) => {
            grass.wrapS = grass.wrapT = 1000; // RepeatWrapping
            grass.offset.set(0, 0);
            grass.repeat.set(2, 2);

            // BUG: To add shadows to your ground, set transparent = true
            this.ground = this.third.physics.add.ground(
                { width: 20, height: 20, y: -1 },
                { phong: { map: grass, transparent: true } }
            );
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

        // Mobile joystick controls
        if (isTouchDevice) {
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
    }

    getGroundPointer() {
        if (this.ground) {
            // Check line of sight to ground
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera({ x: 0.1, y: 0.1 }, this.third.camera);
            const intersection = raycaster.intersectObject(this.ground);

            if (intersection.length != 0) {
                let output = {
                    x: Math.ceil(intersection[0].point.x),
                    y: Math.ceil(intersection[0].point.y),
                    z: Math.ceil(intersection[0].point.z),
                };
                return output;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    getMouseoverObjects() {
        // Check line of sight to obj
        const { x, y } = this.getPointer();
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera({ x, y }, this.third.camera);
        const intersection = raycaster.intersectObjects([this.test, this.ground]);

        if (intersection.length != 0) {
            console.log(intersection[0].point);
            this.third.physics.add.box(intersection[0].point);
        }

        // Clicked obj
        if (intersection.length > 0) {
            const obj = intersection[0].object;

            if (obj != undefined) {
                this.selected = obj;
                this.selected.body.setCollisionFlags(2);

                if (this.curSelection != undefined) {
                    // this.third.destroy(this.curSelection);
                    this.curSelection.visible = false;
                }

                this.curSelection = this.third.add.box({
                    x: Math.floor(x - 1),
                    y: Math.ceil(y),
                });
                console.log(x, y);
            }
        }
    }

    jump() {
        if (!this.orc || !this.canJump) return;

        this.canJump = false;
        this.time.addEvent({
            delay: 1500,
            callback: () => {
                this.canJump = true;
            },
        });
        this.orc.body.applyForceY(6);
    }

    updateMovement() {
        // Move orc
        if (this.orc && this.orc.body) {
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

            // Get orc direction
            const orcRotation = this.orc.getWorldDirection(v3);
            const orcTheta = Math.atan2(orcRotation.x, orcRotation.z);
            this.orc.body.setAngularVelocityY(0);

            // Turn orc
            const l = Math.abs(theta - orcTheta);
            let d = Math.PI / 24;
            if (l > d) {
                if (l > Math.PI - d) {
                    turnSpeed *= -1;
                }
                if (theta < orcTheta) {
                    turnSpeed *= -1;
                }

                this.orc.body.setAngularVelocityY(turnSpeed);
            }

            // Move
            let moveSpeed = 4;
            let x = 0,
                y = this.orc.body.velocity.y,
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
                this.orc.body.setVelocity(x, y, z);
            } else {
                this.orc.body.setVelocity(0, y, 0);
            }

            // Jump
            if (this.keys.space.isDown && this.canJump) {
                this.jump();
            }
        }
    }

    updatePlacementBox() {
        let point = this.getGroundPointer();
        if (point) {
            this.placementBox.position.x = point.x;
            this.placementBox.position.y = point.y;
            this.placementBox.position.z = point.z;
            this.placementBox.visible = true;
        } else {
            this.placementBox.visible = false;
        }
        //this.placementBox.body.needUpdate = true;
    }

    update() {
        //this.test.body.setCollisionFlags(2); // kinematic
        //this.test.position.x += .05;
        //this.test.body.needUpdate = true;

        this.updateMovement();
        this.updatePlacementBox();
    }

    getPointer() {
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        const pointer = this.input.activePointer;
        const x = (pointer.x / this.cameras.main.width) * 2 - 1;
        const y = -(pointer.y / this.cameras.main.height) * 2 + 1;
        return { x, y };
    }
}
