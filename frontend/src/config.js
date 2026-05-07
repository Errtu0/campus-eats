// Replace this with the URL shown in your ngrok terminal (make sure no trailing slash /)
const NGROK_URL = "https://marcelino-unritualistic-rubi.ngrok-free.dev"; 


export const STRIPE_PUBLISHABLE_KEY = "pk_test_51TD5TDQcKwbP52mLtxNbb7D8YQUjatQCBbJVaaZTSWdAboQ33MupeHfQUCC3lq42goRBlZkOCuAPxJcvAo6oaLEq00r1hQdXrC"; // Replace with your actual Stripe publishable key



// SOCKET_URL: For ngrok, it's just the base URL
// Note: Some Socket.io versions prefer the https protocol for tunnels
export const SOCKET_URL = NGROK_URL; 

// BASE_URL for your REST fetch calls
export const BASE_URL = `${SOCKET_URL}/api`; 

export const AUTH_URL = `${BASE_URL}/auth`;
export const TABLE_URL = `${BASE_URL}/tables`;
export const ORDER_URL = `${BASE_URL}/orders`;
export const STAFF_URL = `${BASE_URL}/staff`;
export const ADMIN_URL = `${BASE_URL}/admin`;
export const PAYMENT_URL = `${BASE_URL}/payments`;
export const RESTAURANT_URL = `${BASE_URL}/restaurants`;