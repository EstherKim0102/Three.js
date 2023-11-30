import * as THREE from 'three';

import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

import {
    PointerLockControls
} from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer, clock, controls;
const objects = [];
let loader, mixers, models;
let raycaster;
let clockModel;

// Array to store collidable objects in the scene
let collidableObjects = [];

// Controls setup
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Variables to manage clock model and its animations
let clockLoaded;
let clockAction;

init();
animate();

function init() {
    // Animation loop
    clock = new THREE.Clock();

		camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100 );
		camera.position.set( 0, 3, 9 );
		camera.lookAt(new THREE.Vector3(0,0,0));
	
    controls = new PointerLockControls(camera, document.body);
    
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', function () {

        controls.lock();

    });

    controls.addEventListener('lock', function () {

        instructions.style.display = 'none';
        blocker.style.display = 'none';

    });

    controls.addEventListener('unlock', function () {

        blocker.style.display = 'block';
        instructions.style.display = '';

    });

    
    scene = new THREE.Scene();
    scene.add(controls.getObject());
    scene.background = new THREE.Color( 0xe0e0e0 );
    scene.fog = new THREE.Fog( 0xe0e0e0, 10, 50);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(-3, 10, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 4;
    dirLight.shadow.camera.bottom = -4;
    dirLight.shadow.camera.left = -4;
    dirLight.shadow.camera.right = 4;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    scene.add(dirLight);
	
	const pointLight = new THREE.DirectionalLight(0xfff77);
	pointLight.position.set(-1, 3, 1);
	scene.add(pointLight);
	const pointLight2 = new THREE.DirectionalLight(0xf77fff);
	pointLight2.position.set(1, 3, -3);
	scene.add(pointLight2);

	
    const onKeyDown = function (event) {

        switch (event.code) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;

            case 'Space':
                if (canJump === true) velocity.y += 80;
                canJump = false;
                break;

        }

    };

    const onKeyUp = function (event) {

        switch (event.code) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;

        }

    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    raycaster = new THREE.Raycaster
//	(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
    raycaster.near = 0.1;
    raycaster.far = 10; // Only detect collisions within 10 units from the camera


    // ground
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshPhongMaterial({
        color: 0x000000,
        depthWrite: false
    }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // GLTF Loader
    loader = new GLTFLoader();
    mixers = []; // Array to hold AnimationMixers
	
	let clockModel = {
        path: 'Models/mushy.glb',
        position: new THREE.Vector3(0, 1, 0),
        rotation: new THREE.Euler(Math.PI, 0, 0),
        scale: new THREE.Vector3(2, 2, 2)
    }
	
	function loadModel(model) {
        // A Promise is used to handle asynchronous operations. It represents a value that may be available now, later, or never.
        return new Promise((resolve, reject) => {
            // Use the GLTFLoader to load a 3D model
            loader.load(model.path, (gltf) => {
                // Set the position, rotation, and scale of the loaded model to match the specified model
                gltf.scene.position.copy(model.position);
                gltf.scene.rotation.copy(model.rotation);
                gltf.scene.scale.copy(model.scale);

                // Add the model to the scene
                scene.add(gltf.scene);

                // Check if the model has animations
                if (gltf.animations.length) {
                    // Create an AnimationMixer to handle the model's animations
                    let mixer = new THREE.AnimationMixer(gltf.scene);
                    mixers.push(mixer); 
                    gltf.mixer = mixer;
                }

                // Add the model to the list of collidable objects for collision detection
                collidableObjects.push(gltf.scene);

                // Resolve the promise, indicating that the model has been loaded successfully
                resolve(gltf);
            }, undefined, (error) => {
                console.error('An error happened', error);
                reject(error); // Reject the promise if an error occurs during loading
            });
        });
    }

		
		
    models = [
        {
            path: 'Models/mushy.glb',
            position: new THREE.Vector3(-2, 2, 2),
            rotation: new THREE.Euler(Math.PI, 0, 0),
            scale: new THREE.Vector3(1, 1, 1)
        },
        {
            path: 'Models/passport!!.glb',
            position: new THREE.Vector3(4, 0, 0),
            rotation: new THREE.Euler(-20, 0, 0),
            scale: new THREE.Vector3(6, 6, 6)
        },
		{
            path: 'Models/luggage!!.glb',
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(1, 1, 1)
        }
    ];

    models.forEach((model) => {
        loader.load(model.path, (gltf) => {
            gltf.scene.position.copy(model.position); // Set model position
            gltf.scene.rotation.copy(model.rotation);
            gltf.scene.scale.copy(model.scale);
            scene.add(gltf.scene);


            // Set up animation
            if (gltf.animations.length) {
                const mixer = new THREE.AnimationMixer(gltf.scene);
                mixers.push(mixer);
                const action = mixer.clipAction(gltf.animations[0]); // Play the first animation
                action.play();
            }
        }, undefined, (error) => {
            console.error('An error happened', error);
        });
    });

	
    // Asynchronously load the clock model
    loadModel(clockModel).then(gltf => {
        // This code runs after the model has been successfully loaded
        console.log('Clock model loaded', gltf);
        clockLoaded = gltf; // Store the loaded model for later use
    }).catch(error => {
        // This code runs if there was an error loading the model
        console.error('Error loading clock model', error);
    });

	
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize);

}



function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}


function updateRaycaster() {
    // Set the raycaster to start at the camera position and cast in the direction the camera is facing
    raycaster.set(camera.position, camera.getWorldDirection(new THREE.Vector3()));
}


function checkCollision() {
    const intersects = raycaster.intersectObjects(collidableObjects, true);

    if (intersects.length === 0) {
        return; // No collision detected
    }

    console.log("Collision detected with: ", intersects.map(obj => obj.object.name));

    intersects.forEach(intersectedObject => {
        const name = intersectedObject.object.name;

        if (name.includes('clock') && clockLoaded) {
            if (!clockAction) {
                clockAction = clockLoaded.mixer.clipAction(clockLoaded.animations[1]);
            }
            if (!clockAction.isRunning()) {
                clockAction.play();
            }
        }
    });
}

function animate() {
    requestAnimationFrame(animate);

	
    // Update the raycaster for collision detection
    updateRaycaster();
    checkCollision();
	
    const delta = clock.getDelta();
    mixers.forEach((mixer) => mixer.update(delta));

    const time = performance.now();

    if (controls.isLocked === true) {

        raycaster.ray.origin.copy(controls.getObject().position);
        raycaster.ray.origin.y -= 10;

        const intersections = raycaster.intersectObjects(objects, false);

        const onObject = intersections.length > 0;

        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 5.0 * delta;
        velocity.z -= velocity.z * 5.0 * delta;

        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // this ensures consistent movements in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * 100.0 * delta;

        if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

        if (onObject === true) {

            velocity.y = Math.max(0, velocity.y);
            canJump = true;

        }

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        controls.getObject().position.y += (velocity.y * delta); // new behavior

        if (controls.getObject().position.y < 2) {

            velocity.y = 0;
            controls.getObject().position.y = 2;

            canJump = true;

        }

    }

    prevTime = time;

    renderer.render(scene, camera);
}