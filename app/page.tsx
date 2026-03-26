'use client';

import { useState, useRef, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import { PDBLoader } from 'three/examples/jsm/loaders/PDBLoader';

// ==========================================
// 1. DATABASE SOSTANZE (ITALIANO)
// ==========================================
const substances = [
  { id: 'mdma', name: 'MDMA', class: 'Empatogeno', lethalDose: '500-1000mg', risks: 'Ipertermia letale, neurotossicità acuta, collasso renale da rabdomiolisi, iponatriemia.', deepLink: '/analysis/mdma' },
  { id: 'cocaine', name: 'Cocaina', class: 'Stimolante', lethalDose: '1-1.5g', risks: 'Infarto miocardico acuto, vasospasmo coronarico, ictus ischemico, psicosi paranoide.', deepLink: '/analysis/cocaine' },
  { id: 'fentanyl', name: 'Fentanyl', class: 'Oppioide', lethalDose: '2mg', risks: 'Arresto respiratorio immediato, paralisi toracica, ipossia cerebrale, coma profondo.', deepLink: '/analysis/fentanyl' },
  { id: 'lsd', name: 'LSD', class: 'Psichedelico', lethalDose: 'Sconosciuta', risks: 'Traumi psicologici acuti, dissociazione estrema, slatentizzazione di disturbi psichiatrici.', deepLink: '/analysis/lsd' },
  { id: 'alcol', name: 'Alcol', class: 'Depressore', lethalDose: '0.40% BAC', risks: 'Coma etilico, depressione respiratoria fatale, necrosi epatica irreversibile.', deepLink: '/analysis/alcol' },
  { id: 'pcp', name: 'PCP', class: 'Dissociativo', lethalDose: '1-3 mg/kg', risks: 'Anestesia estrema, delirio iper-aggressivo, traumi fisici auto-indotti senza percezione del dolore.', deepLink: '/analysis/pcp' }
];

// ==========================================
// 2. COMPONENTI MODELLI 3D
// ==========================================

// Modello Standard (GLTF/GLB)
function CustomModel({ fileName, color, modelScale = 1 }: { fileName: string; color: string; modelScale?: number }) {
  const modelPath = fileName === 'lsd' ? `/models/mol/${fileName}.glb` : `/models/${fileName}.glb`;
  const { scene } = useGLTF(modelPath);
  
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

// Modello Molecolare (PDB)
function PDBModel({ fileName, color, modelScale = 1 }: { fileName: string; color: string; modelScale?: number }) {
  const pdb = useLoader(PDBLoader, `/models/mol/${fileName}.pdb`);

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
      {atomPositions.map((pos, index) => (
        <mesh key={index} position={pos}>
          <sphereGeometry args={[0.25, 12, 12]} />
          <meshStandardMaterial color={color} transparent opacity={0.8} emissive={color} emissiveIntensity={0.6} />
        </mesh>
      ))}
      {hasBonds && (
        <lineSegments>
          <primitive object={pdb.geometryBonds} attach="geometry" />
          <lineBasicMaterial color={color} transparent opacity={0.4} />
        </lineSegments>
      )}
    </Center>
  );
}

// Gestore Ologramma e Rotazione
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
    cocaina: 'cocaine',
  };
  const fileName = fileMap[substanceId] || substanceId;
  const customScale = substanceId === 'lsd' ? 0.05 : 1;

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

// Scena 3D Ottimizzata per le prestazioni
function Scene3D({ selected }: { selected: string }) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]} // Ottimizzazione FPS per PC vecchi
        gl={{ 
          antialias: true, 
          toneMapping: THREE.ACESFilmicToneMapping, 
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: "high-performance"
        }}
      >
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} />
        <spotLight position={[0, 15, 10]} angle={0.2} intensity={1} />
        <gridHelper args={[25, 25, '#0a0a0a', '#1a1a1a']} rotation-x={-Math.PI / 2} position-y={-2.5} />
        <Hologram substanceId={selected} />
        <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={0.8} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

// ==========================================
// 3. LAYOUT PRINCIPALE (UI RESPONSIVE)
// ==========================================
export default function Home() {
  const [selected, setSelected] = useState(substances[0]);

  return (
    <main className="h-screen w-screen flex flex-col lg:flex-row overflow-hidden font-mono bg-black relative [background-image:radial-gradient(circle_at_30%_30%,rgba(0,255,255,0.12)_0%,transparent_50%),radial-gradient(circle_at_70%_70%,rgba(255,0,150,0.08)_0%,transparent_50%),linear-gradient(45deg,rgba(0,255,255,0.03)_0%,transparent_100%)]">
      
      {/* Effetto Scanlines e Vignetta */}
      <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,255,0.02)_2px,rgba(0,255,255,0.02)_4px)] [mask-image:linear-gradient(90deg,rgba(0,0,0,0)_0%,black_25%,black_75%,rgba(0,0,0,0)_100%)] z-20"></div>

      {/* PANNELLO DI SINISTRA - Navigazione Sostanze (Responsive + No Scrollbar) */}
      <aside className="w-full lg:w-[25rem] h-auto lg:h-full p-4 lg:p-8 backdrop-blur-xl bg-black/70 border-b-2 lg:border-b-0 lg:border-r-2 border-cyan-900/70 shadow-2xl shadow-cyan-900/50 flex flex-col z-30 flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
        
        <header className="relative z-10 mb-4 lg:mb-12 flex-shrink-0">
          <h1 className="text-2xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg leading-none">
            DATABASE TOSSICOLOGICO
          </h1>
          <p className="text-cyan-300 font-mono text-xs lg:text-sm mt-2 opacity-80">[ TERMINALE DI ANALISI v6.7 ]</p>
        </header>
        
        {/* Contenitore Bottoni - Nasconde la Scrollbar ma permette lo scorrimento */}
        <nav className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {substances.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelected(sub)}
              className={`group w-64 lg:w-full flex-shrink-0 p-4 lg:p-6 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-[1.02] hover:-translate-y-1 ${
                selected.id === sub.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400 shadow-xl shadow-cyan-500/40 bg-cyan-900/30 text-cyan-200'
                  : 'border-transparent hover:border-cyan-500/50 hover:bg-cyan-900/20 text-neutral-300 hover:text-cyan-200'
              }`}
            >
              <div className="font-mono text-[10px] lg:text-xs uppercase tracking-wider opacity-70 group-hover:opacity-100 mb-1">ID: {sub.id}</div>
              <div className="font-black text-lg lg:text-xl">{sub.name}</div>
            </button>
          ))}
        </nav>
      </aside>

      {/* AREA CENTRALE - Visualizzatore 3D */}
      <section className="flex-1 relative min-h-[40vh] lg:min-h-0">
        <Scene3D selected={selected.id} />
      </section>

      {/* PANNELLO DI DESTRA - Dettagli Sostanza (Responsive + No Scrollbar) */}
      <aside className="w-full lg:w-[25rem] h-auto lg:h-full p-6 lg:p-8 backdrop-blur-xl bg-black/70 border-t-2 lg:border-t-0 lg:border-l-2 border-cyan-900/70 shadow-2xl shadow-cyan-900/50 flex flex-col z-30 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
        
        {selected && (
          <div className="flex flex-col h-full justify-between gap-6">
            <div>
              <header className="mb-6 lg:mb-8 relative z-10">
                <h2 className="text-2xl lg:text-3xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-2">
                  [ {selected.name.toUpperCase()} ]
                </h2>
              </header>
              
              <div className="space-y-4 lg:space-y-6 relative z-10 grid gap-2 lg:gap-4">
                <div className="grid grid-cols-2 gap-4 p-4 lg:p-6 bg-gradient-to-b from-neutral-900/80 to-black/90 rounded-2xl border border-yellow-500/40 shadow-lg shadow-yellow-500/20">
                  <span className="text-yellow-400 font-mono uppercase text-xs lg:text-sm opacity-80">[ DOSE LETALE ]</span>
                  <span className="font-black text-lg lg:text-xl text-orange-400 text-right">{selected.lethalDose}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 p-4 lg:p-6 bg-gradient-to-b from-neutral-900/80 to-black/90 rounded-2xl border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                  <span className="text-emerald-400 font-mono uppercase text-xs lg:text-sm opacity-80">[ CLASSE ]</span>
                  <span className="font-black text-md lg:text-lg text-emerald-300 text-right">{selected.class}</span>
                </div>
                
                <div className="p-4 lg:p-6 bg-gradient-to-b from-red-900/80 to-red-950/90 rounded-2xl border-2 border-red-500/70 shadow-2xl shadow-red-500/40 text-sm leading-tight">
                  <span className="text-red-400 font-mono uppercase block mb-2 opacity-90 text-xs lg:text-sm">[ RISCHI CRITICI ]</span>
                  <span className="font-bold text-red-200 leading-relaxed">{selected.risks}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 lg:mt-12 relative z-10 pb-4 lg:pb-0">
              <Link href={selected.deepLink} className="block w-full py-4 lg:py-6 px-4 lg:px-8 bg-black/50 backdrop-blur-md border-2 lg:border-4 border-cyan-400 rounded-2xl text-center lg:text-left text-lg lg:text-2xl font-black uppercase tracking-wider text-cyan-400 hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] hover:scale-[1.02] transition-all duration-300 group">
                <span className="block">[ APRI DOSSIER ]</span>
                <span className="block text-[10px] lg:text-xs font-mono opacity-75 mt-1 lg:mt-2 group-hover:animate-pulse">ACCEDI AI DATI CLASSIFICATI</span>
              </Link>
            </div>
          </div>
        )}
      </aside>
    </main>
  );
}