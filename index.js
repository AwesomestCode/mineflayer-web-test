/* global THREE, fetch */

// Workaround for process.versions.node not existing in the browser
process.versions.node = '14.0.0'

const mineflayer = require('mineflayer')
const { WorldView, Viewer, MapControls } = require('prismarine-viewer/viewer')
const { Vec3 } = require('vec3')
global.THREE = require('three')

const chat = require('./chat')

const maxPitch = 0.5 * Math.PI;
const minPitch = -0.5 * Math.PI;

async function main () {
  const viewDistance = 4
    
  const bot = mineflayer.createBot({
    host: prompt('What server would you like to connect to? Do not include the port.'),
    port: prompt('What port is this server on? Enter 25565 if you don\'t know.'),
    username: prompt('What username would you like to connect with?'),
  })

  bot.once('spawn', () => {
    console.log('bot spawned - starting viewer')

    const version = bot.version

    const center = bot.entity.position

    const worldView = new WorldView(bot.world, viewDistance, center)


    // Create three.js context, add to page
    const renderer = new THREE.WebGLRenderer()


    renderer.setPixelRatio(window.devicePixelRatio || 1)
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    chat.init(undefined, bot._client, renderer)

    // Create viewer
    const viewer = new Viewer(renderer)
    viewer.setVersion(version)

    worldView.listenToBot(bot)
    worldView.init(bot.entity.position)

    function botPosition () {
      viewer.setFirstPersonCamera(bot.entity.position, bot.entity.yaw, bot.entity.pitch)
      worldView.updatePosition(bot.entity.position)
    }

    bot.on('move', botPosition)

    bot.on('chunkColumnLoad', () => {
      console.log('chunkload')
    })

    // Link WorldView and Viewer
    viewer.listen(worldView)

    viewer.camera.position.set(center.x, center.y, center.z)

    function moveCallback (e) {
      bot.entity.pitch -= e.movementY * 0.01
      bot.entity.pitch = Math.max(minPitch, Math.min(maxPitch, bot.entity.pitch));
      bot.entity.yaw -= e.movementX * 0.01
      viewer.setFirstPersonCamera(bot.entity.position, bot.entity.yaw, bot.entity.pitch)
    }
    function changeCallback() {
      if (document.pointerLockElement === renderer.domElement ||
        document.mozPointerLockElement === renderer.domElement ||
        document.webkitPointerLockElement === renderer.domElement) {
        document.addEventListener("mousemove", moveCallback, false)
      } else {
        document.removeEventListener("mousemove", moveCallback, false)
      }
    }
    document.addEventListener('pointerlockchange', changeCallback, false)
    document.addEventListener('mozpointerlockchange', changeCallback, false)
    document.addEventListener('webkitpointerlockchange', changeCallback, false)
    renderer.domElement.requestPointerLock = renderer.domElement.requestPointerLock ||
      renderer.domElement.mozRequestPointerLock ||
      renderer.domElement.webkitRequestPointerLock
    document.addEventListener('mousedown', (e) => {
      renderer.domElement.requestPointerLock()
    })

    document.addEventListener('contextmenu', (e) => e.preventDefault(), false)
    document.addEventListener('keydown', (e) => {
      console.log (e.code )
      if (e.code === 'KeyW') {
        bot.setControlState('forward', true)
      } else if (e.code === 'KeyS') {
        bot.setControlState('back', true)
      } else if (e.code === 'KeyA') {
        bot.setControlState('right', true)
      } else if (e.code === 'KeyD') {
        bot.setControlState('left', true)
      } else if (e.code === 'Space') {
        bot.setControlState('jump', true)
      } else if (e.code === 'KeyI') {
        console.log("DEBUG LOG (request by pressing the I key)");
        console.log("Current pitch: " + bot.entity.pitch);
        console.log("Current yaw: " + bot.entity.yaw);
      }
    }, false)
    document.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW') {
        bot.setControlState('forward', false)
      } else if (e.code === 'KeyS') {
        bot.setControlState('back', false)
      } else if (e.code === 'KeyA') {
        bot.setControlState('right', false)
      } else if (e.code === 'KeyD') {
        bot.setControlState('left', false)
      } else if (e.code === 'Space') {
        bot.setControlState('jump', false)
      }
    }, false)

    // Browser animation loop
    const animate = () => {
      window.requestAnimationFrame(animate)
      renderer.render(viewer.scene, viewer.camera)
    }
    animate()
  })
}
main()
