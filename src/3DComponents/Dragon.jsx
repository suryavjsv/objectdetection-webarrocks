import { forwardRef, useRef, useEffect, useState, Suspense, useImperativeHandle } from 'react'
import { useFrame, useThree, useLoader } from '@react-three/fiber'
import {
  AnimationMixer,
  CatmullRomCurve3,
  LinearSRGBColorSpace,
  LoopOnce,
  Matrix4,
  Vector3
} from 'three'
// import GLTF loader - originally in examples/jsm/loaders/
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Dragon 3D Model:
import GLTFModel from '../assets/models3D/gold-dragon/goldDragonCleanedExported.glb'


let _threeAnimationMixer = null
let _animationClipAttack = null
let _animationClipFly = null
let _animationActionFly = null
let _animationActionAttack = null
let _headBone = null
const _headBoneWorldPos = new Vector3()


const FLAME_THROWING_ATTACKT_START = 0.3
const FLAME_THROWING_ATTACKT_STOP = 0.7
const FLAME_ATTACKT_START = 0.5


// start position in world coordinates:
const _positionStartWorld = new Vector3( 7, 5, 5 )

// end positions in dragon coordinates:
const _positionsEnd = [
  new Vector3( 0.6, 0.6, 2.5 )
]

const create_dragonPath = (dragonModel) => {
  const localRef = dragonModel.parent
  localRef.updateWorldMatrix(true, false)
  const worldMatrix = localRef.matrixWorld
  const worldMatrixInv = worldMatrix.clone().invert()
  const localZ = new Vector3(0,0,1).transformDirection(worldMatrix)

  const keypoints = [
    _positionStartWorld.applyMatrix4(worldMatrixInv),
    ..._positionsEnd.map((point) => {
      const p = point.clone()
      // dragon should arrive from behind:
      p.z *= (localZ.z > 0) ? -1 : 1
      return p
    })
  ]
  return new CatmullRomCurve3(keypoints, false, 'centripetal')
}

let _dragonPath = null


// avoid allocating:
const _v3 = new Vector3()


const easeOutQuad = (x) => {
  return 1.0 - (1.0 - x) * (1.0 - x)
}


const extract_bone = (model, boneName) => {
  let bone = null
  model.traverse((threeNode) => {
    if (threeNode.name === boneName){
      bone = threeNode
    }
  })
  return bone
}


const fix_colorEncoding = (model) => {
  model.traverse((threeNode) => {
    if (threeNode.material && threeNode.material.map){
      threeNode.material.map.colorSpace = LinearSRGBColorSpace
    }
  })
}



const Dragon = forwardRef((props, ref) => {
  const objRef = useRef()
  
  const [arriveT, setArriveT] = useState(0)
  const [attackT, setAttackT] = useState(0)
  const [leaveT, setLeaveT] = useState(0)
  const [isFlameThrowing, setIsFlameThrowing] = useState(false)
  const [isFlame, setIsFlame] = useState(false)


  const reset = () => {
    _dragonPath = null
    setArriveT(0)
    setAttackT(0)
    setLeaveT(0)
    setIsFlameThrowing(false)
    setIsFlame(false)
    console.log('  Reset Dragon')
  }

  useImperativeHandle(ref, () => {
    return {
      reset
    }
   }, [])

  // import main model:
  const gltf = useLoader(GLTFLoader, GLTFModel)
  const model = gltf.scene

  useEffect(() => {
    // fix color encoding:
    //fix_colorEncoding(model)

    // extract head bone (to position the flame)
    _headBone = extract_bone(model, "Bone_end_40_024")

    // extract animations:
    _animationClipAttack = gltf.animations[4] // skill02
    _animationClipFly = gltf.animations[6] // stand

    // animate:
    _threeAnimationMixer = new AnimationMixer(model)
    _animationActionFly = _threeAnimationMixer.clipAction(_animationClipFly)
    _animationActionFly.play()
  }, [])

  useFrame((state, delta) => {
    if (!_threeAnimationMixer || !objRef.current){
      return
    }
    _threeAnimationMixer.update(delta)
    if (arriveT < 1){
      if (arriveT === 0){
        console.log('DRAGON IS COMING...')
      }
      // The dragon is coming
      const newArriveT = Math.min(1, arriveT + delta / props.pathDuration)
      setArriveT(newArriveT)
      const dragonParent = objRef.current

      // set dragon pose on the path:
      const arriveTEasing = easeOutQuad(arriveT)
      if (_dragonPath === null){
        _dragonPath = create_dragonPath(objRef.current)
      }
      _dragonPath.getPointAt(arriveTEasing, dragonParent.position)
      _dragonPath.getTangentAt(arriveTEasing, _v3)
      _v3.add(dragonParent.position)
      _v3.multiplyScalar(1 - Math.pow(arriveT, 3))
      dragonParent.parent.updateMatrixWorld()
      _v3.applyMatrix4(dragonParent.parent.matrixWorld)
      dragonParent.lookAt(_v3)
    } else if (arriveT === 1 && attackT < 1){
      // the dragon is attacking
      // update animation:
      if (attackT === 0){
        console.log('DRAGON ATTACK!')
        _animationActionAttack = _threeAnimationMixer.clipAction(_animationClipAttack)
        _animationActionAttack.loop = LoopOnce
        _animationActionAttack.clampWhenFinished = true
        _animationActionAttack.crossFadeFrom(_animationActionFly, 0.5, false).play()
      }
      const newAttackT = Math.min(1, attackT + delta / _animationClipAttack.duration)
      setAttackT(newAttackT)

      // manage flame throwing:
      const shouldFlameThrowing = !isFlameThrowing && attackT > FLAME_THROWING_ATTACKT_START && attackT < FLAME_THROWING_ATTACKT_STOP
      if (shouldFlameThrowing){
        console.log('  Dragon starts flame throwing')
        setIsFlameThrowing(true)
        if (props.onFlameThrowing){
          props.onFlameThrowing(true)
        }
      } else if (isFlameThrowing && attackT > FLAME_THROWING_ATTACKT_STOP){
        console.log('  Dragon stops flame throwing')
        setIsFlameThrowing(false)
        if (props.onFlameThrowing){
          props.onFlameThrowing(false)
        }
      }
      if ((shouldFlameThrowing || isFlameThrowing) && props.update_flameThrowingPosition){
        _headBone.getWorldPosition(_headBoneWorldPos)
        props.update_flameThrowingPosition(_headBoneWorldPos)
      }
      
      // manage lighter flame:
      if (!isFlame && attackT > FLAME_ATTACKT_START){
        console.log('  Lighter flame starts')
        setIsFlame(true)
        if (props.onFlame){
          props.onFlame(true)
        }
      }

    } else if (attackT === 1){
      if (leaveT === 0){
        console.log('DRAGON STAND BY')
        _animationActionFly.reset().fadeIn(0.5).play()
        setLeaveT(1)
      }
    }
  })

  window.debugDragon = gltf
  
  const s = props.scale
  return (
    <Suspense>
      <object3D ref={objRef} scale={[s,s,s]} position={_positionStartWorld}>
        <primitive object={model} />
      </object3D>
    </Suspense>
  )
})


export default Dragon
