import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


      // Set up scene
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);

      // Create player
      const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
      const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const player = new THREE.Mesh(playerGeometry, playerMaterial);
      scene.add(player);

      // Create ground
      const groundGeometry = new THREE.PlaneGeometry(10, 10);
      const groundMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = Math.PI / 2;
      scene.add(ground);

      // Create raycaster
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      // Set up controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;

      // Set up camera position
      camera.position.y = 3;
      camera.position.z = 5;

      // Handle window resize
      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      // Animation function
      function animate() {
        requestAnimationFrame(animate);

        // Update controls
        controls.update();

        // Update raycaster
        raycaster.setFromCamera(mouse, camera);

        // Perform raycasting
        const intersects = raycaster.intersectObjects(scene.children);

        // Check for intersections
        if (intersects.length > 0) {
          // Assuming the first object is the one we're interested in
          const object = intersects[0].object;

          // Trigger animation if the intersected object is not the player
          if (object !== player) {
            // You can replace this with your animation logic
            object.rotation.x += 0.1;
            object.rotation.y += 0.1;
          }
        }

        // Render scene
        renderer.render(scene, camera);
      }

      // Handle mouse move for raycasting
      window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      });

      // Start animation
      animate();