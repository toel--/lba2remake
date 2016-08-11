import THREE from 'three';
import OrbitControls from './controls/OrbitControls';
import {loadIsland} from './island';
import model from './model';
import {updateModel} from './model';

const islands = [
    {name: 'CITADEL', skyColor: [0.0, 0.0, 0.0], skyIndex: 11, fogDensity: 0.3},
    {name: 'CITABAU', skyColor: [0.51, 0.71, 0.84], skyIndex: 13, fogDensity: 0.2},
    {name: 'DESERT', skyColor: [0.51, 0.71, 0.84], skyIndex: 13, fogDensity: 0.2},
    {name: 'EMERAUDE', skyColor: [0.0, 0.07, 0.10], skyIndex: 14, fogDensity: 0.4},
    {name: 'OTRINGAL', skyColor: [0.45, 0.41, 0.48], skyIndex: 16, fogDensity: 0.4},
    {name: 'KNARTAS', skyColor: [0.45, 0.41, 0.48], skyIndex: 16, fogDensity: 0.4},
    {name: 'ILOTCX', skyColor: [0.45, 0.41, 0.48], skyIndex: 16, fogDensity: 0.4},
    {name: 'CELEBRAT', skyColor: [0.45, 0.41, 0.48], skyIndex: 16, fogDensity: 0.4},
    {name: 'ASCENCE', skyColor: [0.45, 0.41, 0.48], skyIndex: 16, fogDensity: 0.4},
    {name: 'MOSQUIBE', skyColor: [0.44, 0.0, 0.0], skyIndex: 17, fogDensity: 0.4},
    {name: 'PLATFORM', skyColor: [0.44, 0.0, 0.0], skyIndex: 17, fogDensity: 0.4},
    {name: 'SOUSCELB', skyColor: [0.44, 0.0, 0.0], skyIndex: 17, fogDensity: 0.4}
];

let index = 0;
let entityIdx = 0;
let bodyIdx = 0; // 92-Baldino
let animIdx = 0; // running

let current;
let models;
let modelMesh;
let isLoaded = false;
let clock = new THREE.Clock();

export default class Renderer {
    constructor(width, height) {
        this.clock = new THREE.Clock();

        // Camera init
        this.camera = new THREE.PerspectiveCamera(90, width / height, 0.001, 100);
        this.camera.position.x = 0;
        this.camera.position.y = 2;
        this.camera.position.z = 8;
        this.camera.lookAt(new THREE.Vector3());
        this.camera.zoom = 70; //TODO remove this piece when merged into master branch

        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0xefd1b5, 0.0025);

        // Renderer init
        this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
        this.renderer.setClearColor(0x000000, 1);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        this.renderer.autoClear = true;

        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.left = 0;
        this.renderer.domElement.style.top = 0;
        this.renderer.domElement.style.opacity = 1.0;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.zoomSpeed = 2.0;

        // Render loop
        this.animate();

        model(models, index, entityIdx, bodyIdx, animIdx, (object) => {
            models = object;
            current = object.meshes[index];
            this.scene.add(current);
            isLoaded = true;
        });
        //this.islandGroup = new THREE.Object3D();
        //this.islandGroup.add(new THREE.Object3D);
        //this.scene.add(this.islandGroup);

        window.addEventListener('keydown', this.onKeyDown.bind(this), false);
        //this.refreshIsland();
    }

    onResize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    onKeyDown(event) {
        if (event.keyCode == 78 || event.keyCode == 77) { //N
            isLoaded = false;

            if (event.keyCode == 78) {
                bodyIdx = (bodyIdx + 1)
                if (bodyIdx > models.bodies.length)
                    bodyIdx = 0;
                index = bodyIdx; // FIX ME for now will be the same
            }
            if (event.keyCode == 77) { //M
                animIdx = (animIdx + 1)
                if (animIdx > models.anims.length)
                    animIdx = 0;
            }
            model(models, index, entityIdx, bodyIdx, animIdx, (object) => {
                models = object;
                this.scene.remove(current);
                current = object.meshes[index];
                this.scene.add(current);
                isLoaded = true;
            });
            //this.refreshIsland();
        }
    }

    refreshIsland() {
        loadIsland(islands[index], object => {
            console.log('Loaded: ', islands[index].name);
            this.islandGroup.children[0] = object;
            this.sea = object.getObjectByName('sea');
            const sc = islands[index].skyColor;
            const color = new THREE.Color(sc[0], sc[1], sc[2]);
            this.renderer.setClearColor(color.getHex(), 1);
        });
    }

    animate() {
        if (this.sea) {
            this.sea.material.uniforms.time.value = this.clock.getElapsedTime();
        }
        this.render();
        if (isLoaded) {
            const time = {
                delta: clock.getDelta(),
                elapsed: clock.getElapsedTime()
            }

            updateModel(models, index, animIdx, time);
        }
        requestAnimationFrame(this.animate.bind(this));
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
