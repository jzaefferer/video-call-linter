const video = document.querySelector("video");
const intro = document.getElementById("intro");
const errorOutput = document.getElementById("errorOutput");

async function startVideo() {
  const constraints = { /*audio: true, */ video: { facingMode: "user" } };
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = mediaStream;
    video.onloadedmetadata = function (e) {
      video.play();
    };
    video.style.display = "block";
    intro.remove();
  } catch (err) {
    errorOutput.textContent = err.message;
    console.error("getMedia failed", err);
  }
}

// @ts-ignore
const faceapi = window.faceapi;

const modelLoader = faceapi.nets.tinyFaceDetector.loadFromUri("models");

// while developing; or for returning visitors?
if (location.search === "?quickstart") {
  modelLoader.then(startVideo);
} else {
  document.getElementById("start-app").addEventListener(
    "click",
    async () => {
      modelLoader.then(startVideo);
    },
    { once: true }
  );
}

video.addEventListener("playing", async () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.clientWidth, height: video.clientHeight };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    // Pause when tab is in the background
    if (document.hidden) {
      return;
    }
    const overexposedSectors = detectOverexposure(video);
    const detections = await faceapi.detectAllFaces(
      video,
      new faceapi.TinyFaceDetectorOptions()
    );
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    // custom loop to mirror render detections
    // faceapi.draw.drawDetections(canvas, resizedDetections);
    resizedDetections.forEach((detection) => {
      const box = detection._box;
      const drawBox = new faceapi.draw.DrawBox({
        // mirror x-axis
        x: displaySize.width - box._x - box._width,
        y: box._y,
        width: box._width,
        height: box._height,
      });
      drawBox.draw(canvas);
    });

    let exposedLabelDrawn = false;
    overexposedSectors.forEach((sector) => {
      if (sector.overexposed) {
        // mirror x-axis
        sector.x = displaySize.width - sector.x - sector.width;
        // draw rectangle
        const drawBox = new faceapi.draw.DrawBox(sector, {
          label: exposedLabelDrawn ? null : "Overexposure detected",
          lineWidth: 2,
          boxColor: "#fff",
          drawLabelOptions: {
            fontColor: "#000",
          },
        });
        exposedLabelDrawn = true;
        drawBox.draw(canvas);
      }
    });

    const text = [];
    const anchor = { x: 10, y: 10 };
    // see DrawTextField below
    const drawOptions = {
      anchorPosition: "TOP_LEFT",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      fontSize: 20,
      padding: 8,
    };
    if (resizedDetections.length === 0) {
      text.push("Can't find any faces; Try moving your");
      text.push("camera so that your face is centered");
      drawOptions.fontColor = "red";
    } else if (resizedDetections.length > 1) {
      text.push("Found multiple faces (not supported)");
      drawOptions.fontColor = "red";
    } else {
      const box = resizedDetections[0]._box;
      const positionLimit = 0.1;
      const distanceLimitClose = 0.45;
      const distanceLimitFar = 0.21;
      // hiding at the bottom?
      if (box._y + box._height >= displaySize.height * (1 - positionLimit)) {
        text.push("Too close to the bottom edge");
        // text.push("Try moving your camera so that your face is centered");
        drawOptions.fontColor = "yellow";
        // or the top?
      } else if (box._y <= displaySize.height * positionLimit) {
        text.push("Too close to the top edge");
        // text.push("Try moving your camera so that your face is centered");
        drawOptions.fontColor = "yellow";
        // or the right?
      } else if (
        box._x + box._width >=
        displaySize.width * (1 - positionLimit)
      ) {
        text.push("Too close to the right edge");
        // text.push("Try moving your camera so that your face is centered");
        drawOptions.fontColor = "yellow";
        // or the left?
      } else if (box._x <= displaySize.width * positionLimit) {
        text.push("Too close to the left edge");
        // text.push("Try moving your camera so that your face is centered");
        drawOptions.fontColor = "yellow";
        // too close?
      } else if (box._width >= displaySize.width * distanceLimitClose) {
        text.push("Too close");
        text.push("Try moving back a little");
        drawOptions.fontColor = "yellow";
        // too far away?
      } else if (box._width <= displaySize.width * distanceLimitFar) {
        text.push("Too far away");
        text.push("Try moving closer a little");
        drawOptions.fontColor = "yellow";
      } else {
        text.push("Looking good!");
        drawOptions.fontSize = 30;
        drawOptions.fontColor = "#55ff07";
      }
      // console.log({
      //   faceWidth: box._width,
      //   limitClose: displaySize.width * distanceLimitClose,
      //   limitFar: displaySize.width * distanceLimitFar,
      // });
    }
    const drawBox = new faceapi.draw.DrawTextField(text, anchor, drawOptions);
    drawBox.draw(canvas);
  }, 500);
});
