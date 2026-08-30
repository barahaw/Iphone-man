import { create } from 'zustand';

export const useCheckoutStore = create((set) => ({
  step: 1, // 1: Shipping, 2: Payment, 3: Confirmation

  shipping: {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'SA',
    notes: '',
  },

  paymentMethod: 'cod', // 'cod' only for now (card/apple_pay deferred)
  cardDetails: {
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  },

  orderResult: null, // Stores returned order object after checkout submission

  setStep: (step) => set({ step }),

  updateShipping: (fields) =>
    set((state) => ({
      shipping: { ...state.shipping, ...fields },
    })),

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  updateCardDetails: (fields) =>
    set((state) => ({
      cardDetails: { ...state.cardDetails, ...fields },
    })),

  completeCheckout: (order) => set({ orderResult: order, step: 3 }),

  resetCheckout: () =>
    set({
      step: 1,
      shipping: {
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'SA',
        notes: '',
      },
      paymentMethod: 'cod',
      orderResult: null,
    }),
}));
