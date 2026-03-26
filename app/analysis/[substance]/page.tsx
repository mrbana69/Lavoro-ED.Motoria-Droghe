/// <reference types="@react-three/fiber" />
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
    intro: "L'empatogeno che consuma le riserve chimiche del cervello, trasformando l'euforia in neurotossicità termica.",
    heroVisual: 'Cristalli polimorfi ambrati o pillole pressate ad alta densità. Sotto la superficie, un potente alteratore del sistema nervoso autonomo.',
    fullDescription: `La 3,4-metilenediossimetanfetamina (MDMA) è una molecola sintetica appartenente alla classe delle anfetamine sostituite. Agisce come un potente empatogeno-entactogeno, dissolvendo le barriere sociali, ma imponendo un costo biologico estremo.
    
Farmacodinamicia: L'MDMA inverte la direzione dei trasportatori della serotonina (SERT), forzando un rilascio massivo e innaturale di serotonina (5-HT) nello spazio sinaptico. Causa inoltre il rilascio di dopamina, noradrenalina e ossitocina, responsabile del caratteristico senso di "connessione umana".
    
Neurotossicità: Il metabolismo dell'MDMA genera radicali liberi altamente reattivi. Quando le riserve di serotonina si esauriscono, la dopamina viene assorbita nei terminali serotoninergici, dove viene ossidata, causando stress ossidativo e danni a lungo termine agli assoni.
    
Crisi Termoregolatoria: Compromette la capacità dell'ipotalamo di regolare la temperatura corporea, impedendo la dissipazione del calore.`,
    effects: 'Euforia travolgente (durata 3-5h), acuta empatia, iper-sensibilità tattile e uditiva, stimolazione motoria, nistagmo (vibrazione oculare rapida), bruxismo acuto (tensione mascellare estrema).',
    acuteRisks: 'Sindrome serotoninergica letale, ipertermia maligna (>42°C), iponatriemia acuta (diluizione fatale del sodio nel sangue dovuta a ipersecrezione di ormone antidiuretico e assunzione eccessiva di acqua), coagulazione intravascolare disseminata (CID).',
    chronicRisks: 'Down-regulation cronica dei recettori 5-HT2, deficit irreversibili della memoria a breve termine, disturbo depressivo maggiore indotto da sostanze, anedonia persistente.',
    ld50: '500-1000mg (orale). Tuttavia, la letalità è spesso indipendente dalla dose: la morte sopraggiunge tipicamente per colpi di calore o edema cerebrale da iponatriemia.',
    stats: { purityRisk: 78, adulterants: 'PMMA (inibitore MAO ritardato, mortalità altissima), Catinoni sintetici (Sali da bagno)', detectionKit: 'Marquis (da viola a nero in 2 sec), Simon\'s (blu cobalto)' },
    prevention: 'Regola l\'assunzione di liquidi (max 500ml/ora se attivi, 250ml se a riposo). Elettroliti essenziali. Evitare TASSATIVAMENTE l\'uso combinato con SSRI, SNRI o MAO-inibitori.'
  },
  cocaine: {
    name: 'Cocaina (Neve / Charlie)',
    intro: "Lo stimolante cardiotossico che forza il sistema vascolare oltre i limiti della tolleranza umana.",
    heroVisual: 'Polvere microcristallina bianca. Un anestetico locale trasformato in un detonatore cardiovascolare.',
    fullDescription: `L'alcaloide tropanico estratto dalle foglie di *Erythroxylum coca*. La cocaina è il prototipo degli stimolanti ad azione rapida, caratterizzata da un altissimo potenziale di abuso e da una tossicità sistemica acuta.
    
Farmacodinamicia: Agisce come un inibitore non selettivo della ricaptazione delle monoamine. Bloccando i trasportatori DAT, NET e SERT, provoca un accumulo tossico di dopamina e noradrenalina nelle sinapsi, scatenando la risposta "fight or flight" a livelli insostenibili.
    
Cardiotossicità Diretta: Blocca i canali del sodio voltaggio-dipendenti nel muscolo cardiaco, alterando la conduzione elettrica. Questo prolunga l'intervallo QRS ed espone a fibrillazione ventricolare improvvisa.
    
Cocaetilene: Se assunta con alcol, il fegato esegue una transesterificazione producendo "Cocaetilene", un metabolita il 30% più tossico per il cuore e con un'emivita molto più lunga della cocaina stessa.`,
    effects: 'Rush euforico fulmineo (durata 15-45 min), ipervigilanza paranoica, tachicardia marcata, vasocostrizione periferica, anestesia locale delle mucose, soppressione totale della fatica e dell\'appetito.',
    acuteRisks: 'Infarto miocardico acuto (anche al primo utilizzo in soggetti sani), vasospasmo coronarico, dissecazione aortica, ictus ischemico da picco ipertensivo, convulsioni tonico-cloniche.',
    chronicRisks: 'Necrosi ischemica del setto nasale, ipertrofia ventricolare sinistra, psicosi tossica (delirio paranoide, allucinazioni tattili o "cimici da cocaina"), anedonia severa strutturale.',
    ld50: 'Approssimativamente 1-1.5g per un adulto. Arresti cardiaci documentati a 200mg. Il fumo di base libera (Crack) abbatte il tempo di onset a 8 secondi, decuplicando il rischio di overdose.',
    stats: { purityRisk: 92, adulterants: 'Levamisolo (agranulocitosi e necrosi cutanea), Benzocaina, Fentanyl (cross-contamination)', detectionKit: 'Morris (blu brillante), Scott Reagent (blu turchese)' },
    prevention: 'L\'uso concomitante di betabloccanti in caso di emergenza medica è controindicato (peggiora il vasospasmo). Evitare alcol. Monitorare parametri vitali cardiovascolari.'
  },
  fentanyl: {
    name: 'Fentanyl (China White / Apache)',
    intro: "Il sedativo sintetico micro-dosato: l'interruttore definitivo del sistema respiratorio.",
    heroVisual: 'Polvere impalpabile o compresse contraffatte. Una quantità equivalente a due granelli di sale definisce il confine tra la vita e la morte.',
    fullDescription: `Un oppioide sintetico derivato dalla fenilpiperidina. Sviluppato per la gestione del dolore oncologico terminale o per l'anestesia chirurgica profonda, la sua potenza è 50-100 volte superiore alla morfina e 50 volte superiore all'eroina.
    
Farmacodinamicia: Agonista altamente selettivo e potente dei recettori oppioidi Mu (μ-1 e μ-2). La sua estrema lipofilia gli permette di attraversare la barriera emato-encefalica in pochi secondi, inondando i recettori del tronco encefalico che controllano la respirazione automatica.
    
L'Effetto "Chocolate Chip Cookie": Nelle pillole contraffatte prodotte clandestinamente, il Fentanyl non è distribuito uniformemente. Una singola pillola (es. finto Xanax o Oxycodone) può contenere zero Fentanyl, mentre la pillola successiva dello stesso lotto può contenerne una dose letale di 3mg.
    
Sindrome del Torace di Legno: Una reazione acuta al Fentanyl che causa la paralisi spastica e la rigidità dei muscoli della parete toracica e del diaframma, rendendo meccanicamente impossibile la ventilazione (sia spontanea che tramite rianimazione artificiale) fino alla somministrazione dell'antidoto.`,
    effects: 'Analgesia profonda e immediata, sedazione pesante (nodding), miosi estrema (pupille a spillo), bradicardia, sensazione di distacco e calore, depressione respiratoria istantanea.',
    acuteRisks: 'Apnea centrale (arresto del comando respiratorio dal cervello), ipossia fulminante, cianosi, edema polmonare non cardiogeno, morte cerebrale in 3-5 minuti.',
    chronicRisks: 'Tolleranza massiva e rapidissima, sindrome da astinenza oppioide severa e debilitante, deterioramento della materia bianca cerebrale da ipossia cronica minore.',
    ld50: '2 milligrammi (2000 microgrammi) in soggetti non tolleranti. L\'analogo Carfentanil è letale in dosi di soli 20 microgrammi.',
    stats: { purityRisk: 99, adulterants: 'Xilazina ("Tranq" - anestetico veterinario che causa necrosi necrotizzante, non risponde al Naloxone)', detectionKit: 'Immunoassay Test Strips (altamente sensibili)' },
    prevention: 'Il Naloxone (Narcan) spray nasale o iniettabile deve essere immediatamente disponibile. In caso di overdose da Fentanyl, potrebbero essere necessarie dosi multiple di Naloxone per ripristinare il respiro.'
  },
  lsd: {
    name: 'LSD-25 (Acido / Trip)',
    intro: "L'architetto del caos cognitivo che smantella la struttura della realtà a livello molecolare.",
    heroVisual: 'Matrici di carta assorbente con arte frattale. Un vettore di distorsione quantistica della coscienza.',
    fullDescription: `La dietilammide dell'acido lisergico è una molecola semisintetica derivata dagli alcaloidi della segale cornuta. È tra le sostanze psicotrope più potenti conosciute dall'umanità, attiva nell'ordine dei milionesimi di grammo (microgrammi).
    
Farmacodinamicia: L'LSD agisce come un agonista parziale complesso, legandosi principalmente ai recettori serotoninergici 5-HT2A nella corteccia prefrontale. La molecola si incastra nel recettore e lo "sigilla" temporaneamente, prolungando l'attivazione cellulare per ore.
    
Collasso del Default Mode Network (DMN): L'LSD sopprime temporaneamente l'attività del DMN, la rete cerebrale responsabile della percezione dell'Ego, dell'identità personale e dei filtri sensoriali. Questo causa l'"Ego Death" (dissoluzione dell'ego) e permette alle aree del cervello normalmente isolate di comunicare tra loro, generando sinestesia e visioni frattali.
    
Impatto Fisiologico: Sorprendentemente, l'LSD ha una tossicità fisica trascurabile. Non causa danni agli organi interni né distrugge i neuroni. Il vero rischio è interamente confinato alla stabilità psichica.`,
    effects: 'Allucinazioni visive complesse (patterning, breathing walls), sinestesia (es. vedere i suoni), alterazione drastica dello scorrere del tempo, iper-connettività concettuale, dissoluzione dei confini tra il Sé e l\'universo.',
    acuteRisks: 'Crisi di panico severo ("Bad Trip"), paranoia estrema, comportamenti autolesionistici accidentali dovuti alla dissociazione ambientale, tachicardia simpatica transitoria.',
    chronicRisks: 'HPPD (Disturbo Persistente della Percezione Allucinatoria - flashback visivi a mesi di distanza), slatentizzazione di disturbi psichiatrici latenti (schizofrenia, bipolarismo) in soggetti geneticamente predisposti.',
    ld50: 'Non esiste una dose letale (LD50) nota per gli esseri umani. Si stima sia superiore a 14.000 microgrammi (140 volte una dose standard attiva).',
    stats: { purityRisk: 65, adulterants: 'NBOMe, DOx (psichedelici altamente vasocostrittori e letali ad alte dosi, caratterizzati da sapore metallico e intorpidimento della lingua)', detectionKit: 'Ehrlich (conferma la struttura indoloca - diventa viola), Hofmann' },
    prevention: 'Regola aurea: "If it\'s bitter, it\'s a spitter" (LSD puro è insapore). L\'ambiente psicologico (Set) e fisico (Setting) determinano l\'esito dell\'esperienza. Antipsicotici o benzodiazepine possono interrompere o mitigare il "trip".'
  },
  alcol: {
    name: 'Alcol (Etanolo)',
    intro: "Il solvente cellulare legalizzato che spegne il sistema nervoso e avvelena il fegato.",
    heroVisual: 'Liquido chiaro, distillato o fermentato. Una tossina sistemica accettata globalmente.',
    fullDescription: `L'etanolo è una molecola psicoattiva semplice ma devastante. Nonostante l'integrazione culturale, clinicamente è classificato come un anestetico generale, un depressore del SNC e una tossina cellulare multisistemica.
    
Farmacodinamicia: L'etanolo ha una complessa azione multi-target. Agisce come modulatore allosterico positivo dei recettori GABA-A (amplificando l'inibizione neurale, causando sedazione) e come antagonista dei recettori NMDA del glutammato (bloccando l'eccitazione e compromettendo la formazione di nuove memorie, causando i "blackout").
    
Cinetica di Ordine Zero: A differenza della maggior parte delle droghe, l'alcol viene metabolizzato dal fegato a un tasso costante e fisso (circa 1 unità all'ora), indipendentemente da quanto se ne assume. Questo permette accumuli tossici fulminei nel sangue se bevuto rapidamente.
    
Tossicità Metabolica: L'enzima alcol deidrogenasi converte l'etanolo in Acetaldeide, una neurotossina altamente reattiva e un noto agente cancerogeno (Gruppo 1 IARC), responsabile dei danni al DNA cellulare e dei sintomi fisici post-intossicazione (hangover).`,
    effects: 'Inibizione della corteccia prefrontale (perdita del controllo degli impulsi), sedazione progressiva, analgesia minore, atassia (incoordinazione cerebellare motoria), disartria (difficoltà di parola), nistagmo.',
    acuteRisks: 'Depressione respiratoria fatale bulbare, coma etilico, ipoglicemia acuta, soffocamento da aspirazione di materiale gastrico (emesi), ipotermia indotta dalla vasodilatazione periferica illusionale.',
    chronicRisks: 'Steatosi, epatite e cirrosi epatica irreversibile, Sindrome di Wernicke-Korsakoff (demenza grave da carenza di tiamina indotta dall\'alcol), pancreatite cronica, atrofia corticale cerebrale, dipendenza fisica profonda.',
    ld50: 'Concentrazione Alcolemica (BAC) del 0.40% - 0.50% induce paralisi respiratoria e morte in soggetti non cronicamente tolleranti.',
    stats: { purityRisk: 5, adulterants: 'Metanolo (metabolizzato in formaldeide e acido formico, distrugge il nervo ottico causando cecità irreversibile e morte)', detectionKit: 'Etilometro a celle a combustibile, Gas Cromatografia' },
    prevention: 'La crisi d\'astinenza da alcol in alcolisti cronici (Delirium Tremens) è un\'emergenza medica letale che causa convulsioni continue; richiede disintossicazione assistita con benzodiazepine. Mai mischiare con oppioidi o sedativi.'
  },
  pcp: {
    name: 'PCP (Angel Dust / Polvere d\'Angelo)',
    intro: "Il disconnettore neurale assoluto che oblitera il dolore e recide ogni legame con la realtà.",
    heroVisual: 'Cristalli traslucidi o polveri granulari. L\'interfaccia chimica verso la catatonia e il delirio di onnipotenza.',
    fullDescription: `La Fenciclidina (PCP) è una sostanza sintetica originariamente sviluppata dalla Parke-Davis nel 1956 come anestetico chirurgico endovenoso, per poi essere scartata a causa di emergenze post-operatorie incontrollabili caratterizzate da estrema agitazione e deliri psicotici nei pazienti in fase di risveglio.
    
Farmacodinamicia: È il capostipite degli anestetici dissociativi. Funziona principalmente bloccando fisicamente i canali ionici dei recettori NMDA, tagliando fuori i segnali eccitatori del glutammato. Questo disconnette la corteccia cerebrale (la mente cosciente) dal talamo (il centro di smistamento del dolore e degli stimoli sensoriali).
    
Effetti sui Recettori Sigma e D2: Oltre all'NMDA, la PCP agisce come potente agonista dei recettori Sigma-1 e inibisce la ricaptazione della dopamina. Questo profilo farmacologico unico genera non solo anestesia, ma psicosi schizofrenica acuta, deliri di grandezza e forza fisica inibita.
    
L'Assenza di Feedback Meccanico: La caratteristica più pericolosa della PCP è la totale soppressione del segnale di allarme del corpo (il dolore). Gli individui sotto effetto possono subire traumi contusivi, rottura di ossa o strappi muscolari massicci continuando ad attaccare o a muoversi senza avvertire alcuna limitazione fisiologica.`,
    effects: 'Anestesia profonda dissociativa (il soggetto sente di non avere un corpo), catatonia alternata a improvvise esplosioni di pura energia motoria, rigidità muscolare, amnesia retrograda, allucinazioni tattili e visive bizzarre.',
    acuteRisks: 'Rabdomiolisi fulminante (i muscoli lavorano fino a distruggersi, rilasciando mioglobina che ostruisce e distrugge i reni), psicosi iperaggressiva, convulsioni continue (status epilepticus), arresto cardiaco da sforzo estremo.',
    chronicRisks: 'Sviluppo di schizofrenia persistente non responsiva ai farmaci, compromissione catastrofica della memoria spaziale e semantica, alterazioni croniche della personalità e del linguaggio.',
    ld50: 'Circa 1 mg/kg. Le fatalità chimiche dirette sono rare; la stragrande maggioranza dei decessi legati alla PCP deriva da incidenti mortali, annegamenti, comportamenti autolesionisti estremi o interventi letali delle forze dell\'ordine per fermare soggetti in delirio aggressivo incontrollabile.',
    stats: { purityRisk: 80, adulterants: 'Ketamina (un analogo più sicuro e breve), Precursori di sintesi tossici derivati da laboratori clandestini', detectionKit: 'Reagente di Mandelin, Marquis' },
    prevention: 'Non esiste un vero antidoto molecolare. La gestione ospedaliera richiede contenimento fisico estremo, isolamento sensoriale totale (stanza buia e silenziosa) e massiccia sedazione chimica (aloperidolo e benzodiazepine ad alto dosaggio) per disinnescare la crisi psicotica.'
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
        <lineSegments>
          <primitive object={pdb.geometryBonds} attach="geometry" />
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
                <Skull className="w-5 h-5 lg:w-6 lg:h-6" /> [ DOSE LETALE (LD50) ]
              </h3>
              <div className="text-xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent break-words md:w-2/3 md:text-right">
                {data.ld50}
              </div>
            </div>
            <div className="group flex flex-col md:flex-row md:items-center justify-between p-6 lg:p-8 bg-neutral-900/50 backdrop-blur-xl rounded-3xl border-2 border-gradient-to-r from-emerald-500/40 hover:from-emerald-400/60 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/50">
              <h3 className="font-mono uppercase text-emerald-400 mb-2 md:mb-0 text-sm lg:text-lg tracking-wider opacity-80 group-hover:opacity-100 md:w-1/3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6" /> [ RISCHIO DI PUREZZA ]
              </h3>
              <div className="text-xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent break-words md:w-2/3 md:text-right">
                {data.stats.purityRisk}%
              </div>
            </div>
            <div className="group flex flex-col md:flex-row md:items-center justify-between p-6 lg:p-8 bg-neutral-900/50 backdrop-blur-xl rounded-3xl border-2 border-gradient-to-r from-red-500/40 hover:from-red-400/60 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-500/50">
              <h3 className="font-mono uppercase text-red-400 mb-2 md:mb-0 text-sm lg:text-lg tracking-wider opacity-80 group-hover:opacity-100 md:w-1/3 flex items-center gap-3">
                <TestTubes className="w-5 h-5 lg:w-6 lg:h-6" /> [ ADULTERANTI COMUNI ]
              </h3>
              <div className="text-lg md:text-2xl lg:text-3xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent break-words md:w-2/3 md:text-right">
                {data.stats.adulterants}
              </div>
            </div>
            <div className="group flex flex-col md:flex-row md:items-center justify-between p-6 lg:p-8 bg-neutral-900/50 backdrop-blur-xl rounded-3xl border-2 border-gradient-to-r from-purple-500/40 hover:from-purple-400/60 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/50">
              <h3 className="font-mono uppercase text-purple-400 mb-2 md:mb-0 text-sm lg:text-lg tracking-wider opacity-80 group-hover:opacity-100 md:w-1/3 flex items-center gap-3">
                <Search className="w-5 h-5 lg:w-6 lg:h-6" /> [ KIT DI RILEVAMENTO ]
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
            <h3 className="text-4xl font-black text-emerald-300 mb-8 uppercase tracking-tight">[ EFFETTI ]</h3>
            <ul className="space-y-6 text-xl text-emerald-200 leading-relaxed">
              {data.effects.split(/, (?![^()]*\))/).map((effect, i) => (
                <li key={i} className="flex items-center pl-8 relative before:absolute before:left-0 before:w-1 before:h-1 before:bg-gradient-to-b before:from-emerald-400 before:rounded-full before:shadow-md">
                  {effect.trim()}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 p-8 lg:p-12 bg-neutral-900/70 backdrop-blur-xl rounded-3xl border-4 border-gradient-to-r from-red-500/60 border-red-400 shadow-2xl shadow-red-500/40">
            <h3 className="text-4xl font-black text-red-300 mb-8 uppercase tracking-tight">[ RISCHI ]</h3>
            <ul className="space-y-6 text-xl text-red-200 leading-relaxed">
              {`${data.acuteRisks}, ${data.chronicRisks}`.split(/, (?![^()]*\))/).map((risk, i) => (
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
            TORNA INDIETRO
          </Link>
        </div>
      </section>
    </main>
  );
}
