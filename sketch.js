// Winds of Aeolia by Zac Morehouse - u7637337

// Arrays for different components
let strings = [];
let particles = [];
let ripples = [];

// Wind variables
let windSpeed;
let soundFile, fft;
let windDirection = 0;
let targetWindDirection = 0.2;
let smoothBlowIntensity = 1;
let WIND_BOUND = 0.3;
let osc;

// Ripple variables
let lastRippleTime = 0;
let rippleInterval = 150;

// Initialize colors dictionary
let colors = {
  springStart: "#6d7855",   
  springEnd: "#1b3d00",     
  summerStart: "#003366",   
  summerEnd: "#001f3f",    
  autumnStart: "#5f969e",   
  autumnEnd: "#1f7e8c",     
  winterStart: "#7d9447",  
  winterEnd: "#9e8d4a",     
  string: "#e9ac1f",
  particleColors: ["#FFFFFF", "#FFF8E1", "#B3E5FC"],
  ripple: "#f0ece2",

};

// Vars for transitions
let timeFactor = 0;             
let transitionSpeed = 0.005;    
let pauseDuration = 400;        
let phase = 7;                
let pauseCounter = 0;         

function preload() {
  soundFile = loadSound("assets/windaudio.mp3"); // Load wind audio
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Init wind sound FFT analysis
  fft = new p5.FFT(0.9, 16);
  fft.setInput(soundFile);
  soundFile.loop(); // Loop the wind sound

  // Init oscillator
  osc = new p5.Oscillator("sine");
  osc.start();
  osc.amp(0);

  let majorChordFrequencies = [
    // Frequencies for a Pentatonic Scale
    146.83, // D3
    164.81, // E3
    196.0, // G3
    220.0, // A3
    246.94, // B3
    293.66, // D4
    329.63, // E4
    392.0, // G4
    440.0, // A4
    493.88, // B4
    587.33, // D5
    659.25, // E5
    784.0, // G5
    880.0, // A5
    987.77, // B5
  ];

  // Create harp strings
  for (let i = 0; i < 10; i++) {
    let x = map(i, 0, 9, width / 4, (3 * width) / 4);
    let baseRandomness = random(0.8, 1.2);
    let frequency = majorChordFrequencies[i];
    strings.push(
      new HarpString(
        x,
        -height / 2,
        height * 1.5,
        i * 0.1 * width,
        baseRandomness,
        i,
        frequency
      )
    );
  }

  // Create particles
  for (let i = 0; i < 50; i++) {
    particles.push(
      new Particle(random(width), random(height), random(colors.particleColors))
    );
  }

  frameRate(30);
}

// Draw function to update the canvas on each frame
function draw() {
  drawGradientBackground();

  // Smooth transition for wind direction
  windDirection = lerp(windDirection, targetWindDirection, 0.01);
  windDirection = constrain(windDirection, -WIND_BOUND, WIND_BOUND);

  // Analyze wind sound spectrum
  let spectrum = fft.analyze();
  let energy = fft.getEnergy("bass", "treble");
  let blowIntensity = map(energy, 120, 180, height * 0.1, height * 0.4);

    smoothBlowIntensity = lerp(smoothBlowIntensity, blowIntensity, 0.3); 

  // Particles
  for (let particle of particles) {
    particle.update(windDirection, smoothBlowIntensity);
    particle.display();
  }

  // Strings
  for (let string of strings) {
    string.update(smoothBlowIntensity, windDirection);
    string.display();
  }

  // Ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].update();
    ripples[i].display();
    if (ripples[i].isFinished()) {
      ripples.splice(i, 1);
    }
  }
}

// Gradient / Background Func
function updateTransitionPhase() {
  if (phase % 2 === 0) { // Transition phases (0, 2, 4, 6)
    timeFactor += transitionSpeed;
    if (timeFactor >= 1) {
      timeFactor = 1;
      phase++;
      pauseCounter = 0;
    }
  } else { // Pause phases (1, 3, 5, 7)
    pauseCounter++;
    if (pauseCounter >= pauseDuration) {
      timeFactor = 0;
      phase++;
    }
  }

  // If the phase reaches 8 (full loop completed), reset to 0
  if (phase >= 8) {
    phase = 0;
  }
}

// Gradient / Background Func
function drawGradientBackground() {
  updateTransitionPhase();

  let cx = width / 2;
  let cy = height / 2;
  let maxRadius = dist(0, 0, cx, cy);
  let step = 10;

  let bgStartColor, bgEndColor;

  // Handle each transition phase and set colors accordingly
  if (phase === 0) {
    // Spring (Green to Deep Blue for Summer)
    bgStartColor = lerpColor(color(colors.springStart), color(colors.summerStart), timeFactor);
    bgEndColor = lerpColor(color(colors.springEnd), color(colors.summerEnd), timeFactor);
  } else if (phase === 2) {
    // Summer (Deep Blue to Autumn Yellow)
    bgStartColor = lerpColor(color(colors.summerStart), color(colors.autumnStart), timeFactor);
    bgEndColor = lerpColor(color(colors.summerEnd), color(colors.autumnEnd), timeFactor);
  } else if (phase === 4) {
    // Autumn (Yellow to Winter Blue)
    bgStartColor = lerpColor(color(colors.autumnStart), color(colors.winterStart), timeFactor);
    bgEndColor = lerpColor(color(colors.autumnEnd), color(colors.winterEnd), timeFactor);
  } else if (phase === 6) {
    // Winter (Blue back to Spring Green)
    bgStartColor = lerpColor(color(colors.winterStart), color(colors.springStart), timeFactor);
    bgEndColor = lerpColor(color(colors.winterEnd), color(colors.springEnd), timeFactor);
  } else {
    // Paused phases
    if (phase === 1) {
      bgStartColor = color(colors.summerStart);
      bgEndColor = color(colors.summerEnd);
    } else if (phase === 3) {
      bgStartColor = color(colors.autumnStart);
      bgEndColor = color(colors.autumnEnd);
    } else if (phase === 5) {
      bgStartColor = color(colors.winterStart);
      bgEndColor = color(colors.winterEnd);
    } else if (phase === 7) {
      bgStartColor = color(colors.springStart);
      bgEndColor = color(colors.springEnd);
    }
  }

  // Draw the gradient background using concentric circles
  for (let r = maxRadius; r > 0; r -= step) {
    let inter = map(r, 0, maxRadius, 0, 1);
    let c = lerpColor(bgStartColor, bgEndColor, inter);
    noStroke();
    fill(c);
    ellipse(cx, cy, r * 2, r * 2);
  }
}

// Create a ripple on click
function mousePressed() {
  createRipple(mouseX, mouseY);
}

// Create ripples on mouse drag
function mouseDragged() {
  if (millis() - lastRippleTime > rippleInterval) {
    // Delay to ensure ripples cant be spammed
    createRipple(mouseX, mouseY);
    lastRippleTime = millis();
  }
}

// Func to create a ripple
function createRipple(x, y) {
  ripples.push(new Ripple(x, y, strings));
}

// Particle class for wind blown particles
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = random(width * 0.005, width * 0.01);
    this.speed = random(0.05, 0.2);
    this.alpha = random(100, 200);
    this.color = color;
    this.angle = random(TWO_PI);
    this.rotationSpeed = random(-0.05, 0.05);
    this.fallSpeed = random(1.5, 2.5);

    // Randomly allocate petal type
    this.isPointedPetal = random(1) > 0.8;
  }

  update(windDirection, blowIntensity) {
    this.y += this.fallSpeed;
    this.x += windDirection * this.speed * (blowIntensity * 1.2);

    // Loop back particles to the top when they fall off the bottom
    if (this.y > height) this.y = 0;
    if (this.x > width) this.x = 0;
    if (this.x < 0) this.x = width;

    this.angle += this.rotationSpeed;
  }

  display() {
    noStroke();
    fill(this.color + hex(this.alpha, 2));
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    if (this.isPointedPetal) {
      this.drawPointedPetal();
    } else {
      this.drawPetal();
    }
    pop();
  }

  drawPetal() {
    beginShape();
    vertex(0, -this.size / 2);
    bezierVertex(
      this.size / 2,
      -this.size / 2,
      this.size / 2,
      this.size / 2,
      0,
      this.size
    );
    bezierVertex(
      -this.size / 2,
      this.size / 2,
      -this.size / 2,
      -this.size / 2,
      0,
      -this.size / 2
    );
    endShape(CLOSE);
  }

  drawPointedPetal() {
    beginShape();
    vertex(0, -this.size);
    bezierVertex(
      this.size / 3,
      -this.size / 2,
      this.size / 2,
      this.size / 2,
      0,
      this.size
    );
    bezierVertex(
      -this.size / 2,
      this.size / 4,
      -this.size / 2,
      -this.size / 2,
      0,
      -this.size
    );
    endShape(CLOSE);
  }
}

// HarpString class
class HarpString {
  constructor(x, y1, y2, offset, baseRandomness, index, frequency) {
    this.x = x;
    this.y1 = y1;
    this.y2 = y2;
    this.offset = offset;
    this.baseRandomness = baseRandomness;
    this.index = index;
    this.frequency = frequency;
    this.vertices = [];
    this.triggered = false;
    this.glowIntensity = 0.5;
    this.minGlow = 0.5;
    this.maxGlow = 3;
    this.glowColor = color(214, 155, 45);
    this.goldColor = color(255, 196, 92);

    // Create an oscillator for each string and reuse it
    this.oscillator = new p5.Oscillator("sine");
    this.oscillator.start();
    this.oscillator.amp(0);
  }


  update(blowIntensity, windDirection) {
    let timeVaryingRandomness =
      this.baseRandomness +
      (noise(this.offset + frameCount * 0.01) - 0.5) * 0.3; // Time-based randomness
    this.blowFactor = blowIntensity * timeVaryingRandomness * windDirection * 2;
    this.vertices = [];
    this.triggered = false;

    // Generate coordinates for the string based on blow intensity
    for (let i = 0; i <= 1; i += 0.01) {
      let x = this.x + this.blowFactor * sin(PI * i);
      let y = lerp(this.y1, this.y2, i);
      this.vertices.push({ x, y });
    }

    // Gradually reduce glow intensity if not triggered and transition back to dull white
    if (!this.triggered) {
      this.glowIntensity = lerp(this.glowIntensity, this.minGlow, 0.05);
      this.glowColor = lerpColor(
        this.goldColor,
        color(214, 155, 45),
        map(this.glowIntensity, this.minGlow, this.maxGlow, 0, 1)
      );
    }
  }

  display() {
    let throbbingGlow = 1 + 0.1 * sin(frameCount * 0.05); // Glow throb effect

    // Draw the outer glow with a throbbing effect but keep the alpha (transparency) consistent
    for (let i = 10; i > 0; i--) {
      let alphaValue = map(
        i,
        10,
        0,
        0,
        14 * this.glowIntensity * throbbingGlow
      );
      stroke(`rgba(232, 183, 93, ${alphaValue / 255})`); // Keep the glow white, controlled by alpha
      strokeWeight(width * (0.006 + 0.001 * i));
      noFill();
      beginShape();
      for (let vertex of this.vertices) {
        curveVertex(vertex.x, vertex.y);
      }
      endShape();
    }

    // Draw the actual string with the current color (transitioning from white to gold)
    stroke(this.glowColor); // Use the current color of the string (white to gold)
    strokeWeight(width * 0.0035);
    noFill();
    beginShape();
    for (let vertex of this.vertices) {
      curveVertex(vertex.x, vertex.y);
    }
    endShape();
  }


  playSound() {
    if (!this.triggered) {
      this.oscillator.freq(this.frequency);
      this.oscillator.amp(0.25, 0.2); // Fade in / out
      this.oscillator.amp(0, 1.5);
      this.triggered = true;
      this.glowIntensity = this.maxGlow;
      this.glowColor = this.goldColor;
    }
  }
}

// Ripple class
class Ripple {
  constructor(x, y, strings) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.lifespan = 255;
    this.strings = strings;
    this.oscillators = []; // Array of oscillators for each string
    for (let i = 0; i < strings.length; i++) {
      this.oscillators[i] = new p5.Oscillator("sine");
      this.oscillators[i].start();
      this.oscillators[i].amp(0);
    }

    this.adjustWindDirection(); // Adjust wind direction based on ripple position
  }

  adjustWindDirection() {
    let influence = map(this.x, 0, width, 0.35, -0.35); // Calculate wind direction based on ripple position

    targetWindDirection = lerp(
      targetWindDirection,
      targetWindDirection + influence,
      0.1
    );
    targetWindDirection = constrain(
      targetWindDirection,
      -WIND_BOUND,
      WIND_BOUND
    );
  }

  update() {
    this.radius += width * 0.002;
    this.lifespan -= 10;
    this.checkCollision();
  }

  display() {
    noFill();
    let alphaValue = constrain(this.lifespan, 0, 255); // Gradually fade out riple
    stroke(color(colors.ripple + hex(alphaValue, 2)));
    strokeWeight(width * 0.002);
    ellipse(this.x, this.y, this.radius * 2);
  }

  checkCollision() {
    for (let string of this.strings) {
      for (let vertex of string.vertices) {
        let d = dist(this.x, this.y, vertex.x, vertex.y);
        if (d < this.radius && !string.triggered) {
          // Play sound with the existing oscillator in the string
          string.playSound();
          string.triggered = true;
        }
      }
    }
  }
  
  

  isFinished() {
    return this.lifespan <= 0; // Ripple is finished when lifespan is zero
  }
}
