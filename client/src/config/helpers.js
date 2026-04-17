export const downloadCanvasToImage = () => {
  const canvas = document.querySelector("canvas");
  const dataURL = canvas.toDataURL();
  const link = document.createElement("a");

  link.href = dataURL;
  link.download = "canvas.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const reader = (file) =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = src;
  });

const getPixelOffset = (x, y, width) => (y * width + x) * 4;

const getColorAt = (data, width, x, y) => {
  const offset = getPixelOffset(x, y, width);

  return {
    red: data[offset],
    green: data[offset + 1],
    blue: data[offset + 2],
    alpha: data[offset + 3],
  };
};

const colorDistance = (firstColor, secondColor) => {
  const redDelta = firstColor.red - secondColor.red;
  const greenDelta = firstColor.green - secondColor.green;
  const blueDelta = firstColor.blue - secondColor.blue;

  return Math.sqrt(redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta);
};

const isNearWhite = ({ red, green, blue }) => red > 235 && green > 235 && blue > 235;

const getBackgroundSamples = (data, width, height) => {
  const inset = Math.max(1, Math.floor(Math.min(width, height) * 0.02));
  const maxX = width - 1;
  const maxY = height - 1;
  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);
  const samplePoints = [
    [0, 0],
    [maxX, 0],
    [0, maxY],
    [maxX, maxY],
    [midX, 0],
    [midX, maxY],
    [0, midY],
    [maxX, midY],
    [inset, inset],
    [maxX - inset, inset],
    [inset, maxY - inset],
    [maxX - inset, maxY - inset],
  ];

  return samplePoints
    .map(([x, y]) => getColorAt(data, width, x, y))
    .filter((sample) => sample.alpha > 0);
};

const matchesBackground = (color, backgroundSamples, tolerance = 70) => {
  if (color.alpha === 0) {
    return true;
  }

  if (isNearWhite(color)) {
    return true;
  }

  return backgroundSamples.some((sample) => colorDistance(color, sample) <= tolerance);
};

const clearBackgroundFromEdges = (data, width, height, backgroundSamples) => {
  const visited = new Uint8Array(width * height);
  const queue = [];
  const pushPixel = (x, y) => {
    const pixelIndex = y * width + x;

    if (visited[pixelIndex]) {
      return;
    }

    const color = getColorAt(data, width, x, y);

    if (!matchesBackground(color, backgroundSamples)) {
      return;
    }

    visited[pixelIndex] = 1;
    queue.push([x, y]);
  };

  for (let x = 0; x < width; x += 1) {
    pushPixel(x, 0);
    pushPixel(x, height - 1);
  }

  for (let y = 0; y < height; y += 1) {
    pushPixel(0, y);
    pushPixel(width - 1, y);
  }

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    const offset = getPixelOffset(x, y, width);

    data[offset + 3] = 0;

    if (x > 0) pushPixel(x - 1, y);
    if (x < width - 1) pushPixel(x + 1, y);
    if (y > 0) pushPixel(x, y - 1);
    if (y < height - 1) pushPixel(x, y + 1);
  }
};

const softenBackgroundFringe = (data, width, height, backgroundSamples) => {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = getPixelOffset(x, y, width);
      const color = getColorAt(data, width, x, y);

      if (color.alpha === 0) {
        continue;
      }

      if (!matchesBackground(color, backgroundSamples, 90)) {
        continue;
      }

      data[offset + 3] = Math.min(data[offset + 3], 24);
    }
  }
};

const getOpaqueBounds = (data, width, height) => {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = getPixelOffset(x, y, width);

      if (data[offset + 3] <= 20) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return { minX, minY, maxX, maxY };
};

export const removeImageBackground = async (src) => {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  canvas.width = image.width;
  canvas.height = image.height;
  context.drawImage(image, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const backgroundSamples = getBackgroundSamples(data, width, height);

  clearBackgroundFromEdges(data, width, height, backgroundSamples);
  softenBackgroundFringe(data, width, height, backgroundSamples);

  context.putImageData(imageData, 0, 0);

  const { minX, minY, maxX, maxY } = getOpaqueBounds(data, width, height);

  if (maxX < 0 || maxY < 0) {
    return src;
  }

  const padding = 24;
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropWidth = Math.min(width - cropX, maxX - minX + 1 + padding * 2);
  const cropHeight = Math.min(height - cropY, maxY - minY + 1 + padding * 2);

  const trimmedCanvas = document.createElement('canvas');
  const trimmedContext = trimmedCanvas.getContext('2d');

  trimmedCanvas.width = cropWidth;
  trimmedCanvas.height = cropHeight;
  trimmedContext.drawImage(
    canvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  return trimmedCanvas.toDataURL('image/png');
};

export const getContrastingColor = (color) => {
  // Remove the '#' character if it exists
  const hex = color.replace("#", "");

  // Convert the hex string to RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate the brightness of the color
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Return black or white depending on the brightness
  return brightness > 128 ? "black" : "white";
};
