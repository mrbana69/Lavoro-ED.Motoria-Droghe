'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import { useRef, Suspense, useMemo } from 'react';
import { PDBLoader } from 'three/examples/jsm/loaders/PDBLoader';
import { Skull, AlertTriangle, TestTubes, Search } from 'lucide-react';

const substanceData = {
  mdma: {
    name: 'MDMA (Ecstasy / Molly)',
    intro: "Il mostro dell'euforia che uccide con il calore del tuo cuore.",
    heroVisual: 'Cristalli trasparenti che sembrano innocui sotto la luce UV.',
    fullDescription: `La MDMA, nota come Ecstasy o Molly, è un empatogeno sintetico che altera radicalmente la percezione sociale e sensoriale. Crea un'intensa sensazione di connessione emotiva e euforia, ma nasconde una letalità subdola.
    
**Farmacologia**: La MDMA rilascia massicce quantità di serotonina, dopamina e noradrenalina, causando un "crollo" post-uso devastante.
    
**Street Form**: Pillole colorate con loghi (es. smiley, diamante), cristalli puri ("crystal"), liquidi.
    
**Contaminazioni Comuni**: PMA, methamphetamine, ketamina (falsi positivi nei test).
    
**Riconoscimento**: Sotto luce nera le pillole fluorescenti. Cristalli trasparenti in bustine.`,
    effects: 'Euforia intensa (1-2h), aumento empatia/tattilità, energia travolgente, grinding mascellare, sudorazione profusa, disidratazione.',
    acuteRisks: 'Ipertermia (>42°C), rabdomiolisi (rottura muscolare), collasso renale, ictus serotoninergico.',
    chronicRisks: 'Depressione post-MDMA (suicidio), danno cardiaco permanente, dipendenza psicologica.',
    ld50: '500-1000mg (orale). Morti da 300mg in ambienti rave.',
    stats: { purityRisk: 78, adulterants: 'PMA/PMMA (mortalmente tossici)', detectionKit: 'Marquis (viola/nero), Mecke (viola scuro)' },
    prevention: 'Idratazione forzata KILLS. Testa sempre. No mixing con alcol/antidepressivi. Ambiente fresco essenziale.'
  },
  cocaine: {
    name: 'Cocaine (Cocaína / Charlie)',
    intro: "Il re degli stimolanti che brucia il tuo cuore in una sola linea.",
    heroVisual: 'Polvere bianca finissima che riflette la luce come neve pura.',
    fullDescription: `La cocaina è l'alcaloide principe della pianta di coca, usata da millenni ma industrializzata nel 1860 come anestetico locale.
    
**Farmacologia**: Blocca il reuptake di dopamina, causando un "high" esplosivo ma brevissimo (15-30 min).
    
**Forme**: Polvere per sniffare, "crack" fumabile, iniettabile.
    
**Street Purity**: 20-80% tagliata con lidocaina, procaina, levamisole (causa necrosi).
    
**Riconoscimento**: Brucia con fiamma gialla pulita. Odore chimico caratteristico.`,
    effects: 'Euforia esplosiva, ipervigilanza, parlantina incessante, midriasi, appetito zero.',
    acuteRisks: 'Infarto miocardico, aritmie ventricolari fatali, stroke emorragico, crisi ipertensiva.',
    chronicRisks: 'Perforazione setto nasale, dipendenza catastrofica, psicosi paranoide.',
    ld50: '1-2g acute. Morti per overdose da 200mg in cuori predisposti.',
    stats: { purityRisk: 92, adulterants: 'Levamisole (immunosoppressivo), fenacetina (cancerogena)', detectionKit: 'Morris (blu), Liebermann (viola)' },
    prevention: 'Mai sniffare >50mg. No mixing MAOI/alcool. Monitora pressione. Cutaneous necrosis = levamisole.'
  },
  fentanyl: {
    name: 'Fentanyl (China White / Apache)',
    intro: "L'assassino invisibile. 2mg bastano per fermare il tuo respiro per sempre.",
    heroVisual: 'Cerotti medici trasparenti o polvere bianca identica all eroina.',
    fullDescription: `Fentanyl è un opioide sintetico creato negli anni '60 come anestetico chirurgico. È 50-100 volte più potente dell'eroina.
    
**Farmacologia**: Agonista μ-oppioidi. Onset respiratorio 2-5 minuti.
    
**Street**: Laced in eroina, xanax, cocaina senza sapere. Cerotti rubati.
    
**Contaminazione**: Non testabile con kit standard eroina.
    
**Riconoscimento**: Odore chimico dolce. Cerotti bucherellati.`,
    effects: 'Sedazione totale, analgesia estrema, nodo respiratorio.',
    acuteRisks: 'Arresto respiratorio completo, rigidità cadaverica, morte in minuti.',
    chronicRisks: 'Dipendenza immediata, overdose cronica.',
    ld50: '2mg trasdermico, 25μg fentanyl puro.',
    stats: { purityRisk: 98, adulterants: 'Eroina/xanax lacing', detectionKit: 'Fentanyl test strips OBBLIGATORI' },
    prevention: 'NON USARE pillole/xanax/eroina da strada. Test strips everywhere. Naloxone kit pronto.'
  },
  lsd: {
    name: 'LSD-25 (Acid / blotter)',
    intro: "Il portale psichedelico che può frantumare la tua mente per sempre.",
    heroVisual: 'Cartoncini perforati con stampe artistiche/psichedeliche.',
    fullDescription: `LSD (Lisergamide) sintetizzato da Albert Hofmann nel 1943. La sostanza psichedelica più potente conosciuta.
    
**Farmacologia**: Agonista 5-HT2A serotoninergico. 8-12 ore di viaggio.
    
**Dosaggio**: 100μg soglia, 200μg standard, 500μg+ strong.
    
**Street**: Blotter paper, liquidi, microdots, gel tabs.
    
**Contaminazioni**: NBOMe (mortalmente tossico), DOI.`,
    effects: 'Sinestesia, geometrie, ego death, time dilation, insights profondi.',
    acuteRisks: 'Bad trip (panico/terror), sincope, ipertensione transitoria.',
    chronicRisks: 'Flashback HPPD (Hallucinogen Persisting Perception Disorder), psicosi in predisposti.',
    ld50: 'Sconosciuta (>10.000μg). Fisicamente sicuro.',
    stats: { purityRisk: 65, adulterants: 'NBOMe (testa con Ehrlich)', detectionKit: 'Ehrlich (viola), Marquis (nessuna reazione)' },
    prevention: 'Set & setting. No mixing MAOI/antipsicotici. Test reagent. Trip sitter.'
  },
  alcol: {
    name: 'Alcol (Etanolo)',
    intro: "Il depressore di massa che soffoca il corpo e annebbia il giudizio.",
    heroVisual: 'Liquido dorato traslucido in bottiglie commerciali.',
    fullDescription: `L'alcol etilico è una sostanza psicoattiva legale e ampiamente diffusa, ma rappresenta una delle principali cause di tossicità sistemica e declino neurologico cronico.
    
**Farmacologia**: Potente depressore del sistema nervoso centrale. Amplifica il GABA (inibitorio) e sopprime il glutammato.
    
**Assorbimento**: Assorbito rapidamente dallo stomaco, processato dal fegato in acetaldeide, un sottoprodotto altamente tossico.
    
**Forme**: Distillati, fermentati, superalcolici (es. Whiskey).
    
**Pericoli Silenziosi**: Danni epatici progressivi e potenziale letale enorme in combinazione con altri sedativi.`,
    effects: 'Rilassamento estremo, disinibizione motoria e verbale, euforia iniziale seguita da profonda sedazione, atassia.',
    acuteRisks: 'Coma etilico, arresto respiratorio, soffocamento da emesi (vomito), blackout della memoria a breve termine.',
    chronicRisks: 'Cirrosi epatica irreversibile, cardiomiopatia, atrofia cerebrale, dipendenza fisica severa (Delirium Tremens).',
    ld50: '0.40% - 0.50% BAC (Concentrazione sanguigna) può essere letale per adulti sani.',
    stats: { purityRisk: 5, adulterants: 'Metanolo (in distillazioni clandestine/fake)', detectionKit: 'Etilometro (Breathalyzer)' },
    prevention: 'Non combinare MAI con farmaci o altre droghe (rischio arresto respiratorio). Idratazione costante. Limitare le dosi.'
  },
  pcp: {
    name: 'PCP (Angel Dust / Polvere d\'Angelo)',
    intro: "Il dissociativo che recide i fili del dolore e della sanità mentale.",
    heroVisual: 'Cristalli chimici pungenti o liquido ambrato su materia vegetale.',
    fullDescription: `La fenciclidina (PCP) è nata negli anni '50 come anestetico endovenoso, per poi essere scartata a causa delle gravissime reazioni psicotiche post-operatorie nei pazienti.
    
**Farmacologia**: Potente antagonista del recettore NMDA del glutammato. Causa disconnessione totale dal sensorio.
    
**Street Form**: Spesso spruzzata su erba o sigarette (chiamata "Wet" o "Sherm"), cristalli o polvere sniffabile.
    
**Il Pericolo del Dolore**: Blocca totalmente la percezione del dolore fisico. Gli individui sotto effetto possono subire o causare traumi catastrofici senza accorgersene.`,
    effects: 'Analgesia estrema, grave dissociazione dalla realtà, forza corporea indotta (dall\'assenza di dolore), allucinazioni distorte.',
    acuteRisks: 'Psicosi violenta incontrollabile, convulsioni, rabdomiolisi (necrosi muscolare estesa), arresto cardiaco.',
    chronicRisks: 'Danni permanenti alla memoria, schizofrenia indotta a lungo termine, disturbi profondi del linguaggio.',
    ld50: '1-3 mg/kg. Le fatalità avvengono molto più spesso per incidenti fisici o lesioni autoinflitte.',
    stats: { purityRisk: 80, adulterants: 'Ketamina, PCC (precursore tossico non processato)', detectionKit: 'Mandelin, Liebermann' },
    prevention: 'Altamente sconsigliato l\'uso umano. Se un soggetto è in overdose/delirio richiede sedazione medica immediata e professionale.'
  }
};

interface Props {
  params: { substance: string };
}

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
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color={color} transparent opacity={0.8} emissive={color} emissiveIntensity={0.6} />
        </mesh>
      ))}
      {hasBonds && (
        <lineSegments geometry={pdb.geometryBonds}>
          <lineBasicMaterial color={color} transparent opacity={0.4} />
        </lineSegments>
      )}
    </Center>
  );
}

function HologramModel({ substance }: { substance: string }) {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.6;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.3;
    }
  });

  const colors = {
    mdma: '#ff4081',
    cocaine: '#ffffff',
    cocaina: '#ffffff',
    fentanyl: '#4caf50',
    lsd: '#9c27b0',
    alcol: '#ffb300',
    pcp: '#cddc39'
  };
  const color = colors[substance as keyof typeof colors] || '#00ffff';

  // Mappatura per i nomi dei file 3D che non corrispondono alla rotta URL
  const fileMap: Record<string, string> = {
    alcol: 'ethanol',
    cocaina: 'cocaine', // Fallback incrociato
  };
  const fileName = fileMap[substance] || substance;

  // Mappatura per modificare la grandezza solo di specifici modelli
  const customScale = substance === 'lsd' ? 0.05 : 1;

  const isPdb = ['mdma', 'cocaine', 'cocaina', 'ethanol', 'fentanyl', 'pcp'].includes(fileName);

  return (
    <group ref={groupRef} scale={2.2}>
      <Suspense fallback={
        // Mostra la vecchia sfera geometrica mentre il modello 3D viene scaricato
        <mesh>
          <icosahedronGeometry args={[0.9, 1]} />
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

export default function AnalysisPage({ params }: Props) {
  const substance = params.substance.toLowerCase();
  const data = substanceData[substance as keyof typeof substanceData];

  if (!data) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-neutral-900/50 to-black/80 text-white font-mono overflow-hidden relative">
      {/* Fixed 3D Hero */}
      <section className="fixed inset-0 z-10 pointer-events-none blur-[5px]">
        <div className="absolute inset-0 bg-gradient-radial from-cyan-900/20 to-transparent" />
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }} className="w-full h-screen">
          <ambientLight intensity={0.15} />
          <directionalLight position={[5, 10, 5]} intensity={1.0} castShadow />
          <spotLight position={[0, 18, 10]} angle={0.25} penumbra={0.7} intensity={1.0} />
          <gridHelper args={[35, 35, '#0a0a0a', '#1a1a1a']} position-y={-4} rotation-x={-Math.PI / 2} />
          <HologramModel substance={substance} />
          <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.5} autoRotate autoRotateSpeed={0.4} />
          <Environment preset="night" />
        </Canvas>
      </section>

      {/* Scrolling Content - Apple-style */}
      <section className="relative z-20 pt-40 pb-32 px-12 max-w-6xl mx-auto">
        {/* Intro Hero */}
        <div className="text-center mb-32">
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-8 uppercase tracking-tight leading-none">
            {data.intro}
          </h1>
          <div className="text-2xl text-neutral-300 max-w-4xl mx-auto leading-relaxed">{data.heroVisual}</div>
        </div>

        {/* Full Description */}
        <section className="mb-32">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-black text-cyan-300 mb-12 uppercase tracking-tight border-b-4 border-cyan-500/50 pb-8">INTELLIGENCE DOSSIER</h2>
            <div className="prose prose-lg max-w-none text-neutral-200 leading-relaxed space-y-8 text-lg">
              <div dangerouslySetInnerHTML={{ __html: data.fullDescription.replace(/\n/g, '<br/>') }} />
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mb-32">
          <div className="flex flex-col gap-4 lg:gap-6">
            <div className="group flex flex-col md:flex-row md:items-center justify-between p-6 lg:p-8 bg-neutral-900/50 backdrop-blur-xl rounded-3xl border-2 border-gradient-to-r from-yellow-500/40 hover:from-yellow-400/60 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/50">
              <h3 className="font-mono uppercase text-yellow-400 mb-2 md:mb-0 text-sm lg:text-lg tracking-wider opacity-80 group-hover:opacity-100 md:w-1/3 flex items-center gap-3">
                <Skull className="w-5 h-5 lg:w-6 lg:h-6" /> [ LD50 ]
              </h3>
              <div className="text-xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent break-words md:w-2/3 md:text-right">
                {data.ld50}
              </div>
            </div>
            <div className="group flex flex-col md:flex-row md:items-center justify-between p-6 lg:p-8 bg-neutral-900/50 backdrop-blur-xl rounded-3xl border-2 border-gradient-to-r from-emerald-500/40 hover:from-emerald-400/60 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/50">
              <h3 className="font-mono uppercase text-emerald-400 mb-2 md:mb-0 text-sm lg:text-lg tracking-wider opacity-80 group-hover:opacity-100 md:w-1/3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6" /> [ PURITY RISK ]
              </h3>
              <div className="text-xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent break-words md:w-2/3 md:text-right">
                {data.stats.purityRisk}%
              </div>
            </div>
            <div className="group flex flex-col md:flex-row md:items-center justify-between p-6 lg:p-8 bg-neutral-900/50 backdrop-blur-xl rounded-3xl border-2 border-gradient-to-r from-red-500/40 hover:from-red-400/60 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-500/50">
              <h3 className="font-mono uppercase text-red-400 mb-2 md:mb-0 text-sm lg:text-lg tracking-wider opacity-80 group-hover:opacity-100 md:w-1/3 flex items-center gap-3">
                <TestTubes className="w-5 h-5 lg:w-6 lg:h-6" /> [ ADULTERANTS ]
              </h3>
              <div className="text-lg md:text-2xl lg:text-3xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent break-words md:w-2/3 md:text-right">
                {data.stats.adulterants}
              </div>
            </div>
            <div className="group flex flex-col md:flex-row md:items-center justify-between p-6 lg:p-8 bg-neutral-900/50 backdrop-blur-xl rounded-3xl border-2 border-gradient-to-r from-purple-500/40 hover:from-purple-400/60 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/50">
              <h3 className="font-mono uppercase text-purple-400 mb-2 md:mb-0 text-sm lg:text-lg tracking-wider opacity-80 group-hover:opacity-100 md:w-1/3 flex items-center gap-3">
                <Search className="w-5 h-5 lg:w-6 lg:h-6" /> [ DETECTION KIT ]
              </h3>
              <div className="text-lg md:text-2xl lg:text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent break-words md:w-2/3 md:text-right">
                {data.stats.detectionKit}
              </div>
            </div>
          </div>
        </section>

        {/* Effects & Risks */}
        <section className="flex flex-col md:flex-row gap-8 lg:gap-12 mb-32">
          <div className="flex-1 p-8 lg:p-12 bg-neutral-900/70 backdrop-blur-xl rounded-3xl border-4 border-gradient-to-r from-emerald-500/50 border-emerald-400 shadow-2xl shadow-emerald-500/30">
            <h3 className="text-4xl font-black text-emerald-300 mb-8 uppercase tracking-tight">[ EFFECTS ]</h3>
            <ul className="space-y-6 text-xl text-emerald-200 leading-relaxed">
              {data.effects.split(', ').map((effect, i) => (
                <li key={i} className="flex items-center pl-8 relative before:absolute before:left-0 before:w-1 before:h-1 before:bg-gradient-to-b before:from-emerald-400 before:rounded-full before:shadow-md">
                  {effect.trim()}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 p-8 lg:p-12 bg-neutral-900/70 backdrop-blur-xl rounded-3xl border-4 border-gradient-to-r from-red-500/60 border-red-400 shadow-2xl shadow-red-500/40">
            <h3 className="text-4xl font-black text-red-300 mb-8 uppercase tracking-tight">[ TERMINAL RISKS ]</h3>
            <ul className="space-y-6 text-xl text-red-200 leading-relaxed">
              {`${data.acuteRisks}, ${data.chronicRisks}`.split(', ').map((risk, i) => (
                <li key={i} className="flex items-center pl-8 relative before:absolute before:left-0 before:w-1 before:h-1 before:bg-gradient-to-b before:from-red-400 before:rounded-full before:shadow-md">
                  {risk.trim()}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA Back */}
        <div className="text-center pt-24">
          <Link 
            href="/"
            className="inline-block px-16 py-8 bg-gradient-to-r from-cyan-600/90 via-blue-600/90 to-purple-600/90 backdrop-blur-xl border-4 border-gradient-to-r from-cyan-400 to-purple-400 hover:border-cyan-300 hover:shadow-3xl hover:shadow-cyan-400/60 rounded-3xl font-black text-2xl uppercase tracking-widest text-white hover:text-black transition-all duration-500 hover:scale-110 group hover:rotate-3 hover:shadow-glow"
          >
            BACK TO SCANNER [ ALT+F4 ]
          </Link>
        </div>
      </section>
    </main>
  );
}
