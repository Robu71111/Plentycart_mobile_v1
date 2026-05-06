import AsyncStorage from '@react-native-async-storage/async-storage';

export const ORDERS_KEY = '@plentycart/orders';
const DAY_MS = 24 * 60 * 60 * 1000;

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReturnStatus =
  | 'RETURN_INITIATED'
  | 'RETURN_APPROVED'
  | 'RETURN_IN_PROGRESS'
  | 'ORDER_RETURNED_TO_WAREHOUSE'
  | 'REFUND_INITIATED'
  | 'REFUNDED';

export type ReturnRequest = {
  id: string;
  reason: 'Damaged Product' | 'Wrong Product';
  notes: string;
  photos: string[];
  selectedItems: string[];
  status: ReturnStatus;
  requestedAt: string;
  updatedAt: string;
  returnLabelUrl?: string;
  refundAmount?: number;
};

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

export type Order = {
  id: string;
  items: OrderItem[];
  address?: {
    fullName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  status: string;
  placedAt: string;
  trackingNumber: string;
  shipping?: { name: string; days?: string };
  deliveredAt?: string;
  returnRequest?: ReturnRequest | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function isReturnEligible(order: Order): boolean {
  if (order.status !== 'DELIVERED') return false;
  if (order.returnRequest) return false;
  if (!order.deliveredAt) return false;
  const daysSince = (Date.now() - new Date(order.deliveredAt).getTime()) / DAY_MS;
  return daysSince < 7;
}

export async function getOrders(): Promise<Order[]> {
  const raw = await AsyncStorage.getItem(ORDERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveOrders(orders: Order[]): Promise<void> {
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export async function updateOrder(orderId: string, patch: Partial<Order>): Promise<void> {
  const orders = await getOrders();
  await saveOrders(orders.map(o => o.id === orderId ? { ...o, ...patch } : o));
}

export async function requestReturn(
  orderId: string,
  data: { reason: ReturnRequest['reason']; notes: string; photos: string[]; selectedItems: string[] }
): Promise<ReturnRequest> {
  const returnRequest: ReturnRequest = {
    id: `RET-${Date.now()}`,
    ...data,
    status: 'RETURN_INITIATED',
    requestedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await updateOrder(orderId, { returnRequest });
  return returnRequest;
}

// ─── Simulate 6-stage return flow ────────────────────────────────────────────

export function simulateReturnApproval(orderId: string): void {
  const stages: Array<{ delay: number; status: ReturnStatus; extra?: Partial<ReturnRequest> }> = [
    { delay: 20_000, status: 'RETURN_APPROVED', extra: { returnLabelUrl: `https://plentycart.com/labels/${orderId}.pdf` } },
    { delay: 40_000, status: 'RETURN_IN_PROGRESS' },
    { delay: 60_000, status: 'ORDER_RETURNED_TO_WAREHOUSE' },
    { delay: 80_000, status: 'REFUND_INITIATED' },
    { delay: 100_000, status: 'REFUNDED' },
  ];

  stages.forEach(({ delay, status, extra }) => {
    setTimeout(async () => {
      const orders = await getOrders();
      const order = orders.find(o => o.id === orderId);
      if (!order?.returnRequest) return;
      const patch: Partial<ReturnRequest> = {
        ...extra,
        status,
        updatedAt: new Date().toISOString(),
        ...(status === 'REFUNDED' ? { refundAmount: order.total } : {}),
      };
      await updateOrder(orderId, {
        returnRequest: { ...order.returnRequest, ...patch },
      });
    }, delay);
  });
}

// ─── Demo seed orders ─────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  return new Date(Date.now() - n * DAY_MS).toISOString();
}

function getSeedOrders(): Order[] {
  return [
    {
      id: 'PC-DEMO-001',
      items: [
        { id: 'sd1a', name: 'Wireless Noise-Cancelling Headphones', price: 79.99, quantity: 1 },
        { id: 'sd1b', name: 'USB-C Charging Cable 6ft', price: 12.99, quantity: 2 },
      ],
      subtotal: 105.97,
      tax: 8.48,
      shippingCost: 0,
      total: 114.45,
      status: 'DELIVERED',
      placedAt: daysAgo(7),
      deliveredAt: daysAgo(2),
      trackingNumber: '1Z9R48R70316515358',
      shipping: { name: 'Free Shipping' },
      returnRequest: null,
    },
    {
      id: 'PC-DEMO-002',
      items: [
        { id: 'sd2a', name: 'Smart Watch Series 5 Pro', price: 199.99, quantity: 1 },
      ],
      subtotal: 199.99,
      tax: 16.00,
      shippingCost: 5.99,
      total: 221.98,
      status: 'DELIVERED',
      placedAt: daysAgo(15),
      deliveredAt: daysAgo(10),
      trackingNumber: '1ZA765R20341345678',
      shipping: { name: 'Standard Ground' },
      returnRequest: null,
    },
    {
      id: 'PC-DEMO-003',
      items: [
        { id: 'sd3a', name: 'Portable Bluetooth Speaker', price: 49.99, quantity: 1 },
        { id: 'sd3b', name: 'Adjustable Phone Stand', price: 15.99, quantity: 1 },
      ],
      subtotal: 65.98,
      tax: 5.28,
      shippingCost: 5.99,
      total: 77.25,
      status: 'SHIPPED',
      placedAt: daysAgo(2),
      trackingNumber: '1ZSHIP202165158888',
      shipping: { name: 'Standard Ground', days: '3–5 business days' },
      returnRequest: null,
    },
    {
      id: 'PC-DEMO-004',
      items: [
        { id: 'sd4a', name: 'Vitamin C Serum 30ml', price: 34.99, quantity: 1 },
      ],
      subtotal: 34.99,
      tax: 2.80,
      shippingCost: 5.99,
      total: 43.78,
      status: 'OUT_FOR_DELIVERY',
      placedAt: daysAgo(4),
      trackingNumber: '1ZOUT202165155555',
      shipping: { name: 'Standard Ground', days: '3–5 business days' },
      returnRequest: null,
    },
  ];
}

// ─── Init on app start ───────────────────────────────────────────────────────

function migrateOrderStatus(status: string): string {
  switch (status) {
    case 'Processing': return 'ORDER_PLACED';
    case 'Shipped': return 'SHIPPED';
    case 'Delivered': return 'DELIVERED';
    default: return status;
  }
}

function migrateReturnStatus(status: string): ReturnStatus {
  switch (status) {
    case 'REQUESTED': return 'RETURN_INITIATED';
    case 'APPROVED': return 'RETURN_APPROVED';
    case 'REFUNDED': return 'REFUNDED';
    default: return (status as ReturnStatus) || 'RETURN_INITIATED';
  }
}

export async function initOrders(): Promise<void> {
  const raw = await AsyncStorage.getItem(ORDERS_KEY);
  const existing: Order[] = raw ? JSON.parse(raw) : [];

  // Step 1: migrate existing orders to new status values
  let orders: Order[] = existing.map((o): Order => {
    const patched: Order = {
      ...o,
      status: migrateOrderStatus(o.status),
      returnRequest: o.returnRequest
        ? { ...o.returnRequest, status: migrateReturnStatus(o.returnRequest.status) }
        : null,
    };
    const daysSincePlaced = (Date.now() - new Date(o.placedAt).getTime()) / DAY_MS;

    if ((patched.status === 'ORDER_PLACED' || patched.status === 'SHIPPED') && daysSincePlaced >= 5) {
      patched.status = 'DELIVERED';
      patched.deliveredAt = new Date(new Date(o.placedAt).getTime() + 5 * DAY_MS).toISOString();
    }

    if (patched.status === 'DELIVERED' && !patched.deliveredAt) {
      patched.deliveredAt = new Date(new Date(o.placedAt).getTime() + 5 * DAY_MS).toISOString();
    }

    return patched;
  });

  // Step 2: ensure demo orders exist (idempotent — add only if absent by ID)
  const existingIds = new Set(orders.map(o => o.id));
  for (const demo of getSeedOrders()) {
    if (!existingIds.has(demo.id)) {
      orders.push(demo);
      existingIds.add(demo.id);
    }
  }

  // Step 3: refresh PC-DEMO-001 dates on every start so the 7-day return window
  // never silently expires between demo sessions.
  orders = orders.map(o => {
    if (o.id === 'PC-DEMO-001' && o.status === 'DELIVERED' && !o.returnRequest) {
      return {
        ...o,
        placedAt: new Date(Date.now() - 7 * DAY_MS).toISOString(),
        deliveredAt: new Date(Date.now() - 2 * DAY_MS).toISOString(),
      };
    }
    return o;
  });

  await saveOrders(orders);
}
