/** Images sent as a data URI are uploaded; anything else is stored as a URL. */
export const IMAGE_DATA_URI_PREFIX = 'data:image/';

export const BASE64_IMAGE_DATA_URI_REGEX =
  /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/;

export const IMAGE_MAX_LENGTH = 10_000_000;
export const IMAGE_ALT_MAX_LENGTH = 255;
export const IMAGE_URL_PROTOCOLS = ['http', 'https'];

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
