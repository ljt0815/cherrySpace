import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { KeyController } from './KeyController.js';

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
	document.querySelector("#three-canvas").style.display = 'block';
	const socket = io();

	const playerMap = {};
	socket.on('join_user', function(data) {
		let player = SkeletonUtils.clone(character);
		playerMap[data.id] = player.children[0];
		player.children[0].scale.set(data.scale, data.scale, data.scale);
		player.children[0].position.x = data.x;
		player.children[0].position.y = data.y;
		player.children[0].position.z = data.z;
		player.children[0].name = data.id; 
		scene.add(player.children[0]);
	})
	// Camera
	const camera = new THREE.PerspectiveCamera(
		50,
		window.innerWidth / window.innerHeight,
		1,
		1000
	);
	socket.on('init', function(data) {
		camera.position.x = data.x;
		camera.position.z = data.z;
	})
	camera.position.y = 4;
	camera.lookAt(new THREE.Vector3(0,4,1));
	scene.add(camera);
	scene.background = new THREE.Color('#E2A6B4');

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
	const controls = new PointerLockControls(camera, renderer.domElement);
	controls.pointerSpeed = 0.5;
	controls.domElement.addEventListener('click', () => {
		controls.lock();
	})

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

	// 키보드 컨트롤
	const keyController = new KeyController();
	function send_location() {
		let data = {};
		data['id'] = socket.id;
		data['x'] = camera.position.x;
		data['z'] = camera.position.z;
		data['rotateZ'] = camera.rotation.z;
		socket.emit('send_location', data);
	}
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

	// const update_buffer = [];
	socket.on('update_state', function(data) {
		if (playerMap[data.id] != undefined)
		{
			playerMap[data.id].position.x = data.x;
			playerMap[data.id].position.z = data.z;
			playerMap[data.id].rotation.y = data.rotateZ;
		}
	})

	socket.on('leave_user', function(data) {
		scene.remove(playerMap[data]);
		delete playerMap[data];
	})
	
	function draw() {
		const delta = clock.getDelta();
		send_location();
		walk();
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
		chair.scale.set(0.7, 0.7, 0.7);
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
