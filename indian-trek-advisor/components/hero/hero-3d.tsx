"use client"

import { useMemo, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

/**
 * Procedural low-poly mountain ridges with drifting fog, snow particles,
 * and mouse-parallax camera drift.
 */

// Deterministic pseudo-noise built from layered sines (no deps, stable across renders)
function ridgeHeight(x: number, z: number, seed: number): number {
  return (
    Math.sin(x * 0.28 + seed) * 1.6 +
    Math.sin(x * 0.71 + seed * 2.3) * 0.8 +
    Math.sin(x * 1.63 + seed * 4.1) * 0.35 +
    Math.sin((x + z) * 0.41 + seed * 1.7) * 0.9 +
    Math.sin(z * 0.53 + seed * 3.3) * 0.7
  )
}

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
  const geometry = useMemo(() => {
    const width = 90
    const depth = 22
    const geo = new THREE.PlaneGeometry(width, depth, 120, 24)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const zz = pos.getZ(i)
      // Fade the ridge down toward the front edge so it melts into the valley
      const frontFade = THREE.MathUtils.clamp((zz + depth / 2) / depth, 0, 1)
      const h = Math.max(0, ridgeHeight(x, zz, seed)) * amplitude * frontFade
      pos.setY(i, h)
    }
    geo.computeVertexNormals()
    return geo
  }, [seed, amplitude])

  return (
    <mesh geometry={geometry} position={[0, baseY, z]} receiveShadow>
      <meshStandardMaterial color={color} flatShading roughness={1} />
    </mesh>
  )
}

function Snow({ count = 350 }: { count?: number }) {
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
    const pts = ref.current
    if (!pts) return
    const pos = pts.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - delta * 0.55
      let x = pos.getX(i) + Math.sin(y * 0.6 + i) * delta * 0.18
      if (y < -1) {
        y = 17
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
        color="#cfe8dc"
        size={0.07}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function CameraRig() {
  const { camera, pointer } = useThree()
  const target = useRef(new THREE.Vector3())

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // Slow drift + mouse parallax
    target.current.set(
      Math.sin(t * 0.05) * 1.2 + pointer.x * 1.4,
      4.2 + Math.sin(t * 0.08) * 0.35 + pointer.y * 0.7,
      12
    )
    camera.position.lerp(target.current, 0.02)
    camera.lookAt(0, 3, -14)
  })
  return null
}

function Stars({ count = 220 }: { count?: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 120
      arr[i * 3 + 1] = 10 + Math.random() * 40
      arr[i * 3 + 2] = -45 - Math.random() * 20
    }
    return arr
  }, [count])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#e8f2ec"
        size={0.12}
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

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

      <hemisphereLight args={["#3d5c4d", "#0a0d0b", 0.9]} />
      <directionalLight position={[-14, 18, -8]} intensity={1.1} color="#b9d9c8" />
      <directionalLight position={[10, 6, 4]} intensity={0.25} color="#74c8a3" />

      <Stars />
      {/* Far, mid, near ridges */}
      <Ridge z={-34} seed={7.3} color="#1c2a22" amplitude={3.4} baseY={0.5} />
      <Ridge z={-22} seed={3.1} color="#16211b" amplitude={2.6} baseY={0} />
      <Ridge z={-10} seed={11.7} color="#101813" amplitude={1.7} baseY={-0.4} />
      {/* Valley floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry args={[160, 120]} />
        <meshStandardMaterial color="#0b0f0c" roughness={1} />
      </mesh>

      {!reduced && <Snow />}
      {!reduced && <CameraRig />}
    </Canvas>
  )
}
