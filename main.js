import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import sceneFile from './scene.glb'
import textures from 'textures/*.png'

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 21
camera.position.y = 9
camera.position.z = 23
scene.add(camera)

const radarGroup = new THREE.Group()
scene.add(radarGroup)

const cubeTextureLoader = new THREE.CubeTextureLoader()
const envMap = cubeTextureLoader.load([textures.px, textures.nx, textures.py, textures.ny, textures.pz, textures.nz])
envMap.encoding = THREE.sRGBEncoding
scene.background = envMap
scene.environment = envMap

let mixer

const modelLoader = new GLTFLoader()
modelLoader.load(sceneFile,
  (gltf) => {

    var model = gltf.scene
    mixer = new THREE.AnimationMixer(gltf.scene)

    if (typeof model !== 'undefined' && typeof model.traverse !== 'undefined') {
      model.traverse(function(ob){
        if (ob.name !== 'Ground')
          ob.castShadow = true
        else
          ob.receiveShadow = true

        if (ob.name == 'AirportControlTower') {
          ob.children[0].receiveShadow = true
          ob.receiveShadow = true
        }

        if (ob.name == 'RadarThing') {
          ob.visible = false
          const radar = ob.clone()
          radar.castShadow = true
          radar.visible = true
          radarGroup.add(radar)
        }
      })
    }
    scene.add(model)

    gltf.animations.forEach((clip) => {
      mixer.clipAction(clip).play()
    })
  }, (xhr) => {},
  (err) => { console.log(err) }
)

// Lighting
const light = new THREE.AmbientLight( 0x404040, 4 ) // soft white light
scene.add( light )

const directionalLight = new THREE.DirectionalLight( 0xffffff, 3, 100 )
directionalLight.position.y = 10
directionalLight.castShadow = true
directionalLight.shadow.camera.far = 50
directionalLight.shadow.camera.left = -15
directionalLight.shadow.camera.right = 15
directionalLight.shadow.camera.top = 15
directionalLight.shadow.camera.bottom = -15
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.normalBias = 0.05
scene.add( directionalLight )

// Controls
const controls = new OrbitControls(camera, canvas)

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.physicallyCorrectLights = true
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
//renderer.toneMapping = THREE.ACESFilmicToneMapping

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    // Update controls
    controls.update()

    var delta = clock.getDelta()
    if (mixer) mixer.update(delta)

    const elapsedTime = clock.getElapsedTime()

    if (radarGroup.children.length > 0)
      radarGroup.children[0].rotation.y = elapsedTime

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
