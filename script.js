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
    intro.remove();
  } catch (err) {
    errorOutput.textContent = err.message;
    console.error("getMedia failed", err);
  }
}

// while developing; or for returning visitors?
// if (location.search === "?quickstart") {
//   startVideo();
// } else {
//   document.getElementById("start-app").addEventListener(
//     "click",
//     async () => {
//       startVideo();
//     },
//     { once: true }
//   );
// }

// @ts-ignore
const faceapi = window.faceapi;

faceapi.nets.tinyFaceDetector.loadFromUri("models").then(startVideo);

video.addEventListener("playing", async () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    const overexposedSectors = detectOverexposure(video);
    const detections = await faceapi.detectAllFaces(
      video,
      new faceapi.TinyFaceDetectorOptions()
    );
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    console.log({ resizedDetections });
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);

    let exposedLabelDrawn = false;
    overexposedSectors.forEach((sector) => {
      if (sector.overexposed) {
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
    };
    if (resizedDetections.length === 0) {
      text.push("Can't find any faces - are you there?");
      text.push("Try moving your camera so that your face is centered");
      drawOptions.fontColor = "red";
    } else {
      const box = resizedDetections[0]._box;
      const positionLimit = 0.1;
      const distanceLimitClose = 0.45;
      const distanceLimitFar = 0.25;
      // hiding at the bottom?
      if (box._y + box._height >= displaySize.height * (1 - positionLimit)) {
        text.push("Found your face, but it's too close to the bottom edge");
        text.push("Try moving your camera so that your face is centered");
        drawOptions.fontColor = "yellow";
        // or the top?
      } else if (box._y <= displaySize.height * positionLimit) {
        text.push("Found your face, but it's too close to the top edge");
        text.push("Try moving your camera so that your face is centered");
        drawOptions.fontColor = "yellow";
        // or the right?
      } else if (
        box._x + box._width >=
        displaySize.width * (1 - positionLimit)
      ) {
        text.push("Found your face, but it's too close to the right edge");
        text.push("Try moving your camera so that your face is centered");
        drawOptions.fontColor = "yellow";
        // or the left?
      } else if (box._x <= displaySize.width * positionLimit) {
        text.push("Found your face, but it's too close to the left edge");
        text.push("Try moving your camera so that your face is centered");
        drawOptions.fontColor = "yellow";
        // too close?
      } else if (box._width >= displaySize.width * distanceLimitClose) {
        text.push("Found your face, but it's too close");
        text.push("Try moving back a little");
        drawOptions.fontColor = "yellow";
        // too far away?
      } else if (box._width <= displaySize.width * distanceLimitFar) {
        text.push("Found your face, but it's too far away");
        text.push("Try moving closer a little");
        drawOptions.fontColor = "yellow";
      } else {
        text.push("Looking good!");
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
  }, 1500);
});
