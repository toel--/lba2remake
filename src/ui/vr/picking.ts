import * as THREE from 'three';
import { find } from 'lodash';

let pickingTarget = null;

export function getPickingTarget() {
    if (!pickingTarget) {
        const geom = new THREE.SphereGeometry(0.01, 6, 4);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.8
        });
        pickingTarget = new THREE.Mesh(geom, mat);
        pickingTarget.visible = false;
    }

    return pickingTarget;
}

const hovering = new Set();
const hitOnFrame = new Set();

export function handlePicking(objects, ctx) {
    hitOnFrame.clear();
    pickingTarget.visible = false;
    performRaycasting(objects, ctx, menuHandler);
    hovering.forEach((uuid) => {
        if (!hitOnFrame.has(uuid)) {
            hovering.delete(uuid);
            const object = find(objects, o => o.uuid === uuid);
            if (object && object.userData && object.userData.onLeave) {
                object.userData.onLeave();
            }
        }
    });
}

const raycaster = new THREE.Raycaster();
const direction = new THREE.Vector3();
const position = new THREE.Vector3();
const rotation = new THREE.Matrix4();
const offset = new THREE.Vector3();

export function performRaycasting(objects, ctx, handler) {
    const { game: { controlsState }} = ctx;
    direction.set(0, 0, -1);
    rotation.extractRotation(controlsState.vrPointerTransform);
    direction.applyMatrix4(rotation);
    offset.set(0, 0.02, 0);
    offset.applyMatrix4(rotation);
    position.setFromMatrixPosition(controlsState.vrPointerTransform);
    position.add(offset);
    raycaster.set(position, direction);
    const intersects = raycaster.intersectObjects(objects, false);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        hitOnFrame.add(intersect.object.uuid);
        handler(intersect, controlsState.vrTriggered, ctx);
    }
}

const invTransform = new THREE.Matrix4();

function menuHandler(intersect, triggered, ctx) {
    const object = intersect.object;
    pickingTarget.visible = true;
    pickingTarget.position.copy(intersect.point);
    if (ctx.scene) {
        invTransform.getInverse(ctx.scene.camera.controlNode.matrixWorld);
        pickingTarget.position.applyMatrix4(invTransform);
    }
    if (triggered) {
        if (object.userData && object.userData.callback) {
            object.userData.callback(ctx);
        }
    }
    if (!hovering.has(object.uuid)) {
        hovering.add(object.uuid);
        if (object.userData && object.userData.onEnter) {
            object.userData.onEnter();
        }
    }
}