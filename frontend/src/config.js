const IP = "192.168.0.113";
const PORT = "3000";

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