import init, * as wasm from "./wasm.js"

const WIDTH = 64
const HEIGHT = 32
const SCALE = 15
const TICKS_PER_FRAME = 10
let anim_frame = 0

const canvas = document.getElementById("canvas")
canvas.width = WIDTH * SCALE
canvas.height = HEIGHT * SCALE

const ctx = canvas.getContext("2d")
ctx.fillStyle = "black"
ctx.fillRect(0, 0, WIDTH * SCALE, HEIGHT * SCALE)

const gameListElement = document.getElementById("game-list")
/**
 * Function to create stars and append them to the starfield
 * @param {number} count - Number of stars to generate
 */
function createStars(count) {
  const starfield = document.querySelector('.starfield');
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    
    star.style.top = `${Math.random() * 100}%`;
    star.style.left = `${Math.random() * 100}%`;
    const colors = ['#ffffff', '#ffdd57', '#a0c4ff', '#ffadad'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 2 + 1; // 1px to 3px
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.backgroundColor = color; 
    const duration = Math.random() * 3 + 2; // 2s to 5s
    star.style.animationDuration = `${duration}s`;
    
    const delay = Math.random() * 5;
    star.style.animationDelay = `${delay}s`;
    
    starfield.appendChild(star);
  }
}
async function run() {
  await init()
  let chip8 = new wasm.EmuWasm()

  createStars(100);
  document.addEventListener("keydown", function(evt) {
    chip8.keypress(evt, true)
  })

  document.addEventListener("keyup", function(evt) {
    chip8.keypress(evt, false)
  })
 fetch('roms.json')
    .then(response => response.json())
    .then(roms => {
      roms.forEach(rom => {
        const li = document.createElement("li");
        const button = document.createElement("button");
        button.textContent = rom.name;
        button.onclick = () => loadAndRunGame(chip8, rom.file);
        li.appendChild(button);
        gameListElement.appendChild(li);
      });
    })
    .catch(err => {
      console.error("Failed to load ROMs:", err);
    });
}

run().catch(console.error)

/**
 * Function to load and run a selected game
 * @param {Object} chip8 - The emulator instance
 * @param {string} romPath - Path to the ROM file
 */
function loadAndRunGame(chip8, romPath) {
  // Stop previous game from rendering, if one exists
  if (anim_frame !== 0) {
    window.cancelAnimationFrame(anim_frame);
  }

  fetch(romPath)
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to load ROM");
      }
      return response.arrayBuffer();
    })
    .then(buffer => {
      const rom = new Uint8Array(buffer);
      chip8.reset();
      chip8.load_game(rom);
      mainloop(chip8);
    })
    .catch(err => {
      alert(err.message);
      console.error(err);
    });
}

/**
 * Main loop to run the emulator and render frames
 * @param {Object} chip8 - The emulator instance
 */
function mainloop(chip8) {
   for (let i = 0; i < TICKS_PER_FRAME; i++) {
        chip8.tick()
    }
    chip8.tick_timers()

    // Clear the canvas before drawing
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, WIDTH * SCALE, HEIGHT * SCALE)

    // Set the draw color back to white before we render our frame
    ctx.fillStyle = "white"
    chip8.draw_screen(SCALE)

    anim_frame = window.requestAnimationFrame(() => {
        mainloop(chip8)
    })
}
