"use client"

import { useMemo, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Sparkles } from "@react-three/drei"

import * as THREE from "three"

// ── helpers ────────────────────────────────────────────────────────────

function ridgeHeight(x: number, z: number, seed: number): number {
  return (
    Math.sin(x * 0.28 + seed) * 1.6 +
    Math.sin(x * 0.71 + seed * 2.3) * 0.8 +
    Math.sin(x * 1.63 + seed * 4.1) * 0.35 +
    Math.sin((x + z) * 0.41 + seed * 1.7) * 0.9 +
    Math.sin(z * 0.53 + seed * 3.3) * 0.7
  )
}

// ── mountain ridge ─────────────────────────────────────────────────────

function Ridge({
  z,
  seed,
  color,
  amplitude,
  baseY,
}: {
  z: number
  seed: number
  color: string
  amplitude: number
  baseY: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { geometry, heights } = useMemo(() => {
    const width = 90
    const depth = 26
    const geo = new THREE.PlaneGeometry(width, depth, 120, 32)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position as THREE.BufferAttribute
    const h = new Float32Array(pos.count)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const zz = pos.getZ(i)
      h[i] = Math.max(0, ridgeHeight(x, zz, seed)) * amplitude
      pos.setY(i, h[i])
    }
    geo.computeVertexNormals()
    return { geometry: geo, heights: h }
  }, [seed, amplitude])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const pos = geometry.attributes.position as THREE.BufferAttribute
    const t = clock.elapsedTime
    const speed = 0.15 + (baseY + 10) * 0.01
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const zz = pos.getZ(i)
      const wave = Math.sin(x * 0.08 + t * speed) * 0.5 + Math.sin(zz * 0.06 + t * speed * 0.6 + 1.5) * 0.3
      pos.setY(i, heights[i] + wave)
    }
    pos.needsUpdate = true
    geometry.computeVertexNormals()
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, baseY, z]} receiveShadow>
      <meshStandardMaterial color={color} flatShading roughness={1} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ── snow particles ─────────────────────────────────────────────────────

function Snow({ count = 600 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 60
      arr[i * 3 + 1] = Math.random() * 18
      arr[i * 3 + 2] = -Math.random() * 40
    }
    return arr
  }, [count])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const pts = ref.current
    if (!pts) return
    const pos = pts.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - dt * 0.55
      let x = pos.getX(i) + Math.sin(y * 0.6 + i) * dt * 0.18
      if (y < -1) {
        y = 16 + Math.random() * 2
        x = (Math.random() - 0.5) * 60
      }
      pos.setY(i, y)
      pos.setX(i, x)
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.1}
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// ── glowing moon ───────────────────────────────────────────────────────

function Moon() {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (meshRef.current) {
      meshRef.current.position.y = 14 + Math.sin(t * 0.03) * 0.3
    }
    if (glowRef.current) {
      glowRef.current.position.y = 14 + Math.sin(t * 0.03) * 0.3
      glowRef.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.03)
    }
  })

  return (
    <group>
      <mesh ref={glowRef} position={[18, 14, -42]}>
        <circleGeometry args={[2.2, 32]} />
        <meshBasicMaterial color="#ffe8b0" transparent opacity={0.15} depthWrite={false} />
      </mesh>
      <mesh ref={meshRef} position={[18, 14, -42]}>
        <circleGeometry args={[0.9, 32]} />
        <meshBasicMaterial color="#fef0d0" />
      </mesh>
      <mesh position={[18.15, 14.05, -42]}>
        <circleGeometry args={[0.15, 16]} />
        <meshBasicMaterial color="#e8d4a8" transparent opacity={0.6} />
      </mesh>
      <mesh position={[17.75, 13.85, -42]}>
        <circleGeometry args={[0.1, 16]} />
        <meshBasicMaterial color="#e8d4a8" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

// ── aurora borealis ────────────────────────────────────────────────────

function Aurora() {
  const meshRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(60, 16, 64, 16)
    geo.rotateX(-Math.PI / 3)
    return geo
  }, [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime
    const pos = geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const wave = Math.sin(x * 0.15 + t * 0.12) * 0.4 +
                   Math.sin(x * 0.3 + t * 0.08 + z * 0.2) * 0.25
      pos.setY(i, wave)
    }
    pos.needsUpdate = true
    geometry.computeVertexNormals()
    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.15 + Math.sin(t * 0.1) * 0.05
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={[-25, 16, -40]} rotation={[0.2, 0.3, 0]}>
      <meshBasicMaterial
        color="#4a9e7e"
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ── shooting star ──────────────────────────────────────────────────────

function ShootingStar() {
  const ref = useRef<THREE.Points>(null)
  const seed = useRef(Math.random() * 1000)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime * 0.15 + seed.current
    const cycle = t % 12
    const active = cycle > 9 && cycle < 9.3
    if (!active) {
      ref.current.visible = false
      return
    }
    ref.current.visible = true
    const progress = (cycle - 9) / 0.3
    const startX = -30
    const startY = 20
    const dx = 55
    const dy = -18
    const x = startX + dx * progress
    const y = startY + dy * progress
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute
    const count = pos.count
    for (let i = 0; i < count; i++) {
      const offset = i / count
      pos.setX(i, x + offset * dx * 0.08)
      pos.setY(i, y + offset * dy * 0.08)
      pos.setZ(i, -42 + Math.random() * 0.5)
    }
    pos.needsUpdate = true
    const mat = ref.current.material as THREE.PointsMaterial
    mat.opacity = 1 - progress
  })

  const positions = useMemo(() => new Float32Array(20 * 3), [])

  return (
    <points ref={ref} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffe8c0"
        size={0.12}
        transparent
        opacity={1}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ── low-poly tree ──────────────────────────────────────────────────────

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const trunkRef = useRef<THREE.Mesh>(null)
  const foliageRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const sway = Math.sin(clock.elapsedTime * 0.6 + position[0] * 2) * 0.015
    if (foliageRef.current) foliageRef.current.rotation.z = sway
    if (trunkRef.current) trunkRef.current.rotation.z = sway * 0.5
  })

  return (
    <group position={position} scale={scale}>
      <mesh ref={trunkRef} position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 1.2, 5]} />
        <meshStandardMaterial color="#2a1f14" flatShading roughness={1} />
      </mesh>
      <mesh ref={foliageRef} position={[0, 1.6, 0]}>
        <coneGeometry args={[0.5, 1.0, 5]} />
        <meshStandardMaterial color="#1a3324" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <coneGeometry args={[0.35, 0.7, 5]} />
        <meshStandardMaterial color="#1f3d2b" flatShading roughness={1} />
      </mesh>
    </group>
  )
}

// ── tree scatter ───────────────────────────────────────────────────────

function TreeScatter() {
  const trees = useMemo(() => {
    const result: { pos: [number, number, number]; scale: number }[] = []
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 16 + Math.random() * 12
      const x = Math.cos(angle) * radius
      const z = -20 + Math.sin(angle) * radius * 0.4
      const y = -0.2
      const scale = 0.3 + Math.random() * 0.4
      result.push({ pos: [x, y, z], scale })
    }
    return result
  }, [])

  return (
    <group>
      {trees.map((t, i) => (
        <Tree key={i} position={t.pos} scale={t.scale} />
      ))}
    </group>
  )
}

// ── mist layer ─────────────────────────────────────────────────────────

function Mist() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(70, 30, 40, 20)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const pos = geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const wave = Math.sin(x * 0.08 + t * 0.04) * 0.3 + Math.sin(z * 0.06 + t * 0.03) * 0.2
      pos.setY(i, wave)
    }
    pos.needsUpdate = true
  })

  return (
    <mesh geometry={geometry} position={[0, -0.1, -18]}>
      <meshBasicMaterial
        color="#b8d4c0"
        transparent
        opacity={0.06}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ── camera rig ─────────────────────────────────────────────────────────

function CameraRig() {
  const { camera, pointer } = useThree()
  const target = useRef(new THREE.Vector3())

  useFrame((state) => {
    const t = state.clock.elapsedTime
    target.current.set(
      Math.sin(t * 0.05) * 1.2 + pointer.x * 1.4,
      4.2 + Math.sin(t * 0.08) * 0.35 + pointer.y * 0.7,
      12,
    )
    camera.position.lerp(target.current, 0.02)
    camera.lookAt(0, 3, -14)
  })
  return null
}

// ── twinkling starfield ────────────────────────────────────────────────

function StarField({ count = 500 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const [positions, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const ph = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 50 + Math.random() * 40
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = 10 + Math.random() * 35
      pos[i * 3 + 2] = -r * Math.cos(phi) - 20
      ph[i] = Math.random() * Math.PI * 2
    }
    return [pos, ph]
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.PointsMaterial
    const t = state.clock.elapsedTime
    mat.opacity = 0.5 + Math.sin(t * 0.4 + 1) * 0.3
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#f0f5f2"
        size={0.12}
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// ── shine sparkles ─────────────────────────────────────────────────────

function ShineSparkles() {
  const ref = useRef<THREE.Points>(null)
  const count = 200

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 70
      arr[i * 3 + 1] = Math.random() * 22
      arr[i * 3 + 2] = -Math.random() * 48
    }
    return arr
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.PointsMaterial
    const t = state.clock.elapsedTime
    mat.opacity = 0.15 + Math.sin(t * 3.7) * 0.12 + Math.sin(t * 5.1 + 2) * 0.1
    mat.size = 0.08 + Math.sin(t * 2.3) * 0.05 + Math.sin(t * 4.9 + 1) * 0.04
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.08}
        transparent
        opacity={0.2}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ── hero 3d ────────────────────────────────────────────────────────────

export default function Hero3D({ reduced = false }: { reduced?: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 4.2, 12], fov: 55 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true }}
      aria-hidden="true"
      frameloop={reduced ? "demand" : "always"}
    >
      <color attach="background" args={["#0c110e"]} />
      <fog attach="fog" args={["#0c110e", 14, 52]} />

      <hemisphereLight args={["#8aa8a0", "#1a201c", 1.2]} />
      <directionalLight position={[-14, 18, -8]} intensity={2.0} color="#d4e8e0" />
      <directionalLight position={[10, 6, 4]} intensity={0.6} color="#a8d4c0" />
      <directionalLight position={[0, -2, 10]} intensity={0.4} color="#c8dcd4" />

      {/* Sky elements */}
      <StarField />
      <Moon />
      <Aurora />
      <ShootingStar />

      {/* Far, mid, near ridges — tall solid walls extending far below */}
      <Ridge z={-38} seed={7.3} color="#1c2e25" amplitude={9} baseY={-10} />
      <Ridge z={-26} seed={3.1} color="#1e3228" amplitude={7} baseY={-8} />
      <Ridge z={-14} seed={11.7} color="#162c20" amplitude={5} baseY={-6} />

      {/* Trees on the near ridge */}
      <TreeScatter />

      {/* Valley floor — far below so mountains rise from it */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -11, 0]}>
        <planeGeometry args={[160, 120]} />
        <meshStandardMaterial color="#c4a85a" roughness={0.9} />
      </mesh>

      {/* Atmosphere */}
      <Mist />

      {/* Particles */}
      {!reduced && (
        <Sparkles
          count={80}
          scale={[40, 6, 20]}
          size={0.6}
          speed={0.3}
          color="#cfe8dc"
          opacity={0.3}
        />
      )}
      {!reduced && <Snow />}
      {!reduced && <ShineSparkles />}



      {!reduced && <CameraRig />}
    </Canvas>
  )
}
