/** An image ready to be stored: already uploaded, so only its URL is kept. */
export type ImagePayload = {
  url: string;
  alt: string | null;
  sort: number;
};

export type VariationAttributePayload = {
  attributeTypeId: string;
};
