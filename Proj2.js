import * as THREE from 'three';

import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
let loader, mixers = [];
let raycaster, mouse;
let clock = new THREE.Clock();

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();


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
    raycaster.far = 10; // Only detect collisions within 10 units from the camera
    mouse = new THREE.Vector2();

    // Mouse event listener for model interaction
    document.addEventListener('mousedown', onDocumentMouseDown, false);

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

        if (gltf.animations.length) {
            const mixer = new THREE.AnimationMixer(model);
            mixers.push(mixer);

            // Store animations and mixer in the model's userData
            model.userData.animations = gltf.animations;
            model.userData.mixer = mixer;
        }
    });
}

function onDocumentMouseDown(event) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;


    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;


        //TODO: look for a property called userData, if not found on this object then look for the `parent` and seek it on the parent, do this recursively untill you find the userData.
        const userData = findUserDataWithAnimations(clickedObject);


        if (userData && userData.animations) {
            console.log(userData);
            const randomIndex = Math.floor(Math.random() * userData.animations.length);
            const animation = userData.animations[randomIndex];
            const action = userData.mixer.clipAction(animation);
            action.setLoop(THREE.LoopOnce);
            action.play();
        }
    }
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
