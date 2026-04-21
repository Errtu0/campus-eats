const IP = "192.168.0.104";
const PORT = "3000";
export const STRIPE_PUBLISHABLE_KEY = "pk_test_51TD5TDQcKwbP52mLtxNbb7D8YQUjatQCBbJVaaZTSWdAboQ33MupeHfQUCC3lq42goRBlZkOCuAPxJcvAo6oaLEq00r1hQdXrC"; // Replace with your actual Stripe publishable key

// SOCKET_URL must be just the server origin (No /api)
export const SOCKET_URL = `http://${IP}:${PORT}`; 

// BASE_URL for your REST fetch calls
export const BASE_URL = `${SOCKET_URL}/api`; 

export const AUTH_URL = `${BASE_URL}/auth`;
export const TABLE_URL = `${BASE_URL}/tables`;
export const ORDER_URL = `${BASE_URL}/orders`;
export const STAFF_URL = `${BASE_URL}/staff`;
export const ADMIN_URL = `${BASE_URL}/admin`;
export const PAYMENT_URL = `${BASE_URL}/payments`;
export const RESTAURANT_URL = `${BASE_URL}/restaurants`;