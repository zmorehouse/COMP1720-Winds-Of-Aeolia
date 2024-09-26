let strings = [];
let windSpeed;
let soundFile, fft;
let windDirection = 0;
let targetWindDirection = 0.2;
let smoothBlowIntensity = 1;
let particles = [];
let ripples = [];
let osc;
let lastRippleTime = 0;
let rippleInterval = 150; 

let colors = {
  backgroundStart: '#848E62', 
  backgroundEnd: '#4C5D22',   
  string: '#f0ece2', 
  particleColors: ['#e1faf9', '#b1e6e3', '#e6dbbc', '#6d6875'], 
  ripple: '#f0ece2'           
};

const WIND_BOUND = 0.3; 

function preload() {
  soundFile = loadSound('/assets/windaudio.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  fft = new p5.FFT(0.9, 16);
  fft.setInput(soundFile);
  soundFile.loop();

  osc = new p5.Oscillator('sine');
  osc.start();
  osc.amp(0);

  let majorChordFrequencies = [ // Pentatonic Scale
    146.83, // D3
    164.81, // E3
    196.00, // G3
    220.00, // A3
    246.94, // B3
    293.66, // D4
    329.63, // E4
    392.00, // G4
    440.00, // A4
    493.88, // B4
    587.33, // D5
    659.25, // E5
    784.00, // G5
    880.00, // A5
    987.77  // B5
  ];
  for (let i = 0; i < 10; i++) {
    let x = map(i, 0, 9, width / 4, (3 * width) / 4);
    let baseRandomness = random(0.8, 1.2);
    let frequency = majorChordFrequencies[i]; 
    strings.push(new HarpString(x, -height / 2, height * 1.5, i * 0.1 * width, baseRandomness, i, frequency));
  }

  for (let i = 0; i < 50; i++) {
    particles.push(new Particle(random(width), random(height), random(colors.particleColors)));
  }

  frameRate(30);
}

function draw() {
  drawGradientBackground();

  windDirection = lerp(windDirection, targetWindDirection, 0.01);
  windDirection = constrain(windDirection, -WIND_BOUND, WIND_BOUND); 

  let spectrum = fft.analyze();
  let energy = fft.getEnergy("bass", "treble");
  let blowIntensity = map(energy, 120, 180, height * 0.1, height * 0.4);

  smoothBlowIntensity = lerp(smoothBlowIntensity, blowIntensity, 0.3);

  for (let particle of particles) {
    particle.update(windDirection, smoothBlowIntensity);
    particle.display();
  }

  for (let string of strings) {
    string.update(smoothBlowIntensity, windDirection);
    string.display();
  }

  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].update();
    ripples[i].display();
    if (ripples[i].isFinished()) {
      ripples.splice(i, 1);
    }
  }
}

function drawGradientBackground() {
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(color(colors.backgroundStart), color(colors.backgroundEnd), inter);
    stroke(c);
    line(0, y, width, y);
  }
}

function mousePressed() {
  createRipple(mouseX, mouseY);
}

function mouseDragged() {
  if (millis() - lastRippleTime > rippleInterval) {
    createRipple(mouseX, mouseY);
    lastRippleTime = millis();
  }
}

function createRipple(x, y) {
  ripples.push(new Ripple(x, y, strings));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  strings = []; 
  for (let i = 0; i < 10; i++) {
    let x = map(i, 0, 9, width / 4, (3 * width) / 4);
    let baseRandomness = random(0.8, 1.2);
    strings.push(new HarpString(x, -height / 2, height * 1.5, i * 0.1 * width, baseRandomness, i, frequency));
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = random(width * 0.002, width * 0.005);
    this.speed = random(0.5, 2);
    this.alpha = random(100, 200);
    this.color = color;
  }

  update(windDirection, blowIntensity) {
    this.y += windDirection * this.speed * 10; 
    this.x += sin(frameCount * 0.01) * this.speed * blowIntensity * 0.02;

    if (this.x > width) this.x = 0;
    if (this.x < 0) this.x = width;
    if (this.y > height) this.y = 0;
    if (this.y < 0) this.y = height;
}

  display() {
    noStroke();
    fill(this.color + hex(this.alpha, 2));
    ellipse(this.x, this.y, this.size);
  }
}

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
  }

  update(blowIntensity, windDirection) {
    let timeVaryingRandomness = this.baseRandomness + (noise(this.offset + frameCount * 0.01) - 0.5) * 0.3;
    this.blowFactor = blowIntensity * timeVaryingRandomness * windDirection * 2;
    this.vertices = [];
    this.triggered = false; 

    for (let i = 0; i <= 1; i += 0.01) {
      let x = this.x + this.blowFactor * sin(PI * i);
      let y = lerp(this.y1, this.y2, i);
      this.vertices.push({ x, y });
    }
  }

  display() {
    stroke(colors.string);
    strokeWeight(width * 0.003); 
    noFill();
    beginShape();
    for (let vertex of this.vertices) {
      curveVertex(vertex.x, vertex.y);
    }
    endShape();
  }

  playSound(osc) {
    if (!this.triggered) { 
      osc.freq(this.frequency);
      osc.amp(0.25, 0.2);
      osc.amp(0, 1.5);    
      this.triggered = true;
    }
  }
}

class Ripple {
  constructor(x, y, strings) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.lifespan = 255;
    this.strings = strings;
    this.oscillators = [];
    for (let i = 0; i < strings.length; i++) {
      this.oscillators[i] = new p5.Oscillator('sine');
      this.oscillators[i].start();
      this.oscillators[i].amp(0);
    }

    this.adjustWindDirection();
  }

  adjustWindDirection() {
    let influence = map(this.x, 0, width, 0.05, -0.05); 
    targetWindDirection += influence; 
    targetWindDirection = constrain(targetWindDirection, -WIND_BOUND, WIND_BOUND); 
  }

  update() {
    this.radius += width * 0.002; 
    this.lifespan -= 10; 
    this.checkCollision();
  }

  display() {
    noFill();
    let alphaValue = constrain(this.lifespan, 0, 255); 
    stroke(color(colors.ripple + hex(alphaValue, 2)));
    strokeWeight(width * 0.002); 
    ellipse(this.x, this.y, this.radius * 2);
  }

  checkCollision() {
    for (let i = 0; i < this.strings.length; i++) {
      let string = this.strings[i];
      for (let vertex of string.vertices) {
        let d = dist(this.x, this.y, vertex.x, vertex.y);
        if (d < this.radius && !string.triggered) {
          string.playSound(this.oscillators[i]);
          string.triggered = true; 
        }
      }
    }
  }

  isFinished() {
    return this.lifespan <= 0;
  }
}
