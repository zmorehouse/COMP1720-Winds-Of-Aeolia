let strings = [];
let windSpeed;
let soundFile, fft;
let windDirection = 0.2; 
let smoothBlowIntensity = 1; 
let particles = []; 

function preload() {
  soundFile = loadSound('windaudio.mp3'); 
}

function setup() {
  createCanvas(windowWidth, windowHeight); 
  fft = new p5.FFT(0.9, 16); 
  fft.setInput(soundFile);
  soundFile.loop(); 

  for (let i = 0; i < 10; i++) {
    let x = map(i, 0, 9, width / 4, (3 * width) / 4);
    let baseRandomness = random(0.8, 1.2); 
    strings.push(new HarpString(x, -height / 2, height * 1.5, i * 0.1, baseRandomness)); 
  }

  for (let i = 0; i < 50; i++) {
    particles.push(new Particle(random(width), random(height)));
  }

  frameRate(30); 
}

function draw() {
  background(10, 10, 30); 

  if (keyIsDown(LEFT_ARROW)) {
    windDirection -= 0.05; 
  } 
  if (keyIsDown(RIGHT_ARROW)) {
    windDirection += 0.05; 
  }

  windDirection = constrain(windDirection, -2, 2);

  let spectrum = fft.analyze();
  let energy = fft.getEnergy("bass", "treble");
  let blowIntensity = map(energy, 0, 255, 5, 100); 

  smoothBlowIntensity = lerp(smoothBlowIntensity, blowIntensity, 0.1); 

  for (let particle of particles) {
    particle.update(windDirection, smoothBlowIntensity);
    particle.display();
  }

  for (let string of strings) {
    string.update(smoothBlowIntensity, windDirection); 
    string.display();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight); 
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(2, 5);
    this.speed = random(0.5, 2);
    this.alpha = random(100, 200);
  }

  update(windDirection, blowIntensity) {
    this.x += windDirection * this.speed;
    this.y += sin(frameCount * 0.01) * this.speed * blowIntensity * 0.01; 

    if (this.x > width) this.x = 0;
    if (this.x < 0) this.x = width;
    if (this.y > height) this.y = 0;
    if (this.y < 0) this.y = height;
  }

  display() {
    noStroke();
    fill(255, this.alpha);
    ellipse(this.x, this.y, this.size);
  }
}

class HarpString {
  constructor(x, y1, y2, offset, baseRandomness) {
    this.x = x;
    this.y1 = y1;
    this.y2 = y2;
    this.offset = offset;
    this.baseRandomness = baseRandomness; 
  }

  update(blowIntensity, windDirection) {
    let timeVaryingRandomness = this.baseRandomness + (noise(this.offset + frameCount * 0.01) - 0.5) * 0.1;
    this.blowFactor = blowIntensity * timeVaryingRandomness * windDirection; 
  }

  display() {
    for (let j = -3; j <= 3; j++) {
      let alpha = map(abs(j), 0, 3, 200, 50); 
      let weight = map(abs(j), 0, 3, 8, 3); 
      stroke(255, 255, 255, alpha);
      strokeWeight(weight);

      noFill();
      beginShape();
      for (let i = 0; i <= 1; i += 0.01) {
        let x = this.x + this.blowFactor * sin(PI * i) + j; 
        let y = lerp(this.y1, this.y2, i);
        vertex(x, y);
      }
      endShape();
    }
  }
}
