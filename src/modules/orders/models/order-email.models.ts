export type OrderEmailItem = {
  name: string;
  imageUrl: string | null;
  quantity: number;
  total: string;
  oldTotal: string | null;
};

export type OrderCreatedEmailContext = {
  orderNumber: string;
  orderDate: string;
  firstName: string | null;
  items: OrderEmailItem[];
  itemsCount: number;
  subtotal: string;
  discount: string | null;
  deliveryCost: string | null;
  total: string;
  paymentLabel: string;
  shippingMethod: string;
  shippingNumber: string;
  recipientName: string | null;
  phoneNumber: string | null;
  email: string;
};
