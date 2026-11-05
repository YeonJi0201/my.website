// Shared browser/server limit; JSON carries base64, which is larger than the file.
export const MAX_IMAGE_MB = 20;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
export const MAX_IMAGE_DATA_URL_LENGTH = 4 * Math.ceil(MAX_IMAGE_BYTES / 3) + 64;
