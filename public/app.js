import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * DATA DEFINITIONS
 */
const SUBSTANCES = [
    {
        id: 1,
        name: "Cocaina",
        risk: "Infarto e ictus fulminanti.",
        mechanism: "Cortocircuito massivo della dopamina.",
        color: 0xffffff,
        geometry: "cube"
    },
    {
        id: 2,
        name: "MDMA",
        risk: "Ipertermia maligna (>41°C) e collasso d'organo.",
        mechanism: "Rilascio forzato e svuotamento della serotonina.",
        color: 0xff00ff,
        geometry: "sphere"
    },
    {
        id: 3,
        name: "Fentanyl",
        risk: "Depressione respiratoria fulminea.",
        mechanism: "Legame ultra-potente ai recettori oppioidi.",
        dose: "2mg (Letale - pari a 2 granelli di sale)",
        color: 0x00ffff,
        geometry: "tetrahedron"
    }
];

/**
 * APP STATE
 */
let scene, camera, renderer, controls, raycaster, clock;
let mouse = new THREE.Vector2();
let substances_meshes = [];
let selectedSubstance = null;
let hoveredSubstance = null;
let isUIOpen = false;
let flickerLight, selectionLight;
let scrollY = 0;
let particles = [];
let targetFOV = 75;

/**
 * PARTICLE SYSTEM
 */
class Particle {
    constructor(position, color) {
        this.position = position.clone();
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        );
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
        
        const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 1
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        scene.add(this.mesh);
    }

    update() {
        this.position.add(this.velocity);
        this.mesh.position.copy(this.position);
        this.life -= this.decay;
        this.mesh.material.opacity = this.life;
        
        if (this.life <= 0) {
            scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            return false;
        }
        return true;
    }
}

function spawnParticles(position, color) {
    for (let i = 0; i < 5; i++) {
        particles.push(new Particle(position, color));
    }
}

/**
 * INITIALIZATION
 */
function init() {
    // Clock for time-based animations
    clock = new THREE.Clock();
    // Scene & Fog
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.15);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 8);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1; // Prevent going under the table
    controls.minDistance = 4;
    controls.maxDistance = 15;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 20);
    spotLight.position.set(0, 10, 0);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.3;
    spotLight.decay = 2;
    spotLight.distance = 50;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    scene.add(spotLight);

    // Flickering Light (initially off)
    flickerLight = new THREE.SpotLight(0xffffff, 0);
    flickerLight.position.set(0, 8, 0);
    flickerLight.angle = Math.PI / 4;
    flickerLight.penumbra = 0.5;
    flickerLight.decay = 1;
    flickerLight.distance = 30;
    scene.add(flickerLight);

    // Selection Light (for bloom effect)
    selectionLight = new THREE.PointLight(0xffffff, 0, 10);
    scene.add(selectionLight);

    // The Table
    const tableGeo = new THREE.CylinderGeometry(5, 5, 0.5, 64);
    const tableMat = new THREE.MeshStandardMaterial({ 
        color: 0x111111, 
        roughness: 0.8, 
        metalness: 0.2 
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = -0.25;
    table.receiveShadow = true;
    scene.add(table);

    // Add Substances
    createSubstances();

    // Raycaster
    raycaster = new THREE.Raycaster();

    // Events
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    window.addEventListener('scroll', onScroll);
    document.getElementById('close-btn').addEventListener('click', closeUI);

    // Stop auto-rotate on manual interaction
    controls.addEventListener('start', () => {
        if (!isUIOpen) controls.autoRotate = false;
    });
    
    controls.addEventListener('end', () => {
        if (!isUIOpen) controls.autoRotate = true;
    });

    // Start Animation
    animate();

    // Hide Loader
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => document.getElementById('loader').classList.add('hidden'), 500);
    }, 1500);
}

function createSubstances() {
    SUBSTANCES.forEach((data, index) => {
        let geometry;
        switch(data.geometry) {
            case 'cube': geometry = new THREE.BoxGeometry(1, 1, 1); break;
            case 'sphere': geometry = new THREE.SphereGeometry(0.6, 32, 32); break;
            case 'tetrahedron': geometry = new THREE.TetrahedronGeometry(0.8); break;
        }

        const material = new THREE.MeshStandardMaterial({ 
            color: data.color,
            emissive: data.color,
            emissiveIntensity: 0.2,
            metalness: 0.5,
            roughness: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // Position on table in a circle
        const angle = (index / SUBSTANCES.length) * Math.PI * 2;
        const radius = 3;
        mesh.position.set(Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Store data reference and original position
        mesh.userData = data;
        mesh.userData.originalPosition = mesh.position.clone();
        
        scene.add(mesh);
        substances_meshes.push(mesh);
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onScroll() {
    scrollY = window.scrollY;
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Hover effect
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(substances_meshes);

    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
        hoveredSubstance = intersects[0].object;
        
        // Spawn particles on hover
        spawnParticles(hoveredSubstance.position, hoveredSubstance.userData.color);
    } else {
        document.body.style.cursor = 'default';
        hoveredSubstance = null;
    }
}

function onClick() {
    if (isUIOpen) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(substances_meshes);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        openUI(object.userData);
        selectedSubstance = object;
    }
}

function openUI(data) {
    isUIOpen = true;
    const ui = document.getElementById('ui-overlay');
    document.getElementById('substance-name').innerText = data.name;
    document.getElementById('substance-risk').innerText = data.risk;
    document.getElementById('substance-mechanism').innerText = data.mechanism;
    
    const extra = document.getElementById('extra-data');
    if (data.dose) {
        document.getElementById('substance-dose').innerText = data.dose;
        extra.classList.remove('hidden');
    } else {
        extra.classList.add('hidden');
    }

    ui.classList.add('visible');
    ui.classList.remove('hidden');
    
    // Staggered text animation
    const sections = document.querySelectorAll('.data-section');
    sections.forEach(s => s.classList.add('animate'));
    
    // Zoom camera dramatically
    targetFOV = 55;
    controls.autoRotate = false;
}

function closeUI() {
    isUIOpen = false;
    document.getElementById('ui-overlay').classList.remove('visible');
    
    // Reset staggered animations
    const sections = document.querySelectorAll('.data-section');
    sections.forEach(s => s.classList.remove('animate'));

    setTimeout(() => {
        if (!isUIOpen) document.getElementById('ui-overlay').classList.add('hidden');
    }, 300);
    selectedSubstance = null;
    
    // Reset FOV
    targetFOV = 75;

    // Re-enable auto-rotation
    controls.autoRotate = true;
}

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();
    const scrollProgress = Math.min(scrollY / window.innerHeight, 1);

    // Smooth FOV transition
    if (Math.abs(camera.fov - targetFOV) > 0.1) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.1);
        camera.updateProjectionMatrix();
    }

    // Camera position based on scroll or selection
    if (!isUIOpen) {
        const startPos = new THREE.Vector3(0, 20, 30);
        const endPos = new THREE.Vector3(0, 5, 8);
        camera.position.lerpVectors(startPos, endPos, scrollProgress);
        camera.lookAt(0, 0, 0);
        
        // Main spotlight intensity based on scroll
        scene.children.forEach(child => {
            if (child instanceof THREE.SpotLight && child !== flickerLight) {
                child.intensity = scrollProgress * 50;
            }
        });

        // Disable controls if we are scrolling through intro
        if (scrollProgress < 0.9) {
            controls.enabled = false;
        } else {
            controls.enabled = true;
        }
        
        selectionLight.intensity = 0;
    } else if (selectedSubstance) {
        // Smooth zoom to selected substance
        const targetPos = selectedSubstance.position.clone().add(new THREE.Vector3(0, 2, 6));
        camera.position.lerp(targetPos, 0.05);
        camera.lookAt(selectedSubstance.position);
        controls.enabled = false; // Disable orbit controls during focus

        // Update selection light for bloom effect
        selectionLight.position.copy(selectedSubstance.position);
        selectionLight.color.setHex(selectedSubstance.userData.color);
        selectionLight.intensity = THREE.MathUtils.lerp(selectionLight.intensity, 50, 0.05);
    }

    // Update particles
    particles = particles.filter(p => p.update());

    // Flickering light logic
    if (scrollProgress > 0.8) {
        // We use a timer-based approach for the startup flicker
        const flickerDuration = 2.0; // seconds
        const timeSinceTrigger = elapsedTime % 10; // Simple way to reset or just use a state
        
        // Let's use a more robust state for the flicker
        if (!window.flickerStartTime && scrollProgress > 0.9) {
            window.flickerStartTime = elapsedTime;
        }

        if (window.flickerStartTime) {
            const delta = elapsedTime - window.flickerStartTime;
            if (delta < flickerDuration) {
                // Startup flicker phase
                if (Math.random() > 0.8) {
                    flickerLight.intensity = Math.random() * 150 + 50;
                    flickerLight.color.setHex(0xffffff); // White flicker
                } else {
                    flickerLight.intensity = 0;
                }
            } else {
                // Stable light phase
                flickerLight.intensity = 150;
                flickerLight.color.setHex(0xffffff);
            }
        }
    } else {
        flickerLight.intensity = 0;
        window.flickerStartTime = null;
    }

    // Animations for all substances
    substances_meshes.forEach(mesh => {
        // 1. Continuous Rotation (Vertical axis)
        if (mesh !== selectedSubstance) {
            mesh.rotation.y += 0.01;
            mesh.rotation.x += 0.005;
            
            // Smoothly return to original position if not selected
            mesh.position.lerp(mesh.userData.originalPosition, 0.05);
        } else {
            // Faster rotation when selected
            mesh.rotation.y += 0.05;
            mesh.rotation.z += 0.01;

            // Move closer to camera and to the left (X: -3)
            const focusPosition = new THREE.Vector3(-3, 2, 4);
            mesh.position.lerp(focusPosition, 0.05);
        }

        // 2. Hover & Pulsation Effects
        let targetEmissive = 0.2;
        let targetScale = 1.0;

        if (mesh === hoveredSubstance) {
            targetEmissive = 0.8;
            targetScale = 1.15;
        }

        if (mesh === selectedSubstance) {
            targetEmissive = 3.0;
            targetScale = 1.3;
        }

        // Smooth transition for emissive intensity
        mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
            mesh.material.emissiveIntensity, 
            targetEmissive, 
            0.1
        );

        // Combine hover scale with subtle pulsation
        const pulse = Math.sin(elapsedTime * 2) * 0.05;
        const currentTargetScale = targetScale + pulse;
        const newScale = THREE.MathUtils.lerp(mesh.scale.x, currentTargetScale, 0.1);
        mesh.scale.set(newScale, newScale, newScale);
    });

    controls.update();
    renderer.render(scene, camera);
}

init();
