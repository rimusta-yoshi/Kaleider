const onboarding = document.getElementById('onboarding');
const startInstrumentButton = document.getElementById('startInstrument');
const randomizeButton = document.getElementById('randomizeButton');

console.log("Script is running");
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';


// Import shader sources
import colorShiftVertexShader from './shaders/colorShift/vertex.glsl';
import colorShiftFragmentShader from './shaders/colorShift/fragment.glsl';
import noiseVertexShader from './shaders/noise/vertex.glsl';
import noiseFragmentShader from './shaders/noise/fragment.glsl';
import bloomVertexShader from './shaders/bloom/vertex.glsl';
import bloomFragmentShader from './shaders/bloom/fragment.glsl';
import glowVertexShader from './shaders/glow/vertex.glsl';
import glowFragmentShader from './shaders/glow/fragment.glsl';
import matteVertexShader from './shaders/matte/vertex.glsl';
import matteFragmentShader from './shaders/matte/fragment.glsl';
import etherealGlowVertexShader from './shaders/etherealGlow/vertex.glsl';
import etherealGlowFragmentShader from './shaders/etherealGlow/fragment.glsl';
import CRTVertexShader from './shaders/CRT/CRT.vert';
import CRTFragmentShader from './shaders/CRT/CRT.frag';

//audio import
import * as Tone from 'tone';

// Define different scales or note progressions
const scales = {
    pentatonic: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'],
    major: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    minor: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'],
    chromatic: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F#5'], 
    blues: ['C4', 'Eb4', 'F4', 'F#4', 'G4', 'Bb4',' C5'],
    harmonicMinor: ['C4',' D4',' Eb4',' F4',' G4',' Ab4',' B4',' C5'], 
    wholeTone: ['C4',' D4',' E4',' F#4',' G#4',' A#4'],
    phrygianDominant: ['C4',' Db4',' E4',' F4',' G4',' Ab4',' Bb4'], 
    lydian: ['C4',' D4',' E4',' F#4',' G4',' A4',' B4'] 
};

let currentNotes = scales.pentatonic; // Default to pentatonic scale

// ... (keep your existing event listeners and variable declarations)
document.addEventListener('keydown', (event) => {
    console.log('Key pressed:', event.code);
});

document.addEventListener('click', (event) => {
    console.log('Click event:', event.target);
});


let scene, camera, renderer, composer;
let shapes = [];
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let isClicking = false;
let mousePosition3D = new THREE.Vector3();


let synth;

function initAudio() {
    Tone.start();
    synth = new Tone.Synth().toDestination();
    onboarding.style.display = 'none';
    randomizeButton.style.display = 'block';
    init();
    animate();
}

// Create effects
const reverb = new Tone.Reverb({
    decay: 100,
    wet: 1.0
}).toDestination();

const delay = new Tone.FeedbackDelay({
    delayTime: "14n",
    feedback: 0.9
});

// Generate the reverb impulse response
reverb.generate().then(() => {
    console.log("Reverb is ready");
    
    // Chain the effects: synth -> delay -> reverb -> destination
    synth.chain(delay, reverb);
});

// Add this new event listener
startInstrumentButton.addEventListener('click', initAudio);

// Call initAudio() after user interaction, e.g., on a button click
document.getElementById('startInstrument').addEventListener('click', initAudio);


// Function to play a collision sound with the current set of notes
let activeSounds = 0;
const MAX_SIMULTANEOUS_SOUNDS = 5;

function playCollisionSound() {
    if (activeSounds < MAX_SIMULTANEOUS_SOUNDS) {
        const randomNote = currentNotes[Math.floor(Math.random() * currentNotes.length)];
        
        // Randomize volume and pitch for variation
        //synth.volume.value = Math.random() * -12; // Random volume between -12dB and 0dB
        //synth.detune.value = Math.random() * 100 - 50; // Random detune between -50 and +50 cents
        
        synth.triggerAttackRelease(randomNote, "8n");
        activeSounds++;

        setTimeout(() => {
            activeSounds--;
        }, 500); // Adjust based on sound length
    }
}

// Function to randomize the notes when spacebar is pressed
function randomizeNotes() {
    const scaleNames = Object.keys(scales);
    const randomScale = scaleNames[Math.floor(Math.random() * scaleNames.length)];
    currentNotes = scales[randomScale];
    console.log(`Switched to ${randomScale} scale:`, currentNotes);
}

// Event listener for spacebar press to randomize the notes
document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        randomizeNotes();
    }
});

const shaderPasses = {
    colorShift: {
        uniforms: {
            tDiffuse: { value: null },
            uTime: { value: 10 },
            uSpeed: { value: 10.0 },
            uColorA: { value: 10.5 },
            uColorB: { value: 10.5 }
        },
        vertexShader: colorShiftVertexShader,
        fragmentShader: colorShiftFragmentShader
    },
    noise: {
        uniforms: {
            tDiffuse: { value: null },
            uTime: { value: 10 },
            uNoiseScale: { value: 10.1 },
            uNoiseIntensity: { value: 0.01 }
        },
        vertexShader: noiseVertexShader,
        fragmentShader: noiseFragmentShader
    },
    bloom: {
        uniforms: {
            tDiffuse: { value: null },
            uBloomStrength: { value: 0.5 },
            uBloomRadius: { value: 0.2 }
        },
        vertexShader: bloomVertexShader,
        fragmentShader: bloomFragmentShader
    }
};

function createEtherealGlowMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor1: { value: new THREE.Color(0x1e90ff) },
            uColor2: { value: new THREE.Color(0xff1493) }
        },
        vertexShader: etherealGlowVertexShader,
        fragmentShader: etherealGlowFragmentShader,
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
}

let cameraDistance = 40;
let numberOfShapes = 50;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene.background = new THREE.Color(0x000000);  // Black background
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    camera.position.z = cameraDistance;

    createShapes(numberOfShapes);
    setupPostProcessing();
    randomizeShaderParams();

    // ... (keep your existing event listeners)
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', () => isClicking = true);
    window.addEventListener('mouseup', () => isClicking = false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', onWindowResize);

    setupSliders();
}

function createShapes(count) {
    // Remove existing shapes
    shapes.forEach(shape => scene.remove(shape));
    shapes = [];

    // Create new shapes
    for (let i = 0; i < count; i++) {
        createRandomShape();
    }
}

function createRandomShape() {
    const geometries = [
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.ConeGeometry(0.5, 1, 32),
        new THREE.TorusGeometry(0.3, 0.2, 16, 100),
        new THREE.TetrahedronGeometry(0.5)
    ];
    const geometry = geometries[Math.floor(Math.random() * geometries.length)];
    
    const material = createEtherealGlowMaterial();
    const shape = new THREE.Mesh(geometry, material);

    shape.position.set(
        Math.random() * 60 - 30,
        Math.random() * 60 - 30,
        Math.random() * 60 - 30
    );

    shape.velocity = new THREE.Vector3(
        Math.random() * 0.2 - 0.1,
        Math.random() * 0.2 - 0.1,
        Math.random() * 0.2 - 0.1
    );
    shape.lastCollisionTime = 0;
    shapes.push(shape);
    scene.add(shape);
}

function setupSliders() {
    const cameraSlider = document.getElementById('cameraSlider');
    const cameraValue = document.getElementById('cameraValue');
    const shapesSlider = document.getElementById('shapesSlider');
    const shapesValue = document.getElementById('shapesValue');

    cameraSlider.addEventListener('input', (e) => {
        cameraDistance = parseInt(e.target.value);
        cameraValue.textContent = cameraDistance;
        camera.position.z = cameraDistance;
    });

    shapesSlider.addEventListener('input', (e) => {
        numberOfShapes = parseInt(e.target.value);
        shapesValue.textContent = numberOfShapes;
        createShapes(numberOfShapes);
    });
}


// ... (keep your existing setupPostProcessing, randomizeShaderParams, onMouseMove, handleKeyDown, and onWindowResize functions)
function setupPostProcessing() {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    for (const [name, pass] of Object.entries(shaderPasses)) {
        const shaderPass = new ShaderPass(pass);
        composer.addPass(shaderPass);
    }
}

function randomizeShaderParams() {
    console.log("Attempting to randomize shader params");
    for (const [name, pass] of Object.entries(shaderPasses)) {
        console.log(`Randomizing ${name} shader`);
        for (const [key, uniform] of Object.entries(pass.uniforms)) {
            if (key !== 'tDiffuse' && key !== 'uTime') {
                const oldValue = uniform.value;
                switch(key) {
                    case 'uSpeed':
                        uniform.value = Math.random() * 5;
                        break;
                    case 'uColorA':
                    case 'uColorB':
                        uniform.value = Math.random();
                        break;
                    case 'uNoiseScale':
                        uniform.value = Math.random() * 20;
                        break;
                    case 'uNoiseIntensity':
                        uniform.value = Math.random() * 0.5;
                        break;
                    case 'uBloomStrength':
                        uniform.value = Math.random() * 1.5;
                        break;
                    case 'uBloomRadius':
                        uniform.value = Math.random() * 10 + 1;
                        break;
                    default:
                        uniform.value = Math.random();
                }
                console.log(`  ${key}: ${oldValue} -> ${uniform.value}`);
            }
        }
        // Get the actual ShaderPass from the composer
        const shaderPass = composer.passes.find(p => p.uniforms === pass.uniforms);
        if (shaderPass) {
            // Update the uniforms of the ShaderPass
            Object.assign(shaderPass.uniforms, pass.uniforms);
        }
    }
    console.log("Shader parameters randomized");
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.at(30, mousePosition3D);
}

function handleKeyDown(event) {
    console.log("Key pressed:", event.code);
    if (event.code === 'Space') {
        console.log("Spacebar pressed");
        randomizeShaderParams();
    }
}

document.getElementById('randomizeButton').addEventListener('click', randomizeShaderParams);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

const GLOBAL_COOLDOWN = 100; // 100ms global cooldown for sound
let lastGlobalSoundTime = 0;

const BOUNDARY = 60;
const BOUNDARY_FORCE = 0.2; // Stronger repulsion from boundaries
const RANDOM_FORCE = 0.005;
const CENTER_REPULSION_STRENGTH = 0.00; // Central repulsion force

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001; // Convert to seconds

    const center = new THREE.Vector3(0, 0, 0); // Center of the scene

    shapes.forEach((shape, index) => {
        // Update position
        shape.position.add(shape.velocity);

        // Apply drag to slow down shapes
        shape.velocity.multiplyScalar(0.99);

        // Enforce minimum velocity
        const minVelocity = 0.02;
        if (shape.velocity.length() < minVelocity) {
            shape.velocity.normalize().multiplyScalar(minVelocity);
        }

        // Enforce maximum speed
        const maxSpeed = 0.5;
        if (shape.velocity.length() > maxSpeed) {
            shape.velocity.normalize().multiplyScalar(maxSpeed);
        }

        // Add central repulsion force to prevent clustering at corners
        const distanceToCenter = shape.position.distanceTo(center);
        const directionFromCenter = new THREE.Vector3().subVectors(shape.position, center).normalize();
        shape.velocity.add(directionFromCenter.multiplyScalar(CENTER_REPULSION_STRENGTH / (distanceToCenter + 1)));

        // Add repulsion force from boundaries
        if (Math.abs(shape.position.x) > BOUNDARY - 2) {
            shape.velocity.x -= Math.sign(shape.position.x) * BOUNDARY_FORCE;
        }
        if (Math.abs(shape.position.y) > BOUNDARY - 2) {
            shape.velocity.y -= Math.sign(shape.position.y) * BOUNDARY_FORCE;
        }
        if (Math.abs(shape.position.z) > BOUNDARY - 2) {
            shape.velocity.z -= Math.sign(shape.position.z) * BOUNDARY_FORCE;
        }

        // Add small random force for variety
        shape.velocity.add(new THREE.Vector3(
            (Math.random() - 0.5) * RANDOM_FORCE,
            (Math.random() - 0.5) * RANDOM_FORCE,
            (Math.random() - 0.5) * RANDOM_FORCE
        ));

        // Bounce off walls (keep this as a hard limit)
        if (Math.abs(shape.position.x) > BOUNDARY) {
            shape.velocity.x *= -1;
            shape.position.x = Math.sign(shape.position.x) * BOUNDARY;
        }
        if (Math.abs(shape.position.y) > BOUNDARY) {
            shape.velocity.y *= -1;
            shape.position.y = Math.sign(shape.position.y) * BOUNDARY;
        }
        if (Math.abs(shape.position.z) > BOUNDARY) {
            shape.velocity.z *= -1;
            shape.position.z = Math.sign(shape.position.z) * BOUNDARY;
        }

        // Check for collisions with other shapes
        for (let i = index + 1; i < shapes.length; i++) {
            const otherShape = shapes[i];
            const distance = shape.position.distanceTo(otherShape.position);
            const combinedRadius = 1.5; // Adjust this value if needed

            // Only trigger sound if distance is significantly less than combinedRadius
            if (distance < combinedRadius - 0.2) { // Add a small buffer to prevent false positives
                // Handle collision and sound triggering here
            }

            if (distance < combinedRadius) {
                // Collision detected
                const currentTime = performance.now();
                const cooldownPeriod = 2000; // Increase individual shape cooldown to 2000ms
            
                if (currentTime - lastGlobalSoundTime > GLOBAL_COOLDOWN &&
                    (!shape.lastCollisionTime || currentTime - shape.lastCollisionTime > cooldownPeriod)) {
                    
                    playCollisionSound();
                    shape.lastCollisionTime = currentTime;
                    lastGlobalSoundTime = currentTime;
                }
            
                // Collision response (more elastic)
                const normal = shape.position.clone().sub(otherShape.position).normalize();
                const relativeVelocity = shape.velocity.clone().sub(otherShape.velocity);
                const impulse = -2 * relativeVelocity.dot(normal) / 2;
                shape.velocity.add(normal.multiplyScalar(impulse * 1.1)); // 10% extra bounce
                otherShape.velocity.sub(normal.multiplyScalar(impulse * 1.1));
            
                // Strong repulsion force to prevent sticking
                const repulsionForce = normal.multiplyScalar(0.7 * (combinedRadius - distance));
                shape.position.add(repulsionForce);
                otherShape.position.sub(repulsionForce);
            }
        }

        // Handle mouse interactions
        const distanceToMouse = shape.position.distanceTo(mousePosition3D);
        const forceDirection = new THREE.Vector3().subVectors(shape.position, mousePosition3D).normalize();

        if (isClicking) {
            // Attract to mouse with a smoother, more controlled force
            const attractionStrength = Math.min(0.05, 10 / (distanceToMouse * distanceToMouse));
            shape.velocity.add(forceDirection.multiplyScalar(-attractionStrength));
        } else {
            // Repel from mouse
            const repelForce = 5 / (distanceToMouse * distanceToMouse + 1);
            shape.velocity.add(forceDirection.multiplyScalar(repelForce));
        }

        // Update ethereal glow effect
        shape.material.uniforms.uTime.value = time;

        // Add subtle rotation
        shape.rotation.x += 0.005;
        shape.rotation.y += 0.005;
    });

    // Update post-processing shader uniforms
    for (const pass of Object.values(shaderPasses)) {
      if (pass.uniforms.uTime) {
          pass.uniforms.uTime.value = time;
      }
    }

    composer.render();
}
  
  // Initialize lastLogTime outside the animate function
  let lastLogTime = 0;
