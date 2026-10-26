export const IMAGE_MESSAGES = {
  NOT_FOUND: 'Зображення продукта не знайдено',
  ALREADY_FIRST: 'Зображення вже на початку',
  ALREADY_LAST: 'Зображення вже в кінці',
  REMOVED: 'Зображення успішно видалено',
  INVALID_DATA_URI: 'image must be a valid base64 data URI',
  INVALID_URL: 'image must be a valid URL',
  UPLOAD_FAILED: 'Не вдалося завантажити зображення до Cloudinary',
  MISSING_SECURE_URL: 'Cloudinary не повернув безпечний URL',
} as const;
