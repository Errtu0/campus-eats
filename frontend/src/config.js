const API_IP = "192.168.0.102"; 
const PORT = "3000";

export const AUTH_URL = `http://${API_IP}:${PORT}/api/auth`;
export const TABLE_URL = `http://${API_IP}:${PORT}/api/tables`;
export const ORDER_URL = `http://${API_IP}:${PORT}/api/orders`;
// ADD THIS:
export const PAYMENT_URL = `http://${API_IP}:${PORT}/api/payments`;
export const STRIPE_PUBLISHABLE_KEY = "pk_test_51TD5TDQcKwbP52mLtxNbb7D8YQUjatQCBbJVaaZTSWdAboQ33MupeHfQUCC3lq42goRBlZkOCuAPxJcvAo6oaLEq00r1hQdXrC";