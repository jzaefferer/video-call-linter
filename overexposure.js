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
