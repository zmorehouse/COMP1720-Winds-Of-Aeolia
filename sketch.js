let windLines = [];
let numLines = 100;
let soundFreq = [220, 246, 261, 293, 329, 349, 392]; 
let oscillators = [];
let colors;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colors = [
    color(190, 220, 180), 
    color(230, 220, 200), 
    color(140, 110, 90)   
  ];
  
  for (let i = 0; i < numLines; i++) {
    windLines.push(new WindLine());
  }
  
  for (let i = 0; i < soundFreq.length; i++) {
    let osc = new p5.Oscillator('sine');
    osc.freq(soundFreq[i]);
    osc.amp(0);  
    osc.start();
    oscillators.push(osc);
  }
}

function draw() {
  background(255); 
  noFill();
  

  for (let line of windLines) {
    line.update();
    line.display();
  }
  

  if (mouseIsPressed) {
    for (let i = 0; i < oscillators.length; i++) {
      let distance = dist(mouseX, mouseY, width/2, height/2);  
      let amp = map(distance, 0, width/2, 0.05, 0);  
      oscillators[i].amp(amp);
    }
  } else {
    for (let osc of oscillators) {
      osc.amp(0, 0.1);  
    }
  }
}

class WindLine {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.xSpeed = random(1, 3);
    this.ySpeed = random(1, 3);
    this.color = random(colors);
    this.size = random(2, 6);
  }
  
  update() {
    this.x += this.xSpeed;
    this.y += this.ySpeed;
    
    if (this.x > width || this.x < 0) this.xSpeed *= -1;
    if (this.y > height || this.y < 0) this.ySpeed *= -1;
    
    if (mouseIsPressed) {
      let windStrength = dist(mouseX, mouseY, this.x, this.y) / 100;
      this.xSpeed += random(-windStrength, windStrength);
      this.ySpeed += random(-windStrength, windStrength);
    }
  }
  
  display() {
    stroke(this.color);
    strokeWeight(this.size);
    line(this.x, this.y, this.x + random(-10, 10), this.y + random(-10, 10));
  }
}
