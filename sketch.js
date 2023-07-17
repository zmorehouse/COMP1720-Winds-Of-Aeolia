function setup() {
  // create the canvas using the full browser window
  createCanvas(windowWidth, windowHeight);

  // draw a border to help you see the size
  // this isn't compulsory (remove this code if you like)
  strokeWeight(5);
  // Note the use of width and height here, you will probably use this a lot 
  // in your sketch.
  rect(0, 0, width, height);
}

function draw() {
  // your cool abstract sonic artwork code goes in this draw function
  
}

// when you hit the spacebar, what's currently on the canvas will be saved (as a
// "thumbnail.png" file) to your downloads folder
function keyTyped() {
  if (key === " ") {
    saveCanvas("thumbnail.png");
  }
}
