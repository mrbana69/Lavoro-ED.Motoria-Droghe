'use client';

import { useState, useRef, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import { PDBLoader } from 'three/examples/jsm/loaders/PDBLoader';

// Dati delle sostanze
const substances = [
  { id: 'mdma', name: 'MDMA', class: 'Empatogeno', lethalDose: '500mg', risks: 'Overriscaldamento fatale, disidratazione cronica, sindrome serotoninergica.', deepLink: '/analysis/mdma' },
  { id: 'cocaine', name: 'Cocaina', class: 'Stimolante', lethalDose: '1.2g', risks: 'Infarto cardiaco, arresto respiratorio, stroke cerebrale.', deepLink: '/analysis/cocaine' },
  { id: 'fentanyl', name: 'Fentanyl', class: 'Opioide', lethalDose: '2mg', risks: 'Soppressione respiratoria immediata, overdose letale in pochi minuti.', deepLink: '/analysis/fentanyl' },
  { id: 'lsd', name: 'LSD', class: 'Allucinogeno', lethalDose: 'Sconosciuta (molto alta)', risks: 'Psicosi persistente, flashback, HPPD.', deepLink: '/analysis/lsd' },
  { id: 'alcol', name: 'Alcol', class: 'Depressore', lethalDose: '0.40% BAC', risks: 'Coma etilico, arresto respiratorio, danni epatici progressivi.', deepLink: '/analysis/alcol' },
  { id: 'pcp', name: 'PCP', class: 'Dissociativo', lethalDose: '1-3 mg/kg', risks: 'Psicosi violenta incontrollabile, dissociazione, rabdomiolisi.', deepLink: '/analysis/pcp' }
];

function CustomModel({ fileName, color, modelScale = 1 }: { fileName: string; color: string; modelScale?: number }) {
  // Carica il modello dal percorso specifico in base alla droga (lsd si trova in mol)
  const modelPath = fileName === 'lsd' ? `/models/mol/${fileName}.glb` : `/models/${fileName}.glb`;
  const { scene } = useGLTF(modelPath);
  
  // Sostituisce il materiale del tuo modello per fargli mantenere l'effetto ologramma
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshStandardMaterial({
          color: color,
          wireframe: true,
          emissive: color,
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.3
        });
      }
    });
  }, [scene, color]);

  return (
    <Center scale={modelScale}>
      <primitive object={scene} />
    </Center>
  );
}

// Modello Molecolare PDB
function PDBModel({ fileName, color, modelScale = 1 }: { fileName: string; color: string; modelScale?: number }) {
  const pdb = useLoader(PDBLoader, `/models/mol/${fileName}.pdb`);

  // Estraiamo le posizioni degli atomi dalla geometria per renderizzarli come mesh separate
  const atomPositions = useMemo(() => {
    const positionAttr = pdb.geometryAtoms.getAttribute('position');
    if (!positionAttr) return [];
    const positions = positionAttr.array;
    const vectors = [];
    for (let i = 0; i < positions.length; i += 3) {
      vectors.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
    }
    return vectors;
  }, [pdb]);

  const hasBonds = pdb.geometryBonds && pdb.geometryBonds.getAttribute('position') && pdb.geometryBonds.getAttribute('position').count > 0;

  return (
    <Center scale={modelScale * 0.15}>
      {/* Atomi - Renderizzati come sfere 3D */}
      {atomPositions.map((pos, index) => (
        <mesh key={index} position={pos}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color={color} transparent opacity={0.8} emissive={color} emissiveIntensity={0.6} />
        </mesh>
      ))}

      {/* Legami chimici */}
      {hasBonds && (
        <lineSegments>
          <primitive object={pdb.geometryBonds} attach="geometry" />
          <lineBasicMaterial color={color} transparent opacity={0.4} />
        </lineSegments>
      )}
    </Center>
  );
}

// Ologramma letale wireframe
function Hologram({ substanceId }: { substanceId: string }) {
  const groupRef = useRef<THREE.Group>(null!);
  const { clock } = useThree();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.5;
      groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.2;
    }
  });

  const colors: Record<string, string> = {
    mdma: '#ff4081',
    cocaine: '#ffffff',
    cocaina: '#ffffff',
    fentanyl: '#4caf50',
    lsd: '#9c27b0',
    alcol: '#ffb300',
    pcp: '#cddc39'
  };
  const color = colors[substanceId] || '#00ffff';

  const fileMap: Record<string, string> = {
    alcol: 'ethanol',
    cocaina: 'cocaine', // Fallback incrociato in caso di discrepanze tra nome file e ID
  };
  const fileName = fileMap[substanceId] || substanceId;
  const customScale = substanceId === 'lsd' ? 0.05 : 1;

  // Flag per determinare quali modelli sono in formato PDB molecolare
  const isPdb = ['mdma', 'cocaine', 'cocaina', 'ethanol', 'fentanyl', 'pcp'].includes(fileName);

  return (
    <group ref={groupRef} scale={1.8}>
      <Suspense fallback={
        <mesh>
          <icosahedronGeometry args={[1.2, 1]} />
          <meshStandardMaterial color={color} wireframe emissive={color} emissiveIntensity={0.4} transparent opacity={0.3} />
        </mesh>
      }>
        {isPdb ? (
          <PDBModel fileName={fileName} color={color} modelScale={customScale} />
        ) : (
          <CustomModel fileName={fileName} color={color} modelScale={customScale} />
        )}
      </Suspense>
    </group>
  );
}

function Scene3D({ selected }: { selected: string }) {
  return (
    <Canvas
      className="w-full h-full"
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
    >
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 10, 5]} intensity={2} castShadow />
      <spotLight position={[0, 15, 10]} angle={0.2} intensity={1.5} />
      <gridHelper args={[25, 25, '#0a0a0a', '#1a1a1a']} rotation-x={-Math.PI / 2} position-y={-2.5} />
      <Hologram substanceId={selected} />
      <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={0.8} />
      <Environment preset="city" />
    </Canvas>
  );
}

export default function Home() {
  const [selected, setSelected] = useState(substances[0]);

  return (
    <main className="h-screen w-screen flex overflow-hidden font-mono bg-black relative [background-image:radial-gradient(circle_at_30%_30%,rgba(0,255,255,0.12)_0%,transparent_50%),radial-gradient(circle_at_70%_70%,rgba(255,0,150,0.08)_0%,transparent_50%),linear-gradient(45deg,rgba(0,255,255,0.03)_0%,transparent_100%)]">
      {/* Scanlines overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,255,0.02)_2px,rgba(0,255,255,0.02)_4px)] [mask-image:linear-gradient(90deg,rgba(0,0,0,0)_0%,black_25%,black_75%,rgba(0,0,0,0)_100%)]"></div>

      {/* Left Panel */}
      <aside className="w-80 p-8 backdrop-blur-xl bg-black/60 border-r-2 border-cyan-900/70 shadow-2xl shadow-cyan-900/50 hover:shadow-cyan-500/70 transition-all duration-500 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent" />
        <header className="relative z-10 mb-12">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">
            ALL-IN LETALE
          </h1>
          <p className="text-cyan-300 font-mono text-sm mt-2 opacity-80">[ ANALYSIS TERMINAL v2.1 ]</p>
        </header>
        <nav className="space-y-3">
          {substances.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelected(sub)}
              className={`group w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-[1.02] hover:-translate-y-1 ${
                selected.id === sub.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400 shadow-xl shadow-cyan-500/40 bg-cyan-900/30 text-cyan-200'
                  : 'border-transparent hover:border-cyan-500/50 hover:bg-cyan-900/20 text-neutral-300 hover:text-cyan-200'
              }`}
            >
              <div className="font-mono text-xs uppercase tracking-wider opacity-70 group-hover:opacity-100 mb-1">{sub.id}</div>
              <div className="font-black text-xl">{sub.name}</div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Center 3D */}
      <section className="flex-1 relative isolate">
        <Scene3D selected={selected.id} />
      </section>

      {/* Right Panel */}
      <aside className="w-96 p-8 backdrop-blur-xl bg-black/60 border-l-2 border-cyan-900/70 shadow-2xl shadow-cyan-900/50 hover:shadow-red-500/50 transition-all duration-500 relative z-10 flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent" />
        {selected && (
          <>
            <header className="mb-8 relative z-10">
              <h2 className="text-3xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4">
                [ {selected.name.toUpperCase()} ]
              </h2>
            </header>
            <div className="space-y-6 flex-1 relative z-10 grid gap-4">
              <div className="grid grid-cols-2 gap-4 p-6 bg-gradient-to-b from-neutral-900/50 to-black/70 rounded-2xl border border-yellow-500/40 shadow-lg shadow-yellow-500/20">
                <span className="text-yellow-400 font-mono uppercase text-sm opacity-80">[ LD50 ]</span>
                <span className="font-black text-xl text-orange-400 text-right">{selected.lethalDose}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 p-6 bg-gradient-to-b from-neutral-900/50 to-black/70 rounded-2xl border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                <span className="text-emerald-400 font-mono uppercase text-sm opacity-80">[ CLASS ]</span>
                <span className="font-black text-lg text-emerald-300 text-right">{selected.class}</span>
              </div>
              <div className="p-6 bg-gradient-to-b from-red-900/70 to-red-900/90 rounded-2xl border-2 border-red-500/70 shadow-2xl shadow-red-500/40 text-sm leading-tight">
                <span className="text-red-400 font-mono uppercase block mb-2 opacity-90">[ RISKS ]</span>
                <span className="font-bold text-red-200 leading-relaxed">{selected.risks}</span>
              </div>
            </div>
            <div className="mt-12 relative z-10">
              <Link href={selected.deepLink} className="block w-full py-6 px-8 bg-transparent border-4 border-cyan-400 rounded-2xl text-2xl font-black uppercase tracking-wider text-cyan-400 hover:bg-cyan-400 hover:text-black hover:shadow-2xl hover:shadow-cyan-400/50 hover:scale-[1.05] hover:rotate-1 transition-all duration-300 group">
                [ SCOPRI DI PIÙ // DEEP ANALYSIS ]
                <span className="block text-xs font-mono opacity-75 mt-1 group-hover:animate-pulse">ENTER DANGER ZONE</span>
              </Link>
            </div>
          </>
        )}
      </aside>
    </main>
  );
}
