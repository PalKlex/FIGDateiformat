let video;
let frozenCanvases = [];
let lastFrozenTime = 0;
let lastSpawnTime = 0;
let spawnIntervalMin = 1000; // 1 second
let spawnIntervalMax = 5000; // 5 seconds
let maxCanvases = 100; // Increased maximum number of small canvases
let canvasDuration = 2000; // 2 seconds
let displayVideo = false;
let circleSize = 20;
let circleX = 100;
let circleY = 100;
let circleSpeed = 5;
let frameColor = 255; // Initial frame color
let largeCircleRadius = 150; // Radius of the large circle
let smallCanvasSpeed = 1; // Speed of small canvases on the large circle
let smallCanvasAngle = 0; // Angle of small canvases on the large circle
let timerDuration = 180000; // 3 minutes in milliseconds
let timer;
let numDotsBigCircle = 14; // Number of dots on the big circle

let canvasSizes = [
  { width: 30, height: 30, frequency: 50 }, // Lowered frequency
  { width: 50, height: 50, frequency: 100 }, // Lowered frequency
  { width: 70, height: 70, frequency: 150 }, // Lowered frequency
  { width: 80, height: 80, frequency: 200 } // Lowered frequency
];

let rotationCounter = 0; // Counter to track canvas rotations
let audioPlaying = false; // Track if audio is playing

function setup() {
  createCanvas(500, 1000);
  video = createCapture(VIDEO);
  video.size(100, 100); // Set the size of the video capture
  video.hide(); // Hide the video element

  // Start the timer
  timer = millis() + timerDuration;

  // Enable fullscreen mode on mobile devices
  if (isMobileDevice()) {
    fullscreen(true);
  }
}

function draw() {
  background(255);

  // Draw the timer
  let timeRemaining = max(0, ceil((timer - millis()) / 1000));
  textSize(20);
  fill(0);
  textAlign(CENTER);
  text("Time Remaining: " + nf(floor(timeRemaining / 60), 2) + ":" + nf(timeRemaining % 60, 2), width / 2, 30);

  // Draw the instruction text
  textSize(16);
  fill(0);
  text("Hold Red to move", width / 2, 60);

  // Check if time is up
  if (millis() >= timer) {
    resetSketch();
    return;
  }

  // Draw the last frozen canvas if available
  if (frozenCanvases.length > 0) {
    let lastCanvas = frozenCanvases[frozenCanvases.length - 1];
    image(lastCanvas.canvas, lastCanvas.x, lastCanvas.y, lastCanvas.width, lastCanvas.height);
  }

  // Check if it's time to freeze the frame and create a new canvas
  if (millis() - lastFrozenTime >= random(spawnIntervalMin, spawnIntervalMax)) {
    lastFrozenTime = millis();
    freezeFrame();
  }

  // Loop through frozen canvases
  for (let i = 0; i < frozenCanvases.length - 1; i++) {
    let canvas = frozenCanvases[i];
    image(canvas.canvas, canvas.x, canvas.y, canvas.width, canvas.height);
    if (millis() - canvas.startTime >= canvasDuration) {
      frozenCanvases.splice(i, 1); // Remove the canvas from the array
    }
  }

  // Draw the video if set to display
  if (displayVideo && frozenCanvases.length > 0) {
    let lastCanvas = frozenCanvases[frozenCanvases.length - 1];
    image(video, lastCanvas.x, lastCanvas.y, lastCanvas.width, lastCanvas.height); // Draw the video at the position of the last canvas with the size of the last canvas
  }

  // Update circle position with mouse or touch
  if (mouseIsPressed || (touches.length > 0 && touches[0])) {
    circleX = mouseIsPressed ? mouseX : touches[0].x;
    circleY = mouseIsPressed ? mouseY : touches[0].y;
  }

  // Ensure the circle stays within the canvas bounds
  circleX = constrain(circleX, 0, width - circleSize);
  circleY = constrain(circleY, 0, height - circleSize);

  // Ensure the circle doesn't overlap with the canvases
  let collisionDetected = false;
  for (let i = 0; i < frozenCanvases.length; i++) {
    let canvas = frozenCanvases[i];
    if (
      circleX + circleSize / 2 > canvas.x &&
      circleX - circleSize / 2 < canvas.x + canvas.width &&
      circleY + circleSize / 2 > canvas.y &&
      circleY - circleSize / 2 < canvas.y + canvas.height
    ) {
      // Calculate the overlap
      let overlapX = circleSize / 2 - abs(circleX - canvas.x - canvas.width / 2);
      let overlapY = circleSize / 2 - abs(circleY - canvas.y - canvas.height / 2);

      // Move the canvas
      canvas.x += overlapX * sign(circleX - canvas.x - canvas.width / 2);
      canvas.y += overlapY * sign(circleY - canvas.y - canvas.height / 2);

      collisionDetected = true;
    }
  }

  // Update frame color if a collision occurred
  frameColor = collisionDetected ? random(255) : 255;
  stroke(frameColor);
  strokeWeight(2);
  noFill();
  rect(0, 0, width, height);

  // Ensure the red circle doesn't enter the radius of the center circle
  let distToCenter = dist(circleX, circleY, width / 2, height / 2);
  if (distToCenter > largeCircleRadius) {
    circleX = circleX;
    circleY = circleY;
  }

  // Draw the movable circle
  noFill(); // Remove fill
  if (frozenCanvases.length > 0 && frozenCanvases[0].canvas === 1) {
    stroke(255); // Change stroke color to white
  } else {
    stroke(255, 0, 0); // Set stroke color to red
  }
  strokeWeight(2); // Set stroke weight
  ellipse(circleX, circleY, circleSize, circleSize);

  // Draw dots on the big circle
  stroke(200); // Set a lighter grey color
  strokeWeight(4); // Set stroke weight
  for (let i = 0; i < numDotsBigCircle; i++) {
    let angle = TWO_PI / numDotsBigCircle * i;
    let x = width / 2 + cos(angle) * largeCircleRadius;
    let y = height / 2 + sin(angle) * largeCircleRadius;
    point(x, y);
  }

  // Move small canvases along the large circle
  for (let i = 0; i < frozenCanvases.length; i++) {
    let canvas = frozenCanvases[i];
    if (
      dist(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2, width / 2, height / 2) <= largeCircleRadius + canvas.width / 2
    ) {
      // Move canvas along the circle
      let angle = smallCanvasAngle + TWO_PI / frozenCanvases.length * i;
      let x = width / 2 + cos(angle) * largeCircleRadius - canvas.width / 2;
      let y = height / 2 + sin(angle) * largeCircleRadius - canvas.height / 2;
      canvas.x = x;
      canvas.y = y;

      // Update angle for next frame
      smallCanvasAngle += radians(smallCanvasSpeed);

      // Check if canvas passes the 90-degree point (PI/2 radians)
      let angleInRadians = atan2(canvas.y - height / 2, canvas.x - width / 2);
      if (angleInRadians > PI / 2 && angleInRadians < PI) {
        // Check if canvas has completed 2 to 20 rotations
        if (rotationCounter >= 2 && rotationCounter <= 20) {
          // Play sound for 0.1 seconds
          if (!audioPlaying) {
            let canvasSizeIndex = i % (canvasSizes.length - 2); // Limit to mid-range frequencies
            let frequency = canvasSizes[canvasSizeIndex + 2].frequency; // Start from mid-range frequencies
            playSound(frequency);
            audioPlaying = true;
          }
        }
        // Increment rotation counter and reset if exceeds 20
        rotationCounter++;
        if (rotationCounter > 20) {
          rotationCounter = 0;
          audioPlaying = false;
        }
      }
    }
  }
}

function freezeFrame() {
  if (frozenCanvases.length >= maxCanvases) {
    // Remove the oldest canvases until the number of canvases is within the limit
    let numToRemove = frozenCanvases.length - maxCanvases + 1;
    frozenCanvases.splice(0, numToRemove);
  }

  // Randomly select a canvas size from the array
  let sizeIndex = floor(random(canvasSizes.length));
  let canvasSize = canvasSizes[sizeIndex];
  let canvasWidth = canvasSize.width;
  let canvasHeight = canvasSize.height;

  let attemptCount = 0;
  let x, y;
  let invalidSpawn = true;
  while (invalidSpawn && attemptCount < 100) {
    // Randomly position the canvas on the screen
    x = random(width - canvasWidth);
    y = random(height - canvasHeight);

    // Check if the canvas spawns on top of the circle or directly next to it
    let distToCircle = dist(x + canvasWidth / 2, y + canvasHeight / 2, width / 2, height / 2);
    let distToCircleEdge = abs(distToCircle - largeCircleRadius);
    if (distToCircleEdge > 20 && distToCircle > largeCircleRadius + canvasWidth / 2 + 20) {
      invalidSpawn = false;
    }

    attemptCount++;
  }

  // Create a new canvas for freezing
  let frozenCanvas = createGraphics(canvasWidth, canvasHeight); // Create a canvas with the fixed width and height
  frozenCanvas.image(video, 0, 0, canvasWidth, canvasHeight); // Draw the video onto the frozen canvas

  // Store the start time and dimensions of the canvas
  frozenCanvas.startTime = millis();
  frozenCanvas.width = canvasWidth;
  frozenCanvas.height = canvasHeight;

  // Store the canvas and its position
  frozenCanvases.push({ canvas: frozenCanvas, x: x, y: y, width: canvasWidth, height: canvasHeight });

  // Enable displaying the video only for the last canvas
  displayVideo = true;
}

function resetSketch() {
  // Reset variables and timer
  frozenCanvases = [];
  lastFrozenTime = 0;
  lastSpawnTime = 0;
  timer = millis() + timerDuration;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Function to return the sign of a number
function sign(x) {
  return x >= 0 ? 1 : -1;
}

// Function to play sound with given frequency for duration
function playSound(frequency) {
  // Adjust frequency for lower range
  let lowerFrequency = frequency * 0.5;
  let osc = new p5.Oscillator(); // Create a new oscillator
  osc.setType('sine'); // Set oscillator type to sine for a smooth sound
  osc.freq(lowerFrequency); // Set lower frequency
  osc.amp(0.5); // Set amplitude
  osc.start(); // Start the oscillator
  setTimeout(() => {
    osc.stop(); // Stop the oscillator after 0.1 seconds
  }, 100);
}

// Function to detect if the device is mobile
function isMobileDevice() {
  return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}

// Touch events
function touchStarted() {
  if (isMobileDevice() && touches[0]) {
    // Update circle position on touch
    circleX = touches[0].x;
    circleY = touches[0].y;
  }
}

function touchMoved() {
  if (isMobileDevice() && touches[0]) {
    // Update circle position on touch move
    circleX = touches[0].x;
    circleY = touches[0].y;
    return false; // Prevent default
  }
}

function touchEnded() {
  if (isMobileDevice()) {
    // Reset circle position on touch end
    circleX = mouseX;
    circleY = mouseY;
  }
}
