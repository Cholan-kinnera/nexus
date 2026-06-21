import { useRef, Suspense, useEffect, useState, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Float, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { 
  Shield, 
  Terminal, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  Cpu, 
  Lock, 
  Database,
  Eye,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

// 1. Performance-Optimized 3D Model Loader Component
const WorkspaceModel = memo(function WorkspaceModel() {
  const { scene } = useGLTF('/models/workspace_mesh.glb', true);
  const groupRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mesh = child;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat: THREE.Material) => {
            if (mat && 'map' in mat) {
              (mat as { map: THREE.Texture | null }).map = null;
            }
          });
          mesh.material = new THREE.MeshPhysicalMaterial({
            color: '#ffffff',
            roughness: 0.05,
            metalness: 0.05,
            transparent: true,
            opacity: 0.15,
            transmission: 0.9,
            thickness: 1.5,
            ior: 1.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05
          });
        }
      }
    });
  }, [scene]);

  // Mouse cursor tracking for subtle parallax controls
  useFrame((state) => {
    if (groupRef.current) {
      const targetX = state.pointer.x * 0.12;
      const targetY = state.pointer.y * 0.12;
      
      // Fluid lerp rotation
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX - Math.PI / 8, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY * 0.4, 0.05);
      
      // Floating wave animation blended with cursor elevation
      const time = state.clock.getElapsedTime();
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        -0.5 + Math.sin(time * 1.2) * 0.08 + targetY * 0.08,
        0.05
      );
    }
  });
  
  return (
    <group ref={groupRef}>
      <primitive 
        object={scene} 
        scale={1.4} 
        position={[0, 0, 0]} 
      />
    </group>
  );
});

// 2. Fallback Element to hold structural integrity while the GLB downloads
const MeshFallback = memo(function MeshFallback() {
  return (
    <mesh rotation={[10, 20, 0]}>
      <boxGeometry args={[2, 1.2, 0.1]} />
      <meshStandardMaterial 
        color="#27272a" 
        wireframe 
        transparent 
        opacity={0.3} 
      />
    </mesh>
  );
});

// 3. Dynamic Interactive Mouse-Tracking Background Particle Vector Engine
const FloatingParticles = memo(function FloatingParticles() {
  const pointsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.02;
      pointsRef.current.rotation.x = Math.sin(time * 0.015) * 0.05;
    }
  });

  return (
    <group ref={pointsRef}>
      <Stars 
        radius={120} 
        depth={50} 
        count={800} 
        factor={6} 
        saturation={0.5} 
        fade 
        speed={1.2} 
      />
    </group>
  );
});

// Framer motion spring settings
const revealVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20
    }
  }
};

export default function Landing3D() {
  const [activeAITab, setActiveAITab] = useState<'sprint' | 'tasks' | 'summary' | 'risks'>('sprint');

  // Realistic Kanban Board preview data
  const todoTasks = [
    { id: "NEX-1024", title: "Design System Refactor", priority: "HIGH", assignee: "CK", hours: 8 },
    { id: "NEX-1025", title: "Security Audit Logs", priority: "MEDIUM", assignee: "AM", hours: 6 }
  ];

  const progressTasks = [
    { id: "NEX-1002", title: "AI Task Suggestions Engine", priority: "HIGH", assignee: "CK", hours: 12 },
    { id: "NEX-1033", title: "Database Optimization", priority: "MEDIUM", assignee: "SL", hours: 10 }
  ];

  const reviewTasks = [
    { id: "NEX-1030", title: "API Rate Limiting", priority: "LOW", assignee: "JD", hours: 4 },
    { id: "NEX-1031", title: "Sprint Planning", priority: "MEDIUM", assignee: "AM", hours: 8 }
  ];

  const doneTasks = [
    { id: "NEX-1005", title: "CI/CD Pipeline Setup", priority: "DONE", assignee: "SL", hours: 14 }
  ];

  const priorityColors: Record<string, string> = {
    HIGH: "bg-zinc-950 text-red-400 border-zinc-800",
    MEDIUM: "bg-zinc-950 text-amber-400 border-zinc-800",
    LOW: "bg-zinc-950 text-blue-400 border-zinc-800",
    DONE: "bg-zinc-950 text-emerald-400 border-zinc-800"
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 font-sans overflow-x-hidden selection:bg-violet-500/30">
      
      {/* 🌌 THE FIXED WEBGL 3D CANVAS LAYER */}
      <div className="fixed inset-0 w-full h-screen pointer-events-none z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          {/* Subtle dark fog layer */}
          <fog attach="fog" args={["#09090b", 5, 15]} />

          {/* Subtle Ambient Studio Lighting Studio Array */}
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.8} color="#7c3aed" />
          <pointLight position={[-10, -10, -5]} intensity={0.3} color="#06b6d4" />
          <directionalLight position={[0, 5, 2]} intensity={0.6} color="#ffffff" />
          
          <Suspense fallback={<MeshFallback />}>
            <Float 
              speed={2.5} 
              rotationIntensity={0.4} 
              floatIntensity={0.6} 
              floatingRange={[-0.2, 0.2]}
            >
              <WorkspaceModel />
            </Float>
          </Suspense>

          <FloatingParticles />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            maxPolarAngle={Math.PI / 2} 
            minPolarAngle={Math.PI / 3} 
          />
        </Canvas>
      </div>

      {/* ── FLOATING GLASS HEADER ───────────────────────────────── */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-50 transition-all duration-300">
        <div className="flex items-center justify-between border border-zinc-800/80 backdrop-blur-md rounded-full bg-zinc-950/40 py-2.5 px-6 shadow-lg shadow-black/20">
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" fill="#09090b" opacity="0.9" />
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-tight text-white font-mono">
              NEXUS <span className="text-zinc-500">PM</span>
            </span>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-mono text-zinc-400">
            <a href="#showcase" className="hover:text-white transition-colors">Showcase</a>
            <a href="#features" className="hover:text-white transition-colors">Bento Grid</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#ai-workspace" className="hover:text-white transition-colors">AI Suite</a>
          </div>

          {/* Right Action: Search / Sign In */}
          <div className="flex items-center gap-4">
            <Link 
              to="/auth"
              className="h-8 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs rounded-full flex items-center justify-center transition-colors shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* 🏛️ THE DOM SCROLLING VIEWPORT (FOREGROUND LAYER) */}
      <div className="relative z-10 w-full">
        
        {/* === SECTION 1: HERO SUITE === */}
        <section className="relative min-h-[85vh] pt-48 pb-20 flex flex-col justify-center items-center text-center px-6 overflow-hidden">
          {/* Extremely subtle violet ambient radial glow */}
          <div className="absolute inset-0 w-full h-full ambient-glow-violet opacity-100 z-0 pointer-events-none" />
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={revealVariants}
            className="max-w-6xl flex flex-col items-center z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-mono bg-zinc-900/80 border border-zinc-800 rounded-full text-zinc-355 mb-8 backdrop-blur-md shadow-inner">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
              Nexus PM • AI-Powered Project Management
            </div>
            
            <h1 className="text-6xl sm:text-8xl md:text-[90px] lg:text-[104px] font-extrabold tracking-tighter text-white leading-[1.02] mb-8 max-w-6xl select-none">
              Ship exceptional products, faster. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-violet-500">
                Powered by AI.
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg text-zinc-300 max-w-3xl mb-10 leading-relaxed">
              Nexus PM unifies projects, tasks, and teams in one intelligent workspace. Plan, track, and deliver with unmatched velocity.
            </p>

            <div className="flex items-center gap-4">
              <a 
                href="#showcase"
                className="h-12 px-6 bg-violet-600 hover:bg-violet-755 hover:bg-violet-700 text-white font-medium rounded-md flex items-center justify-center transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-violet-600/10 text-sm cursor-pointer"
              >
                Explore Showcase
              </a>
              <Link 
                to="/auth"
                className="h-12 px-6 bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 text-zinc-350 hover:text-white backdrop-blur rounded-md font-medium flex items-center justify-center transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] text-sm"
              >
                View Live Dashboard
              </Link>
            </div>
          </motion.div>
        </section>

        {/* === SECTION 2: BRAND TICKER (TRUST PROOF) === */}
        <section className="py-10 border-y border-zinc-900 bg-zinc-950/40 backdrop-blur-sm relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4 text-[10px] font-mono uppercase tracking-widest text-zinc-550 select-none">
              <span>Enterprise Ready</span>
              <span className="w-1 h-1 bg-zinc-800 rounded-full hidden sm:inline" />
              <span>Cloud Native</span>
              <span className="w-1 h-1 bg-zinc-800 rounded-full hidden sm:inline" />
              <span>Developer First</span>
              <span className="w-1 h-1 bg-zinc-800 rounded-full hidden sm:inline" />
              <span>AI Workflows</span>
              <span className="w-1 h-1 bg-zinc-800 rounded-full hidden sm:inline" />
              <span>Secure By Design</span>
            </div>
          </div>
        </section>

        {/* === SECTION 3: REAL WORKSPACE SHOWCASE (INLINE KANBAN PREVIEW) === */}
        <section id="showcase" className="py-32 px-6 max-w-7xl mx-auto relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={revealVariants}
            className="text-center mb-16"
          >
            <h2 className="text-xs font-mono tracking-widest text-violet-400 uppercase mb-3">Live Workspace Preview</h2>
            <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Real-Time Workspaces. Built for engineers.</p>
            <p className="text-sm text-zinc-300 mt-2 max-w-lg mx-auto leading-relaxed">
              Live workspace showcasing Kanban workflows, sprint planning, project tracking, and engineering collaboration.
            </p>
          </motion.div>

          {/* Interactive Mockup Kanban Board Preview Panel */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={revealVariants}
            className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-6 backdrop-blur-md shadow-2xl overflow-hidden"
          >
            {/* Header window dots */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60 mb-6">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800"></span>
                <span className="text-[10px] text-zinc-550 font-mono ml-4">nexus-kanban.env</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-550 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850">
                ACTIVE WORKSPACE
              </span>
            </div>

            {/* 4 Kanban Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* TO DO */}
              <div className="bg-zinc-950/20 border border-zinc-850/80 rounded-lg p-4 flex flex-col gap-4 min-h-[250px]">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pb-2 border-b border-zinc-900">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-650" />
                    TO DO
                  </span>
                  <span className="px-1.5 bg-zinc-950 border border-zinc-850 rounded text-[9px] text-zinc-500">2</span>
                </div>
                {todoTasks.map(task => (
                  <div key={task.id} className="bg-zinc-900/30 border border-zinc-800/60 p-4 rounded-md flex flex-col justify-between min-h-[110px] hover:translate-y-[-2px] hover:border-zinc-700/80 hover:shadow-lg transition-all duration-200 select-none group cursor-pointer">
                    <div>
                      <div className="flex justify-between items-center text-[9px] font-mono mb-2">
                        <span className="text-zinc-500">{task.id}</span>
                        <span className={`px-1.5 py-0.2 rounded border text-[8px] font-bold ${priorityColors[task.priority]}`}>{task.priority}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">{task.title}</h4>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-zinc-850/60 text-[9px] font-mono text-zinc-500">
                      <span>👤 {task.assignee}</span>
                      <span>⏳ {task.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* IN PROGRESS */}
              <div className="bg-zinc-950/20 border border-zinc-850/80 rounded-lg p-4 flex flex-col gap-4 min-h-[250px]">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pb-2 border-b border-zinc-900">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 animate-pulse" />
                    IN PROGRESS
                  </span>
                  <span className="px-1.5 bg-zinc-950 border border-zinc-850 rounded text-[9px] text-zinc-500">2</span>
                </div>
                {progressTasks.map(task => (
                  <div key={task.id} className="bg-zinc-900/30 border border-zinc-800/60 p-4 rounded-md flex flex-col justify-between min-h-[110px] hover:translate-y-[-2px] hover:border-zinc-700/80 hover:shadow-lg transition-all duration-200 select-none group cursor-pointer">
                    <div>
                      <div className="flex justify-between items-center text-[9px] font-mono mb-2">
                        <span className="text-zinc-500">{task.id}</span>
                        <span className={`px-1.5 py-0.2 rounded border text-[8px] font-bold ${priorityColors[task.priority]}`}>{task.priority}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">{task.title}</h4>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-zinc-850/60 text-[9px] font-mono text-zinc-500">
                      <span>👤 {task.assignee}</span>
                      <span>⏳ {task.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* REVIEW */}
              <div className="bg-zinc-950/20 border border-zinc-850/80 rounded-lg p-4 flex flex-col gap-4 min-h-[250px]">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pb-2 border-b border-zinc-900">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80" />
                    REVIEW
                  </span>
                  <span className="px-1.5 bg-zinc-950 border border-zinc-850 rounded text-[9px] text-zinc-500">2</span>
                </div>
                {reviewTasks.map(task => (
                  <div key={task.id} className="bg-zinc-900/30 border border-zinc-800/60 p-4 rounded-md flex flex-col justify-between min-h-[110px] hover:translate-y-[-2px] hover:border-zinc-700/80 hover:shadow-lg transition-all duration-200 select-none group cursor-pointer">
                    <div>
                      <div className="flex justify-between items-center text-[9px] font-mono mb-2">
                        <span className="text-zinc-500">{task.id}</span>
                        <span className={`px-1.5 py-0.2 rounded border text-[8px] font-bold ${priorityColors[task.priority]}`}>{task.priority}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">{task.title}</h4>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-zinc-850/60 text-[9px] font-mono text-zinc-500">
                      <span>👤 {task.assignee}</span>
                      <span>⏳ {task.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* DONE */}
              <div className="bg-zinc-950/20 border border-zinc-850/80 rounded-lg p-4 flex flex-col gap-4 min-h-[250px]">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pb-2 border-b border-zinc-900">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                    DONE
                  </span>
                  <span className="px-1.5 bg-zinc-950 border border-zinc-850 rounded text-[9px] text-zinc-500">1</span>
                </div>
                {doneTasks.map(task => (
                  <div key={task.id} className="bg-zinc-900/30 border border-zinc-800/60 p-4 rounded-md flex flex-col justify-between min-h-[110px] hover:translate-y-[-2px] hover:border-zinc-700/80 hover:shadow-lg transition-all duration-200 select-none group cursor-pointer">
                    <div>
                      <div className="flex justify-between items-center text-[9px] font-mono mb-2">
                        <span className="text-zinc-500">{task.id}</span>
                        <span className={`px-1.5 py-0.2 rounded border text-[8px] font-bold ${priorityColors[task.priority]}`}>{task.priority}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">{task.title}</h4>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-zinc-850/60 text-[9px] font-mono text-zinc-500">
                      <span>👤 {task.assignee}</span>
                      <span>⏳ {task.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </motion.div>
        </section>

        {/* === SECTION 4: AI COORDINATION SHOWCASE === */}
        <section id="ai-workspace" className="relative py-32 border-t border-zinc-900/80 overflow-hidden px-6">
          {/* Extremely subtle violet ambient radial glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ambient-glow-violet opacity-100 z-0 pointer-events-none" />
          
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={revealVariants}
              className="text-center mb-16 relative z-10"
            >
              <h2 className="text-xs font-mono tracking-widest text-violet-400 uppercase mb-3">AI Intelligence</h2>
              <p className="text-3xl font-bold text-white tracking-tight">AI Coordination Workspace</p>
              <p className="text-sm text-zinc-300 mt-2 max-w-2xl mx-auto leading-relaxed">
                Automate task break downs, generate summaries, and detect delivery risks natively using contextual workspace metadata.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-12 relative z-10">
              {/* Left: Tab Selectors */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                {[
                  { id: 'sprint', label: 'AI Sprint Planning', desc: 'Predictive velocity allocations.', icon: Sparkles },
                  { id: 'tasks', label: 'AI Task Suggestions', desc: 'Automated requirement breakdown.', icon: Cpu },
                  { id: 'summary', label: 'AI Project Summaries', desc: 'Real-time contextual briefings.', icon: Layers },
                  { id: 'risks', label: 'AI Risk Detection', desc: 'Early delivery bottleneck warnings.', icon: AlertTriangle }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeAITab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveAITab(tab.id as 'sprint' | 'tasks' | 'summary' | 'risks')}
                      className={`flex items-start text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                        isSelected 
                          ? 'bg-zinc-900/60 border-zinc-700/80 shadow-md text-white' 
                          : 'bg-zinc-950/40 border-zinc-900/60 text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/20 hover:text-zinc-200'
                      }`}
                    >
                      <div className={`p-2 rounded-lg mr-4 border ${
                        isSelected ? 'bg-violet-950/60 border-violet-800 text-violet-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold font-mono uppercase tracking-wider">{tab.label}</h4>
                        <p className="text-2xs text-zinc-500 mt-1">{tab.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right: Tab Visualizer Display */}
              <div className="lg:col-span-8 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between min-h-[300px] shadow-2xl relative overflow-hidden">
                {/* Subtle radial glow inside card for visual depth */}
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60 mb-4 z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800"></span>
                    <span className="text-[10px] text-zinc-550 font-mono ml-4">nexus-ai-workspace.log</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase bg-violet-950/60 border border-violet-800 px-1.5 py-0.5 rounded text-violet-400">
                    AI ACTIVE
                  </span>
                </div>

                <div className="flex-1 font-mono text-zinc-300 text-xs space-y-4 z-10 flex flex-col justify-center">
                  {activeAITab === 'sprint' && (
                    <div className="space-y-3">
                      <div className="text-[10px] text-zinc-550 flex items-center gap-2">
                        <span>[ENG_VELOCITY_CALC]</span>
                        <span className="text-emerald-400">READY</span>
                      </div>
                      <div className="p-3.5 bg-zinc-950/50 border border-zinc-850 rounded-lg space-y-2.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-zinc-400">Sprint Target Capacity:</span>
                          <span className="text-zinc-200">45 Story Points</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-zinc-400">AI Allocated Tasks:</span>
                          <span className="text-zinc-200">32 Story Points (Optimal)</span>
                        </div>
                        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-full h-2 overflow-hidden mt-1">
                          <div className="bg-violet-500 h-full w-[72%]" />
                        </div>
                        <div className="text-[10px] text-zinc-400 pt-1 leading-relaxed">
                          AI Prediction: <span className="text-emerald-400 font-semibold">92% Completion Probability</span> based on past 3 sprint velocities.
                        </div>
                      </div>
                    </div>
                  )}

                  {activeAITab === 'tasks' && (
                    <div className="space-y-3">
                      <div className="text-[10px] text-zinc-550 flex items-center gap-2">
                        <span>[GEN_BREAKDOWN_LOOP]</span>
                        <span>Parent task: "Setup OAuth keyserver"</span>
                      </div>
                      <div className="bg-zinc-950/50 border border-zinc-850 rounded-lg p-3.5 space-y-3 text-[10px] text-zinc-400">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">[✔]</span>
                          <span>NEXUS-1024: Define JWT encryption scopes (Estimated: 2h)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-violet-400">[ ]</span>
                          <span className="text-zinc-200">NEXUS-1025: Implement keyserver rotating validation keys (Estimated: 4h)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-violet-400">[ ]</span>
                          <span>NEXUS-1026: Connect dashboard settings UI key generation form (Estimated: 3h)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeAITab === 'summary' && (
                    <div className="space-y-3">
                      <div className="text-[10px] text-zinc-550 flex items-center gap-2">
                        <span>[BRIEF_COMPILER_V1]</span>
                        <span>Target: Sprint 4 Active Branch</span>
                      </div>
                      <div className="bg-zinc-950/50 border border-zinc-850 rounded-lg p-3.5 text-[10px] leading-relaxed space-y-2 text-zinc-400">
                        <p>
                          <strong className="text-white">Active Status Summary:</strong> Sprint progress is trending <span className="text-emerald-400 font-bold">14% ahead of schedule</span>. 
                          Subsystems are operating normally. 
                        </p>
                        <p>
                          <strong className="text-white">Key Contributors:</strong> 5 commits merged into <code className="text-zinc-300">auth-service/kms-fix</code>. 
                          No new regressions introduced.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeAITab === 'risks' && (
                    <div className="space-y-3">
                      <div className="text-[10px] text-zinc-550 flex items-center gap-2 text-amber-500">
                        <span>[WARNING_BOT_ENG]</span>
                        <span>1 critical blocker dependency detected</span>
                      </div>
                      <div className="bg-zinc-950/50 border border-amber-900/50 bg-amber-950/5 rounded-lg p-3.5 space-y-2.5 text-[10px]">
                        <div className="flex items-start gap-2.5">
                          <span className="text-amber-500 mt-0.5">⚠️</span>
                          <div>
                            <p className="text-zinc-200 font-bold">Task Blocked: NEXUS-1025 (Security Audit Logs)</p>
                            <p className="text-zinc-400 mt-1">Blocked by: NEX-1024. Owner (cholan-kinnera) is currently assigned 4 concurrent tasks.</p>
                            <p className="text-violet-400 mt-1.5 font-bold">AI Recommendation: Re-allocate NEX-1024 task load to secondary owner to resolve bottleneck.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* === SECTION 5: PLATFORM ARCHITECTURE & STACK SHOWCASE === */}
        <section id="architecture" className="py-32 bg-zinc-950/40 border-y border-zinc-900">
          <div className="max-w-7xl mx-auto px-6">
            
            {/* Part A: Architecture Stack flows */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={revealVariants}
              className="text-center mb-16"
            >
              <h2 className="text-xs font-mono tracking-widest text-emerald-400 uppercase mb-3">Enterprise Core</h2>
              <p className="text-3xl font-bold text-white tracking-tight">Platform Stack & Data Pipeline</p>
              <p className="text-sm text-zinc-300 mt-2 max-w-2xl mx-auto leading-relaxed">
                Nexus PM operates on a secure, modern stack designed for high responsiveness, concurrent task updates, and robust audit trail storage.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative py-12">
              {/* Card 1: Frontend */}
              <div className="glass-card-premium p-6 rounded-xl flex flex-col justify-between hover:translate-y-[-2px] hover:border-zinc-700 hover:shadow-lg transition-all duration-200">
                <div>
                  <h3 className="text-[10px] font-bold font-mono text-emerald-400 mb-2 uppercase tracking-wider">Frontend Layer</h3>
                  <p className="text-sm font-bold text-white mb-1">React SPA Client</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">Modern React application delivering high-performance interfaces, animated workflows, and interactive 3D experiences.</p>
                </div>
                <span className="text-[9px] font-mono text-zinc-500 mt-4 block">React 19 • TypeScript • Vite • TailwindCSS • Framer Motion • React Three Fiber</span>
              </div>

              {/* Card 2: Backend */}
              <div className="glass-card-premium p-6 rounded-xl flex flex-col justify-between hover:translate-y-[-2px] hover:border-zinc-700 hover:shadow-lg transition-all duration-200">
                <div>
                  <h3 className="text-[10px] font-bold font-mono text-emerald-400 mb-2 uppercase tracking-wider">Backend API</h3>
                  <p className="text-sm font-bold text-white mb-1">FastAPI Core</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">FastAPI-powered asynchronous API layer featuring JWT authentication, AWS SES OTP verification, PostgreSQL persistence, SQLAlchemy ORM, and Alembic migrations.</p>
                </div>
                <span className="text-[9px] font-mono text-zinc-500 mt-4 block">FastAPI • JWT • SQLAlchemy • Alembic</span>
              </div>

              {/* Card 3: Database */}
              <div className="glass-card-premium p-6 rounded-xl flex flex-col justify-between hover:translate-y-[-2px] hover:border-zinc-700 hover:shadow-lg transition-all duration-200">
                <div>
                  <h3 className="text-[10px] font-bold font-mono text-emerald-400 mb-2 uppercase tracking-wider">Database Engine</h3>
                  <p className="text-sm font-bold text-white mb-1">PostgreSQL Database</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">Enterprise-grade relational storage with ACID-compliant transactions, advanced indexing, JSONB support, and scalable project metadata management.</p>
                </div>
                <span className="text-[9px] font-mono text-zinc-500 mt-4 block">PostgreSQL • SQLAlchemy • Alembic</span>
              </div>

              {/* Card 4: Infrastructure */}
              <div className="glass-card-premium p-6 rounded-xl flex flex-col justify-between hover:translate-y-[-2px] hover:border-zinc-700 hover:shadow-lg transition-all duration-200">
                <div>
                  <h3 className="text-[10px] font-bold font-mono text-emerald-400 mb-2 uppercase tracking-wider">Infrastructure</h3>
                  <p className="text-sm font-bold text-white mb-1">AWS Cloud Infrastructure</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">Cloud-native services powering email verification, secure object storage, deployment automation, observability, and future containerized workloads.</p>
                </div>
                <span className="text-[9px] font-mono text-zinc-500 mt-4 block">AWS • S3 • SES • Cloud</span>
              </div>
            </div>

            {/* Part B: Security Framework details */}
            <div className="pt-24 border-t border-zinc-900/80 mt-16">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={revealVariants}
                className="text-center mb-16"
              >
                <h2 className="text-xs font-mono tracking-widest text-emerald-400 uppercase mb-3">Enterprise Security</h2>
                <p className="text-3xl font-bold text-white tracking-tight">Security & Infrastructure Framework</p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
                {/* Card 1: JWT Authentication */}
                <div className="glass-card-premium p-6 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Lock size={16} className="text-emerald-400" />
                      <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">JWT Authentication</h3>
                    </div>
                    <p className="text-xs text-zinc-350 leading-relaxed">Encrypted header session handshakes with programmatic user authentication signatures built into core routes.</p>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600 mt-4 block">SHA-256 HMAC encryption</span>
                </div>

                {/* Card 2: AWS SES OTP */}
                <div className="glass-card-premium p-6 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Database size={16} className="text-emerald-400" />
                      <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">AWS SES OTP</h3>
                    </div>
                    <p className="text-xs text-zinc-350 leading-relaxed">Dynamic verification login codes routed securely via automated Amazon Simple Email Service configurations.</p>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600 mt-4 block">2FA One-Time Passwords</span>
                </div>

                {/* Card 3: Audit Logging */}
                <div className="glass-card-premium p-6 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Eye size={16} className="text-emerald-400" />
                      <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">Audit Logging</h3>
                    </div>
                    <p className="text-xs text-zinc-350 leading-relaxed">Immutable state change verification logging. Logs theme changes, task movements, and keyserver connections.</p>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600 mt-4 block">Persistent session audit logs</span>
                </div>

                {/* Card 4: Role-Based Access */}
                <div className="glass-card-premium p-6 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle size={16} className="text-emerald-400" />
                      <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">Role-Based Access</h3>
                    </div>
                    <p className="text-xs text-zinc-355 leading-relaxed">Granular permissions restricting actions across projects and admin configurations dynamically per role classification.</p>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600 mt-4 block">RBAC authorization checks</span>
                </div>

                {/* Card 5: Encrypted Storage */}
                <div className="glass-card-premium p-6 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Database size={16} className="text-emerald-400" />
                      <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">Encrypted Storage</h3>
                    </div>
                    <p className="text-xs text-zinc-355 leading-relaxed">Core file storage buckets encrypted using custom vaults, preventing access to credentials and active assets.</p>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600 mt-4 block">AES-256 asset encryption</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* === SECTION 6: BENTO MATRIX OVERVIEW === */}
        <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={revealVariants}
            className="text-center mb-20"
          >
            <h2 className="text-xs font-mono tracking-widest text-violet-400 uppercase mb-3">Capabilities</h2>
            <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Built For Elite Engineering Environments</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Cloud Pipelines */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={revealVariants}
              className="glass-card-premium p-8 rounded-xl group"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 flex items-center justify-center font-mono text-sm group-hover:border-violet-500/50 transition-colors mb-6">
                <Layers size={16} className="text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-50 mb-2">Automated Cloud Pipelines</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">Secure programmatic execution loops monitoring tasks and triggering updates via localized cloud transaction blocks instantly.</p>
            </motion.div>

            {/* Bento Card 2: Interactive Kanban Matrix */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={revealVariants}
              className="glass-card-premium p-8 rounded-xl group"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 flex items-center justify-center font-mono text-sm group-hover:border-violet-500/50 transition-colors mb-6">
                <Terminal size={16} className="text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-50 mb-2">Interactive Kanban Matrix</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">Micro-interactions wired into a strict metadata index layer. Fluid drag motions with real-time story point calculation loops.</p>
            </motion.div>

            {/* Bento Card 3: Asynchronous Security Logs */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={revealVariants}
              className="glass-card-premium p-8 rounded-xl group"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 flex items-center justify-center font-mono text-sm group-hover:border-violet-500/50 transition-colors mb-6">
                <Shield size={16} className="text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-50 mb-2">Asynchronous Security Logs</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">Cryptographic handshake monitoring verifying users via live token pipelines and reflecting active audit metrics natively.</p>
            </motion.div>
          </div>
        </section>

        {/* === SECTION 7: CTA FOOTER BLOCK === */}
        <section className="py-36 px-6 relative overflow-hidden">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={revealVariants}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">
              Ready to manage the future?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-zinc-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of high-performing engineering teams using Nexus PM to secure and accelerate their release pipelines.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link 
                to="/auth"
                className="h-12 px-8 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-md flex items-center justify-center transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-violet-600/10 text-sm gap-2"
              >
                <span>Get Started — It's Free</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="border-t border-zinc-900 py-10 px-6 bg-zinc-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-zinc-100 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" fill="#09090b" opacity="0.9" />
                </svg>
              </div>
              <span className="text-xs font-bold text-white font-mono">
                NEXUS <span className="text-zinc-500">PM</span>
              </span>
            </div>
            <p className="text-[10px] text-zinc-600 font-mono">
              &copy; 2026 Nexus PM. Built for engineering teams.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Preload GLTF model
useGLTF.preload('/models/workspace_mesh.glb');
