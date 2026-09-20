// Canvas-based compression — not worth a dependency for this (rules.md §15).
const MAX_WIDTH = 1600;
const MAX_SIZE_BYTES = 1024 * 1024; // 1 MB, rules.md §16
const MIME_TYPE = 'image/jpeg'; // one contentType per POST /uploads/sign batch (uploadValidators.js)
const MIN_QUALITY = 0.4;

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not compress image'))), MIME_TYPE, quality);
  });
}

/**
 * Resizes to at most `MAX_WIDTH` wide and re-encodes as JPEG, stepping quality down until
 * the result is under `MAX_SIZE_BYTES` (or quality bottoms out — still returned, just larger).
 * @param {File} file
 * @returns {Promise<Blob>}
 */
export async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  if (width > MAX_WIDTH) {
    height = Math.round((height * MAX_WIDTH) / width);
    width = MAX_WIDTH;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  let quality = 0.9;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > MAX_SIZE_BYTES && quality > MIN_QUALITY) {
    quality -= 0.15;
    blob = await canvasToBlob(canvas, quality);
  }
  return blob;
}
