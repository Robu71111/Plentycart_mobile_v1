import { createContext, useContext, useState, type ReactNode } from 'react';

export type CheckoutAddress = {
  fullName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type ShippingMethod = {
  id: string;
  name: string;
  days: string;
  price: number;
};

type CheckoutContextType = {
  address: CheckoutAddress | null;
  setAddress: (a: CheckoutAddress) => void;
  shippingMethod: ShippingMethod | null;
  setShippingMethod: (m: ShippingMethod) => void;
  orderId: string | null;
  setOrderId: (id: string) => void;
  reset: () => void;
};

const CheckoutContext = createContext<CheckoutContextType | null>(null);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<CheckoutAddress | null>(null);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const reset = () => {
    setAddress(null);
    setShippingMethod(null);
    setOrderId(null);
  };

  return (
    <CheckoutContext.Provider
      value={{ address, setAddress, shippingMethod, setShippingMethod, orderId, setOrderId, reset }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider');
  return ctx;
}
