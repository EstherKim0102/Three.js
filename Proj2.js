import * as THREE from 'three';

import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
let loader, mixers = [];
let raycaster, mouse;
let clock = new THREE.Clock();
let loadedModels = [];

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let arrowHelper;


init();
animate();

function init() {
    //camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 100);
    camera.position.set(0, 3, 9);

    //scene
    scene = new THREE.Scene();

    //renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    //point lock
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

    scene.add(controls.getObject());


    //background, fog, light
    scene.background = new THREE.Color(0xe0e0e0);
    scene.fog = new THREE.Fog(0xe0e0e0, 10, 50);

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

    //event listeners for movement
    const onKeyDown = function (event) {

        switch (event.code) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveRight = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveLeft = true;
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
                moveRight = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveLeft = false;
                break;

        }

    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Raycaster and mouse setup for model interaction
    raycaster = new THREE.Raycaster();
    raycaster.near = 0.1;
    raycaster.far = 100; // Only detect collisions within 10 units from the camera
    mouse = new THREE.Vector2();


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
    const models = [
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
    models.forEach(model => loadModel(model));

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);


    // Initialize ArrowHelper for visualizing the ray
    const arrowDirection = new THREE.Vector3(0, 0, -1); // Default direction
    const arrowColor = 0x00ff00; // Green color
    const arrowLength = 10;
    arrowHelper = new THREE.ArrowHelper(arrowDirection, camera.position, arrowLength, arrowColor);
    scene.add(arrowHelper);

}
//end of init


function loadModel(modelData) {
    loader.load(modelData.path, (gltf) => {
        const model = gltf.scene;
        model.position.copy(modelData.position);
        model.rotation.copy(modelData.rotation);
        model.scale.copy(modelData.scale);

        // Extracting the file name from the path and assigning it as the model's name
        const fileName = modelData.path.split('/').pop().split('.')[0];
        model.name = fileName;

        scene.add(model);

        loadedModels.push(model);

        // Add a bounding box. 
        // comment out for production version
        const bbox = new THREE.Box3().setFromObject(model);
        const bboxHelper = new THREE.BoxHelper(model, 0xff0000); // Red color for the bounding box
        scene.add(bboxHelper);

        if (gltf.animations.length) {
            const mixer = new THREE.AnimationMixer(model);
            mixers.push(mixer);

            // Store animations and mixer in the model's userData
            model.userData.animations = gltf.animations;
            model.userData.mixer = mixer;
        }
    });
}

function findUserDataWithAnimations(obj) {
    if (obj.userData && obj.userData.animations) {
        return obj.userData;
    } else if (obj.parent) {
        return findUserDataWithAnimations(obj.parent);
    }
    return null;
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);


    // Update raycaster direction to match the camera's forward direction
    const cameraDirection = camera.getWorldDirection(new THREE.Vector3());
    raycaster.set(camera.position, cameraDirection);

    // Update ArrowHelper to visualize the ray
    arrowHelper.setDirection(cameraDirection);
    arrowHelper.position.copy(camera.position);

    // Perform raycasting for collision detection
    const intersects = raycaster.intersectObjects(loadedModels, true);


    if (intersects.length > 0) {
        const closestObject = intersects[0].object;
        const userData = findUserDataWithAnimations(closestObject);
        if (userData && userData.animations) {
           
            const randomIndex = Math.floor(Math.random() * userData.animations.length);
            const animation = userData.animations[randomIndex];
            const action = userData.mixer.clipAction(animation);
            action.reset();
            action.setLoop(THREE.LoopOnce);
            action.play(); 
        }
    }
    


    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    mixers.forEach((mixer) => {
        mixer.update(delta);
    });


    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward) velocity.z -= 400.0 * delta;
    if (moveBackward) velocity.z += 400.0 * delta;
    if (moveLeft) velocity.x -= 400.0 * delta;
    if (moveRight) velocity.x += 400.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    prevTime = time;

    renderer.render(scene, camera);
}
