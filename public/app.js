import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * CONFIGURAZIONE SOSTANZE
 */
const SUBSTANCES = [
    {
        id: 1,
        name: "Cocaina",
        risk: "Infarto e ictus fulminanti.",
        mechanism: "Cortocircuito massivo della dopamina.",
        color: 0xffffff,
        model: "cocaina.glb"
    },
    {
        id: 2,
        name: "MDMA",
        risk: "Ipertermia maligna (>41°C) e collasso d'organo.",
        mechanism: "Rilascio forzato e svuotamento della serotonina.",
        color: 0xff00ff,
        model: "mdma.glb"
    },
    {
        id: 3,
        name: "Fentanyl",
        risk: "Depressione respiratoria fulminea.",
        mechanism: "Legame ultra-potente ai recettori oppioidi.",
        dose: "2mg (Letale - pari a 2 granelli di sale)",
        color: 0x00ffff,
        model: "fentanyl.glb"
    }
];

/**
 * VARIABILI GLOBALI
 */
let scene, camera, renderer, controls, clock, loader;
let raycaster, mouse = new THREE.Vector2();
let substances_meshes = [];
let hoveredSubstance = null;
let selectedSubstance = null;
let isUIOpen = false;
let scrollY = 0;
let targetFOV = 75;
let flickerLight, selectionLight;
let particles = [];

/**
 * SISTEMA PARTICELLARE (Effetto ologramma)
 */
class Particle {
    constructor(pos, color) {
        this.pos = pos.clone();
        this.vel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.05,
            Math.random() * 0.08,
            (Math.random() - 0.5) * 0.05
        );
        this.alpha = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
        
        const geo = new THREE.SphereGeometry(0.02, 4, 4);
        const mat = new THREE.MeshBasicMaterial({ 
            color: color, 
            transparent: true, 
            opacity: 1 
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(this.pos);
        scene.add(this.mesh);
    }

    update() {
        this.pos.add(this.vel);
        this.alpha -= this.decay;
        this.mesh.position.copy(this.pos);
        this.mesh.material.opacity = this.alpha;
        
        if (this.alpha <= 0) {
            scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            return false;
        }
        return true;
    }
}

function spawnParticles(pos, color) {
    if (particles.length < 60) {
        particles.push(new Particle(pos, color));
    }
}

/**
 * INIZIALIZZAZIONE SCENA
 */
function init() {
    console.log("Inizializzazione scena 3D...");
    
    clock = new THREE.Clock();
    loader = new GLTFLoader();
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205);
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 50); 

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 5;
    controls.maxDistance = 30;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.target.set(0, 0, 0);

    // ILLUMINAZIONE
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.8);
    scene.add(hemiLight);

    const topLight = new THREE.SpotLight(0xffffff, 250);
    topLight.position.set(0, 25, 10);
    topLight.angle = Math.PI / 4;
    topLight.penumbra = 0.5;
    topLight.decay = 2;
    topLight.castShadow = true;
    scene.add(topLight);

    flickerLight = new THREE.SpotLight(0xff0000, 0);
    flickerLight.position.set(0, 12, 0);
    flickerLight.angle = Math.PI / 3;
    flickerLight.decay = 1;
    flickerLight.distance = 50;
    scene.add(flickerLight);

    selectionLight = new THREE.PointLight(0xffffff, 0, 25);
    scene.add(selectionLight);

    // CARICAMENTO MODELLI
    createTable();
    createSubstances();

    raycaster = new THREE.Raycaster();

    // EVENTI
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    window.addEventListener('scroll', onScroll);
    document.getElementById('close-btn').addEventListener('click', closeUI);

    animate();

    // NASCONDI LOADER
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => document.getElementById('loader').classList.add('hidden'), 500);
    }, 2000);
}

function createTable() {
    loader.load('tavolo.glb', (gltf) => {
        console.log("Tavolo caricato con successo");
        const table = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(table);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        table.position.sub(center); 
        
        const tableGroup = new THREE.Group();
        tableGroup.add(table);
        
        const scale = 20 / Math.max(size.x, size.z); 
        tableGroup.scale.setScalar(scale);
        tableGroup.position.y = -2;
        
        tableGroup.traverse(child => {
            if (child.isMesh) {
                child.receiveShadow = true;
                child.castShadow = true;
                if (child.material) {
                    child.material.roughness = 0.5;
                    child.material.metalness = 0.4;
                }
            }
        });
        scene.add(tableGroup);
    }, undefined, (error) => {
        console.error("Errore caricamento tavolo.glb, uso fallback", error);
        const tableGroup = new THREE.Group();
        const tableGeo = new THREE.CylinderGeometry(10, 9, 0.5, 64);
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.4, metalness: 0.7 });
        const top = new THREE.Mesh(tableGeo, tableMat);
        top.receiveShadow = true;
        tableGroup.add(top);
        tableGroup.position.y = -1.5;
        scene.add(tableGroup);
    });
}

function createSubstances() {
    SUBSTANCES.forEach((data, index) => {
        const angle = (index / SUBSTANCES.length) * Math.PI * 2;
        const radius = 6;
        const posX = Math.cos(angle) * radius;
        const posZ = Math.sin(angle) * radius;

        loader.load(data.model, (gltf) => {
            console.log(`Modello ${data.name} caricato`);
            const model = gltf.scene;
            
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            model.position.sub(center); 
            
            const wrapper = new THREE.Group();
            wrapper.add(model);
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 1.8 / maxDim;
            wrapper.scale.setScalar(scale);

            wrapper.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.emissive = new THREE.Color(data.color);
                        child.material.emissiveIntensity = 0.3;
                    }
                }
            });

            wrapper.position.set(posX, 1.0, posZ);
            wrapper.userData = { ...data, isSubstance: true };
            wrapper.userData.originalPosition = wrapper.position.clone();
            
            // Luce sotto la sostanza
            const pLight = new THREE.PointLight(data.color, 10, 5);
            pLight.position.set(0, -0.5, 0);
            wrapper.add(pLight);

            scene.add(wrapper);
            substances_meshes.push(wrapper);
        }, undefined, (error) => {
            console.warn(`Modello ${data.model} non trovato, uso pillola di emergenza`);
            
            const wrapper = new THREE.Group();
            const geo = new THREE.CapsuleGeometry(0.4, 0.5, 4, 12);
            const mat = new THREE.MeshStandardMaterial({ 
                color: data.color, 
                emissive: data.color, 
                emissiveIntensity: 0.6,
                metalness: 0.3,
                roughness: 0.1
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.z = Math.PI / 4;
            wrapper.add(mesh);

            wrapper.position.set(posX, 1.0, posZ);
            wrapper.userData = { ...data, isSubstance: true };
            wrapper.userData.originalPosition = wrapper.position.clone();
            
            const pLight = new THREE.PointLight(data.color, 12, 6);
            pLight.position.set(0, -0.2, 0);
            wrapper.add(pLight);

            scene.add(wrapper);
            substances_meshes.push(wrapper);
        });
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

function getRootObject(obj) {
    if (obj.userData && obj.userData.isSubstance) return obj;
    if (obj.parent) return getRootObject(obj.parent);
    return null;
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(substances_meshes, true);

    if (intersects.length > 0) {
        const root = getRootObject(intersects[0].object);
        if (root) {
            document.body.style.cursor = 'pointer';
            hoveredSubstance = root;
            spawnParticles(root.position, root.userData.color || 0xffffff);
        }
    } else {
        document.body.style.cursor = 'default';
        hoveredSubstance = null;
    }
}

function onClick() {
    if (isUIOpen) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(substances_meshes, true);

    if (intersects.length > 0) {
        const root = getRootObject(intersects[0].object);
        if (root) {
            openUI(root.userData);
            selectedSubstance = root;
        }
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
    
    const sections = document.querySelectorAll('.data-section');
    sections.forEach(s => s.classList.add('animate'));
    
    targetFOV = 40;
    controls.autoRotate = false;
}

function closeUI() {
    isUIOpen = false;
    document.getElementById('ui-overlay').classList.remove('visible');
    const sections = document.querySelectorAll('.data-section');
    sections.forEach(s => s.classList.remove('animate'));

    setTimeout(() => {
        if (!isUIOpen) document.getElementById('ui-overlay').classList.add('hidden');
    }, 400);
    selectedSubstance = null;
    targetFOV = 75;
    controls.autoRotate = true;
}

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();
    const scrollProgress = Math.min(scrollY / window.innerHeight, 1);

    // Gestione FOV
    if (Math.abs(camera.fov - targetFOV) > 0.1) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.1);
        camera.updateProjectionMatrix();
    }

    // Movimento camera basato sullo scroll
    if (!isUIOpen) {
        const startPos = new THREE.Vector3(0, 40, 60);
        const endPos = new THREE.Vector3(0, 10, 20); 
        camera.position.lerpVectors(startPos, endPos, scrollProgress);
        camera.lookAt(0, 0, 0);
        
        scene.children.forEach(child => {
            if (child instanceof THREE.SpotLight && child !== flickerLight) {
                child.intensity = scrollProgress * 200;
            }
        });

        controls.enabled = scrollProgress >= 0.9;
        selectionLight.intensity = 0;
    } else if (selectedSubstance) {
        // Zoom sulla sostanza selezionata
        const targetPos = selectedSubstance.position.clone().add(new THREE.Vector3(0, 5, 12)); 
        camera.position.lerp(targetPos, 0.05);
        camera.lookAt(selectedSubstance.position);
        controls.enabled = false;

        selectionLight.position.copy(selectedSubstance.position);
        selectionLight.color.setHex(selectedSubstance.userData.color);
        selectionLight.intensity = THREE.MathUtils.lerp(selectionLight.intensity, 80, 0.05);
    }

    // Aggiorna particelle
    particles = particles.filter(p => p.update());

    // Effetto sfarfallio luce rossa
    if (scrollProgress > 0.9) {
        flickerLight.intensity = Math.random() > 0.9 ? Math.random() * 100 : 20;
    } else {
        flickerLight.intensity = 0;
    }

    // Animazione sostanze
    substances_meshes.forEach(mesh => {
        if (mesh !== selectedSubstance) {
            mesh.rotation.y += 0.01;
            mesh.position.lerp(mesh.userData.originalPosition, 0.05);
        } else {
            mesh.rotation.y += 0.02;
            const focusPosition = new THREE.Vector3(-4, 2, 4);
            mesh.position.lerp(focusPosition, 0.05);
        }

        let targetEmissive = (mesh === hoveredSubstance) ? 1.0 : 0.3;
        if (mesh === selectedSubstance) targetEmissive = 3.0;

        mesh.traverse(child => {
            if (child.isMesh && child.material && child.material.emissiveIntensity !== undefined) {
                child.material.emissiveIntensity = THREE.MathUtils.lerp(child.material.emissiveIntensity, targetEmissive, 0.1);
            }
        });

        const targetScale = (mesh === selectedSubstance) ? 1.3 : (mesh === hoveredSubstance ? 1.15 : 1.0);
        const pulse = Math.sin(elapsedTime * 3) * 0.02;
        const s = THREE.MathUtils.lerp(mesh.scale.x, targetScale + pulse, 0.1);
        mesh.scale.set(s, s, s);
    });

    controls.update();
    renderer.render(scene, camera);
}

// AVVIO
init();
