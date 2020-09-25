const video = document.querySelector("video");
const intro = document.getElementById("intro");
const errorOutput = document.getElementById("errorOutput");

// 1. divide the image into 6 sectors, width / 3, + height / 2
// 2. in each sector, look for almost-perfect white, close to #ffffff
// like #fffeff or #fbfcfd;
// in rgb: 255 254 255 and 251, 252, 253 <- all three above 250 => overexposed
// 3. check for outliers - there might be multiple
// 4. then show the sector that's affected!
function detectOverexposure(imgEl) {
  const blockSize = 5; // only visit every 5 pixels
  const canvas = document.createElement("canvas");
  const context = canvas.getContext && canvas.getContext("2d");

  const imgHeight = (canvas.height =
    imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height);
  const imgWidth = (canvas.width =
    imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width);

  context.drawImage(imgEl, 0, 0);

  const thirdW = imgWidth / 3;
  const halfH = imgHeight / 2;
  const sectors = [
    [0, 0, thirdW, halfH],
    [thirdW, 0, thirdW, halfH],
    [thirdW * 2, 0, thirdW, halfH],
    [0, halfH, thirdW, halfH],
    [thirdW, halfH, thirdW, halfH],
    [thirdW * 2, halfH, thirdW, halfH],
  ];
  const result = sectors.map(([x, y, width, height]) => {
    let data = context.getImageData(x, y, width, height);

    let i = -4;
    let overexposedCount = 0;
    let okayCount = 0;
    const length = data.data.length;
    while ((i += blockSize * 4) < length) {
      let rgb = {};
      rgb.r = data.data[i];
      rgb.g = data.data[i + 1];
      rgb.b = data.data[i + 2];
      if (rgb.r >= 250 && rgb.g >= 250 && rgb.b >= 250) {
        // overexposed!
        overexposedCount += 1;
      } else {
        okayCount += 1;
      }
    }

    const percentage =
      (overexposedCount / (overexposedCount + okayCount)) * 100;
    return {
      x,
      y,
      width,
      height,
      percentage,
      overexposed: percentage > 1,
    };
  });

  return result;
}

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

    overexposedSectors.forEach((sector) => {
      if (sector.overexposed) {
        // draw rectangle
        const drawBox = new faceapi.draw.DrawBox(sector, {
          label: "Overexposure detected",
          lineWidth: 2,
          boxColor: "#fff",
          drawLabelOptions: {
            fontColor: "#000",
          },
        });
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
