import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


let scene, renderer, camera;
let controls;
let model, model2, mixer;


// load animation
// raycast
// wasd navigation

const loader = new GLTFLoader();

loader.load( 'Models/mushy.glb', function ( gltf ) {
	model = gltf.scene;
	model.scale.set(5, 5, 5);	
	model.position.set(2, 0, 2);	
	model.rotation.set(0, 5, 0);	
	scene.add( model);
	mixer = new THREE.AnimationMixer( model );
	const clips = model.animations;
	
//	function update () {
//	mixer.update( deltaSeconds );
//}
//	
//const clip = THREE.AnimationClip.findByName( clips, 'idk' );
//const action = mixer.clipAction( clip );
//action.play();
//	
	mixer.clipAction( gltf.animations[ 1 ] ).setDuration( 1 ).play();
	animate();
	}, undefined, function ( error ) {
	console.error( error );
	} 
);


loader.load( 'Models/luggage.glb', function ( gltf ) {
	model2 = gltf.scene;
	model2.scale.set(1, 1, 1);	
	model2.position.set(0, 0.6, 0);	
	scene.add( model2);
//	mixer = new THREE.AnimationMixer( model2 );
//    mixer.clipAction( gltf.animations[ 0 ] ).setDuration( 1 ).play();
//	animate();
	}, undefined, function ( error ) {
	console.error( error );
	} 
);
	
	
	scene = new THREE.Scene();
	
    scene.background = new THREE.Color( 0x000000 );
    // scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );
	
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

	// Create a camera
    camera = new THREE.PerspectiveCamera (45, window.innerWidth/window.innerHeight, 1, 10000);
    camera.position.z = 5;
    camera.position.y = 5;
    camera.position.x = 5;
    camera.lookAt (new THREE.Vector3(0,0,0));


    // controls
    controls = new OrbitControls (camera, renderer.domElement);
    controls.listenToKeyEvents( window ); // optional

    //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.maxPolarAngle = Math.PI / 2;


	// Create the main cube
	const mainCubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
	const mainCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	const mainCube = new THREE.Mesh(mainCubeGeometry, mainCubeMaterial);
	scene.add(mainCube);

	// Create the ground plane
	const groundGeometry = new THREE.PlaneGeometry(20, 20);
	const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x101010});
	const ground = new THREE.Mesh(groundGeometry, groundMaterial);
	ground.rotation.x = -Math.PI / 2;
	scene.add(ground);

	// Create smaller cubes
	const smallerCubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
	const smallerCubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

	const smallerCubes = [];
	const positions = [
		{ x: -3, y: 0.25, z: -3 },
		{ x: -3, y: 0.25, z: 3 },
		{ x: 3, y: 0.25, z: -3 },
		{ x: 3, y: 0.25, z: 3 }
	];

	positions.forEach(position => {
		const smallerCube = new THREE.Mesh(smallerCubeGeometry, smallerCubeMaterial);
		smallerCube.position.set(position.x, position.y, position.z);
		smallerCubes.push(smallerCube);
		scene.add(smallerCube);
	});

	// Add lights
	const ambientLight = new THREE.AmbientLight(0x404040);
	scene.add(ambientLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff);
	directionalLight.position.set(-1, 1, -1);
	scene.add(directionalLight);

	const pointLight = new THREE.DirectionalLight(0xfff77);
	pointLight.position.set(-1, 3, 1);
	scene.add(pointLight);
	const pointLight2 = new THREE.DirectionalLight(0xf77fff);
	pointLight2.position.set(1, 3, -3);
	scene.add(pointLight2);

	// Set up mouse interaction
	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();
	const clickStartPosition = new THREE.Vector2();
	let isDragging = false;
	let rotationSpeed = 0.005;

	document.addEventListener('mousedown', (event) => {
		isDragging = true;
		clickStartPosition.x = event.clientX;
		clickStartPosition.y = event.clientY;
	});

	document.addEventListener('mouseup', () => {
		isDragging = false;
	});

	document.addEventListener('mousemove', (event) => {
		if (isDragging) {
			const deltaX = event.clientX - clickStartPosition.x;
			const deltaY = event.clientY - clickStartPosition.y;
			mainCube.rotation.x += deltaX * rotationSpeed;
			mainCube.rotation.y += deltaY * rotationSpeed;
			clickStartPosition.x = event.clientX;
			clickStartPosition.y = event.clientY;
		}
	});

	// Handle window resizing
	window.addEventListener('resize', () => {
		const newWidth = window.innerWidth;
		const newHeight = window.innerHeight;

		camera.aspect = newWidth / newHeight;
		renderer.setSize(newWidth, newHeight);
	});

	// Render the scene
	const animate = () => {
		requestAnimationFrame(animate);

		renderer.render(scene, camera);
	};

	animate();
