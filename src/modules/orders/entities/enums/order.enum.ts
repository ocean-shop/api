export enum OrderPaymentMethod {
  CARD = 'card',
  COD = 'cod',
}

export enum OrderPaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
}

export enum OrderShippingMethod {
  NOVA = 'nova',
  UKR = 'ukr',
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  CANCELLED = 'cancelled',
}
