import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { KeyController } from './KeyController.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import * as dat from 'dat.gui';

// Renderer
const canvas = document.querySelector('#three-canvas');
const renderer = new THREE.WebGLRenderer({
	canvas,
	antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene
const scene = new THREE.Scene();

// progoressbar

var progress = document.createElement('div');
var progressBar = document.createElement('div');

progress.appendChild(progressBar);

document.body.appendChild(progress);

// loadingManager
const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = function ( item, loaded, total ) {
	progressBar.style.width = (loaded / total * 100) + '%';
}
loadingManager.onLoad = function () {
	// character.
	character.children[0].scale.set(4.5,4.5,4.5);
	character.children[0].position.y = 2.25;
	character.children[0].position.z = -70;
	scene.add(character.children[0]);
}


// texture
const textureLoader = new THREE.TextureLoader(loadingManager);
const floorTexture = textureLoader.load('/images/dirt.jpg');
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.x = 4;
floorTexture.repeat.y = 4;

// gltfLoader
let tree;
let character;
const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.load(
	'/models/cherry_blossoms.glb',
	glb => {
		tree = glb.scene;
		tree.traverse(o => {
			if (o.isMesh) {
				o.castShadow = true;
			}
		})
		// 나무 배치
		for (let i = -10; i < 10; i++) {
			let tmp = SkeletonUtils.clone(glb.scene);
			tmp.children[0].position.set(15, 1, i * -10);
			tmp.children[0].rotation.z = THREE.MathUtils.degToRad(Math.random() * 180);
			scene.add(tmp.children[0]);
		}
		for (let i = -10; i < 10; i++) {
			let tmp = SkeletonUtils.clone(glb.scene);
			tmp.children[0].position.set(-15, 1, i * -10);
			tmp.children[0].rotation.z = THREE.MathUtils.degToRad(Math.random() * 180);
			scene.add(tmp.children[0]);
		}
		
	}
);
gltfLoader.load(
	'/models/medieval_table.glb',
	glb => {
		const chair = glb.scene.children[0];
		glb.scene.traverse(o => {
			if (o.isMesh) o.castShadow = true;
		})
		chair.scale.set(0.5, 0.5, 0.5);
		chair.position.set(-10, 0, 0);
		chair.rotation.z += Math.PI / 2;
		scene.add(chair);
	}
);
gltfLoader.load(
	'/models/character.glb',
	glb => {
		character = glb.scene;
		glb.scene.traverse(o => {
			if (o.isMesh) o.castShadow = true;
		})
	}
)

// Camera
const camera = new THREE.PerspectiveCamera(
	35,
	window.innerWidth / window.innerHeight,
	1,
	1000
);
camera.position.y = 4;
camera.position.z = -83;
camera.lookAt(new THREE.Vector3(0,0,0));
scene.add(camera);
scene.background = new THREE.Color('#E2A6B4');
// scene.background = new THREE.Color('#ffeaea');

// Light
const ambientLight = new THREE.AmbientLight('white', 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight('white', 1);
directionalLight.position.x = -20;
directionalLight.position.z = -20;
directionalLight.position.y = 100;
directionalLight.shadow.mapSize.width = 512;
directionalLight.shadow.mapSize.height = 512;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 1000;
directionalLight.shadow.camera = new THREE.OrthographicCamera( -100, 100, 100, -100, 0.5, 1000 );
directionalLight.castShadow = true;
scene.add(directionalLight);

// Controls
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;

const controls = new PointerLockControls(camera, renderer.domElement);
controls.pointerSpeed = 0.5;
controls.domElement.addEventListener('click', () => {
	controls.lock();
})

// Player
const players = [];

// Mesh
const geometry = new THREE.BoxGeometry(200, 1, 200);
const material = new THREE.MeshStandardMaterial({
	map: floorTexture,
});
const mesh = new THREE.Mesh(geometry, material);
mesh.receiveShadow = true;
mesh.position.y = -0.5;
scene.add(mesh);

// 그리기
const clock = new THREE.Clock();

// 소켓
const socket = io();


// 키보드 컨트롤
const keyController = new KeyController();
function walk() {
    if (keyController.keys['KeyW']) {
        controls.moveForward(0.1);
    }
    if (keyController.keys['KeyS']) {
        controls.moveForward(-0.1);
    }
    if (keyController.keys['KeyA']) {
        controls.moveRight(-0.1);
    }
    if (keyController.keys['KeyD']) {
        controls.moveRight(0.1);
    }
}

function draw() {
	const delta = clock.getDelta();
	walk();
	// controls.update();
	renderer.render(scene, camera);
	renderer.setAnimationLoop(draw);
}

function setSize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.render(scene, camera);
}

// 이벤트
window.addEventListener('resize', setSize);

draw();
