export function getPointer(scene) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    const pointer = scene.input.activePointer;
    const x = (pointer.x / scene.cameras.main.width) * 2 - 1;
    const y = -(pointer.y / scene.cameras.main.height) * 2 + 1;
    return { x, y };
}

export function updateResolution(scene) {
    let width, height;
    if (window.innerWidth - 10 < scene.width) {
        width = window.innerWidth - 10;
    } else {
        width = scene.width;
    }

    if (window.innerHeight - 10 < scene.height) {
        height = window.innerHeight - 10;
    } else {
        height = scene.height;
    }

    setResolution(width, height, scene);
}

export function setResolution(width, height, scene) {
    scene.scale.resize(width, height);
    scene.third.renderer.setSize(width, height);
    scene.third.camera.aspect = width / height;
    scene.third.camera.updateProjectionMatrix();
}

export function cameraDebug(scene) {
    let width = scene.cameras.main.width;
    let x = Math.round(scene.third.camera.position.x);
    let y = Math.round(scene.third.camera.position.y);
    let z = Math.round(scene.third.camera.position.z);

    if (scene.debug == undefined) {
        scene.debug = {};
        scene.debug.x = scene.add.text(width - 40, 0, x, { color: "blue" });
        scene.debug.y = scene.add.text(width - 40, 14, y, { color: "yellow" });
        scene.debug.z = scene.add.text(width - 40, 28, z, { color: "green" });
    } else {
        scene.debug.x.text = x;
        scene.debug.y.text = y;
        scene.debug.z.text = z;
    }
}
