let waveLines = [];
let numLines = 10;
let maxOffset = 100;
let colors;
let oscillators = [];
let soundFreq = [220, 246, 261, 293, 329, 349, 392]; 
let waveSpeed = 0.5;
let thickness = 15; 
let clicked = false; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  noFill();
  
  colors = [
    color(190, 220, 180, 100), //  green
    color(230, 220, 200, 100), //  white
    color(140, 110, 90, 100)   //  brown
  ];
  
  for (let i = 0; i < numLines; i++) {
    waveLines.push(new WaveLine(i * (height / numLines)));
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
  background(255, 100); 
  for (let line of waveLines) {
    line.update();
    line.display();
  }
  
  if (!clicked) {
    for (let osc of oscillators) {
      osc.amp(0, 0.5); 
    }
  }
}

function mousePressed() {
  clicked = true;
  for (let osc of oscillators) {
    osc.amp(0.1, 0.1); 
  }
}

function mouseReleased() {
  clicked = false;
}

class WaveLine {
  constructor(y) {
    this.y = y; 
    this.xOffset = 0;
    this.baseY = y; 
  }

  update() {
    this.xOffset += waveSpeed;
  }

  display() {
    strokeWeight(thickness);
    let col = colors[int(random(colors.length))];
    stroke(col);

    beginShape();
    for (let x = 0; x < width; x += 10) {
      let y = this.baseY + sin((x + this.xOffset) * 0.02) * 50;

      if (clicked) {
        let d = dist(x, y, mouseX, mouseY);
        
        if (d < maxOffset) {
          let angle = atan2(y - mouseY, x - mouseX); 
          
          if (y < mouseY) {
            y -= (maxOffset - d) * 0.5 * sin(angle); 
          } else {
            y += (maxOffset - d) * 0.5 * sin(angle); 
          }
        }
      }

      vertex(x, y); 
    }
    endShape();
  }
}
