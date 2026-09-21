// Phase 8: POST /ai/classify takes the photo as base64 JSON rather than a multipart
// upload (aiValidators.js caps it at ~2MB of base64 text), so this is the one place that
// turns a compressed photo Blob into the string the request body needs.

/**
 * @param {Blob} blob
 * @returns {Promise<string>} base64 payload with the `data:...;base64,` prefix stripped
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('Could not read photo'));
    reader.readAsDataURL(blob);
  });
}
