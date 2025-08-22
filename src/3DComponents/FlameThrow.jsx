// We use a modified version of https://github.com/yomotsu/three-particle-fire

import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

import particleFire from '../contrib/three-particle-fire-master/src/three-particle-fire.js'



import * as THREE from 'three'

particleFire.install( { THREE } )

// avoid dynamic allocation
const _quat = new THREE.Quaternion()
const _vFrom = new THREE.Vector3()
const _vTo = new THREE.Vector3()
const _vDir = new THREE.Vector3()
const _upWard = new THREE.Vector3(0, 1, 0)


const FlameThrow = (props) => {
  const containerRef = useRef()
 
  const { camera, size, scene } = useThree()

  const particleFireMesh = useMemo(() => {
    const geometry0 = new particleFire.Geometry( props.radius, props.height, props.particleCount )
    const material0 = new particleFire.Material( { color: 0xffaa66 } )

    material0.setPerspective( camera.fov, size.height )
    const me = new THREE.Points( geometry0, material0 )
    me.renderOrder = 10000
    return me
  }, [])

  useFrame((state, delta) => {
    particleFireMesh.material.update( delta )
    _vTo.fromArray(props.target)
    _vFrom.fromArray(props.origin)
    _vDir.copy(_vTo).sub(_vFrom).normalize()
    _quat.setFromUnitVectors(_upWard, _vDir)
    containerRef.current.rotation.setFromQuaternion(_quat)
  })

  const s = props.scale
  return (
    <group frustumCulled={false} ref={containerRef} position={props.origin} scale={[s, s, s]}>
      <primitive object={particleFireMesh} />
    </group>
  )
} 

export default FlameThrow
