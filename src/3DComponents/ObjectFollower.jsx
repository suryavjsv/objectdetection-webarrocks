import { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react'
import {
  Matrix4,
  Vector3,
} from 'three'

import Flame from './Flame'
import FlameThrow from './FlameThrow'
import Dragon from './Dragon'


// This mesh follows the object. put stuffs in it.
// Its position and orientation is controlled by the THREE.js helper

const FLAMETHROW_OFFSET = new Vector3(0, -0.05, 0) // Y- -> lower

// avoid dynamic allocation:
const _m4 = new Matrix4()


const ObjectFollower = forwardRef((props, ref) => {
  const [isFlame, setIsFlame] = useState(false)
  const [isFlameThrow, setIsFlameThrow] = useState(false)
  const [flameThrowOrigin, setFlameThrowOrigin] = useState([1, 1, 0])

  const objRef = useRef()
  const objSceneRef = useRef()
  const dragonRef = useRef()

  useEffect(() => {
    const threeObject3D = objRef.current
    props.threeHelper.set_objectFollower(props.label, threeObject3D)
  }, [])

  useEffect(() => {
    if (props.isInitialized){
      objRef.current.visible = true
    }
  }, [props.isInitialized])


  const reset = () => {
    setIsFlame(false)
    setIsFlameThrow(false)
    if (dragonRef.current){
      dragonRef.current.reset()
    }
    console.log('  Reset ObjectFollower')
  }

  useImperativeHandle(ref, () => {
    return {
      reset
    }
   }, [])

  const update_dragonFlameThrowingPosition = (pos) => {
    // pos is in world coordinates
    // we need to put pos in the ObjectFollower ref
    objSceneRef.current.updateMatrixWorld()
    _m4.copy(objSceneRef.current.matrixWorld).invert()
    pos.applyMatrix4(_m4)

    pos.add(FLAMETHROW_OFFSET)
    setFlameThrowOrigin(pos.toArray())
  }

  const onDragonFlameThrowing = (isFlameThrowing) => {
    //if (!isFlameThrowing) return // debug: do not turn off the flame throwing
    setIsFlameThrow(isFlameThrowing)
  }

  const onFlame = (isFlame) => {
    setIsFlame(isFlame)
  }

  return (
    <object3D ref={objRef} visible={false}>
      {
        (props.isInitialized && props.isDetected) && (
          <object3D ref={objSceneRef} position={[0.11,0.14,0]}>
            {/*<hemisphereLight
              groundColor={0x303030}
              color={0xe0e0ff}
              intensity={3}
            />*/}
            <ambientLight color={0xffffff} intensity={2} />
            {/*<directionalLight
              intensity={20}
              position={[0,0,-1]}
              color={0xffffff}
            />*/}
            <Dragon scale={2} pathDuration={2}
              ref={dragonRef}
              update_flameThrowingPosition={update_dragonFlameThrowingPosition}
              onFlameThrowing={onDragonFlameThrowing}
              onFlame={onFlame}
              />
            { (isFlameThrow ) && (
              <FlameThrow scale={0.8} target={[0,0.1,0]}
                radius={0.1} height={4} particleCount={1000}
                origin={flameThrowOrigin} />
            )}
            { (isFlame ) && (
              <Flame scale={0.2} speedFactor={3} growthSpeedFactor={1.5} />
            )}
          </object3D>
        )
      }
    </object3D>
  )
})


export default ObjectFollower 
