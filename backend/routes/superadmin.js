const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================
// CAMPUSEATS OS — SUPERADMIN PANEL
// AdminJS is ESM-only; we load it via dynamic import() inside
// an async IIFE so CommonJS (require) can still be used here.
// ============================================================

const initializeAdminJS = async () => {
    try {
        // ── Dynamic ESM imports ──────────────────────────────
        const { default: AdminJS, ComponentLoader } = await import('adminjs');
        const { default: AdminJSExpress }           = await import('@adminjs/express');
        const { Database, Resource, getModelByName } = await import('@adminjs/prisma');

        // ── Register Prisma adapter ──────────────────────────
        AdminJS.registerAdapter({ Database, Resource });

        // ── Component bundler ────────────────────────────────
        const componentLoader = new ComponentLoader();
        const Components = {
            Dashboard: componentLoader.add(
                'Dashboard',
                path.join(__dirname, 'components', 'dashboard')
            ),
            // 🚀 BUNDLE CUSTOM APPROVAL GATE PAGE
            ApprovalGate: componentLoader.add(
                'ApprovalGate',
                path.join(__dirname, 'components', 'approvalGate')
            ),
        };

        // 🚀 LIVE DATA HANDLER FOR DASHBOARD
        const dashboardHandler = async (request, response, context) => {
            const userCount = await prisma.user.count();
            const restaurantCount = await prisma.restaurant.count();
            const activeOrders = await prisma.order.count({ where: { status: 'PENDING' } });
            const menuItemsCount = await prisma.menuItem.count();

            return {
                users: userCount,
                restaurants: restaurantCount,
                orders: activeOrders,
                menuItems: menuItemsCount
            };
        };

        // 🚀 LIVE HANDLER FOR CUSTOM APPROVAL GATE PAGE
        const approvalGateHandler = async (request, response, context) => {
            // Sadece PENDING durumunda olan restoranları çekip karta yolluyoruz
            const pendingBranches = await prisma.restaurant.findMany({
                where: { status: 'PENDING' }
            });
            return { branches: pendingBranches };
        };

        // ── Navigation groups ────────────────────────────────
        const dbMenu       = { name: 'CORE DATABASE',   icon: 'Database'     };
        const financeMenu  = { name: 'FINANCE',         icon: 'Currency'     };
        const catalogMenu  = { name: 'CATALOG',         icon: 'ShoppingCart' };

        // ── Shared action set — full CRUD for every resource ─
        const fullCrud = {
            list:   { isAccessible: true },
            show:   { isAccessible: true },
            new:    { isAccessible: true },
            edit:   { isAccessible: true },
            delete: { isAccessible: true, isVisible: true },
        };

        // ── Password-hashing before-hook ─────────────────────
        const hashPasswordHook = async (request) => {
            if (
                request.payload?.password_hash &&
                !request.payload.password_hash.startsWith('$2')
            ) {
                request.payload.password_hash = await bcrypt.hash(
                    request.payload.password_hash,
                    10
                );
            }
            return request;
        };

        // ── AdminJS options ──────────────────────────────────
        const adminOptions = {
            rootPath:   '/api/superadmin/dashboard',
            loginPath:  '/api/superadmin/dashboard/login',
            logoutPath: '/api/superadmin/dashboard/logout',

            dashboard: { 
                component: Components.Dashboard,
                handler: dashboardHandler
            },

            // 🚀 ❸ REGISTER CUSTOM PAGES (Approval Gate custom sayfa olarak ekleniyor)
            pages: {
                approvalGate: {
                    label: 'APPROVAL GATE',
                    icon: 'CheckSquare',
                    component: Components.ApprovalGate,
                    handler: approvalGateHandler
                }
            },

            // ❷ Resources — every model gets full CRUD
            resources: [
                // ── Users ──────────────────────────────────────
                {
                    resource: { model: getModelByName('User'), client: prisma },
                    options: {
                        navigation: dbMenu,
                        listProperties:   ['id', 'username', 'email', 'role', 'full_name', 'membership_points', 'created_at'],
                        showProperties:   ['id', 'username', 'email', 'role', 'full_name', 'phone_number', 'membership_points', 'is_guest', 'restaurant_id', 'created_at'],
                        editProperties:   ['username', 'email', 'password_hash', 'role', 'full_name', 'phone_number', 'membership_points', 'is_guest', 'restaurant_id'],
                        filterProperties: ['role', 'email', 'username', 'is_guest'],
                        actions: {
                            ...fullCrud,
                            new:  { ...fullCrud.new,  before: hashPasswordHook },
                            edit: { ...fullCrud.edit, before: hashPasswordHook },
                        },
                    },
                },

                // ── Restaurants (🚀 CORE DATABASE altına geri taşındı) ──
                {
                    resource: { model: getModelByName('Restaurant'), client: prisma },
                    options: {
                        navigation: dbMenu,
                        listProperties:   ['id', 'name', 'status', 'admin_id', 'total_capacity', 'current_occupancy'],
                        showProperties:   ['id', 'name', 'status', 'admin_id', 'total_capacity', 'current_occupancy'],
                        editProperties:   ['name', 'status', 'admin_id', 'total_capacity'],
                        filterProperties: ['status', 'name'],
                        actions: { ...fullCrud },
                    },
                },

                // ── Orders ──────────────────────────────────────
                {
                    resource: { model: getModelByName('Order'), client: prisma },
                    options: {
                        navigation: financeMenu,
                        listProperties:   ['id', 'customer_id', 'session_id', 'restaurant_id', 'status', 'total_amount', 'created_at'],
                        showProperties:   ['id', 'customer_id', 'session_id', 'restaurant_id', 'status', 'total_amount', 'coupon_id', 'created_at'],
                        editProperties:   ['status', 'total_amount', 'coupon_id'],
                        filterProperties: ['status', 'restaurant_id', 'customer_id'],
                        actions: { ...fullCrud },
                    },
                },

                // ── Menu Items ──────────────────────────────────
                {
                    resource: { model: getModelByName('MenuItem'), client: prisma },
                    options: {
                        navigation: catalogMenu,
                        listProperties:   ['id', 'name', 'price', 'category', 'restaurant_id', 'is_vegan', 'is_gluten_free'],
                        showProperties:   ['id', 'name', 'price', 'category', 'restaurant_id', 'image_name', 'is_vegan', 'is_gluten_free', 'is_hot', 'is_sweet', 'is_sour'],
                        editProperties:   ['name', 'price', 'category', 'restaurant_id', 'image_name', 'is_vegan', 'is_gluten_free', 'is_hot', 'is_sweet', 'is_sour'],
                        filterProperties: ['category', 'restaurant_id', 'is_vegan', 'is_gluten_free'],
                        actions: { ...fullCrud },
                    },
                },

                // ── Coupons ─────────────────────────────────────
                {
                    resource: { model: getModelByName('Coupon'), client: prisma },
                    options: {
                        navigation: financeMenu,
                        listProperties:   ['id', 'code', 'coupon_type', 'discount_value', 'is_active', 'current_usage', 'usage_limit'],
                        showProperties:   ['id', 'code', 'coupon_type', 'discount_value', 'min_cart_limit', 'applicable_to', 'is_active', 'usage_limit', 'current_usage', 'restaurant_id', 'admin_id'],
                        editProperties:   ['code', 'coupon_type', 'discount_value', 'min_cart_limit', 'applicable_to', 'is_active', 'usage_limit', 'restaurant_id'],
                        filterProperties: ['coupon_type', 'is_active', 'applicable_to'],
                        actions: { ...fullCrud },
                    },
                },

                // ── Inventory Items ─────────────────────────────
                {
                    resource: { model: getModelByName('InventoryItem'), client: prisma },
                    options: {
                        navigation: dbMenu,
                        listProperties:   ['id', 'name', 'amount', 'unit', 'min_limit', 'restaurant_id'],
                        editProperties:   ['name', 'amount', 'unit', 'min_limit', 'restaurant_id'],
                        filterProperties: ['restaurant_id', 'unit'],
                        actions: { ...fullCrud },
                    },
                },

                // ── Promotion News ──────────────────────────────
                {
                    resource: { model: getModelByName('PromotionNews'), client: prisma },
                    options: {
                        navigation: catalogMenu,
                        listProperties:   ['id', 'title', 'restaurant_id', 'image_tag', 'created_at'],
                        showProperties:   ['id', 'title', 'description', 'restaurant_id', 'image_tag', 'created_at'],
                        editProperties:   ['title', 'description', 'restaurant_id', 'image_tag'],
                        filterProperties: ['restaurant_id'],
                        actions: { ...fullCrud },
                    },
                },

                // ── Tables ──────────────────────────────────────
                {
                    resource: { model: getModelByName('Table'), client: prisma },
                    options: {
                        navigation: dbMenu,
                        listProperties:   ['id', 'table_number', 'restaurant_id', 'status', 'qr_code_id'],
                        editProperties:   ['table_number', 'restaurant_id', 'status', 'qr_code_id'],
                        filterProperties: ['restaurant_id', 'status'],
                        actions: { ...fullCrud },
                    },
                },

                // ── Sessions ─────────────────────────────────────
                {
                    resource: { model: getModelByName('Session'), client: prisma },
                    options: {
                        navigation: dbMenu,
                        listProperties:   ['id', 'table_id', 'join_code', 'is_active', 'start_time', 'end_time'],
                        editProperties:   ['table_id', 'join_code', 'is_active', 'end_time'],
                        filterProperties: ['is_active', 'table_id'],
                        actions: { ...fullCrud },
                    },
                },

                // ── Payments ─────────────────────────────────────
                {
                    resource: { model: getModelByName('Payment'), client: prisma },
                    options: {
                        navigation: financeMenu,
                        listProperties:   ['id', 'order_id', 'method', 'status'],
                        editProperties:   ['order_id', 'method', 'status'],
                        filterProperties: ['method', 'status'],
                        actions: { ...fullCrud },
                    },
                },

                // ── Order Items ──────────────────────────────────
                {
                    resource: { model: getModelByName('OrderItem'), client: prisma },
                    options: {
                        navigation: financeMenu,
                        listProperties:   ['id', 'order_id', 'item_id', 'quantity', 'status'],
                        editProperties:   ['order_id', 'item_id', 'quantity', 'status', 'customization', 'paid_by_user_id'],
                        filterProperties: ['status', 'order_id'],
                        actions: { ...fullCrud },
                    },
                },

                // ── Density Logs ─────────────────────────────────
                {
                    resource: { model: getModelByName('DensityLog'), client: prisma },
                    options: {
                        navigation: dbMenu,
                        listProperties:   ['id', 'restaurant_id', 'peak_occupancy', 'recorded_at'],
                        actions: {
                            list:   { isAccessible: true },
                            show:   { isAccessible: true },
                            new:    { isAccessible: false },
                            edit:   { isAccessible: false },
                            delete: { isAccessible: true },
                        },
                    },
                },
            ],

            branding: {
                companyName: 'CAMPUS EATS OS',
                logo: false,
                theme: {
                    colors: {
                        primary100: '#DD5544',
                        primary80:  '#DD5544',
                        primary60:  '#CC4433',
                        primary40:  '#EE7766',
                        primary20:  '#F4F1DE',
                        bg:         '#F4F1DE',
                        surface:    '#F4F1DE',
                        sidebar:    '#F4F1DE',
                        sidebarShadow: 'none',
                        border:     '#000000',
                        text:       '#333333',
                        grey100:    '#000000',
                        grey80:     '#333333',
                        grey60:     '#666666',
                        grey40:     '#999999',
                        grey20:     '#CCCCCC',
                        error:      '#FF0000',
                        success:    '#618C82',
                    },
                    font: "'System UI', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    lineHeight: '1.6',
                    fontSizes: { sm: '12px', md: '14px', lg: '16px', xl: '18px', xxl: '24px' },
                    space: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', xxl: '48px' },
                    shadow: '4px 4px 0px #000000',
                    radius: '0',
                },
            },

            assets: {
                styles: ['/custom-brutalism.css'],
            },
        };

        const admin = new AdminJS({ ...adminOptions, componentLoader });

        if (process.env.NODE_ENV === 'production') {
            await admin.initialize();
        } else {
            admin.watch();
        }

        // ── Authenticated router ─────────────────────────────
        const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
            admin,
            {
                authenticate: async (email, password) => {
                    const user = await prisma.user.findUnique({ where: { email } });
                    if (user && user.role === 'SUPERADMIN') {
                        const matched = await bcrypt.compare(password, user.password_hash);
                        if (matched) return user;
                    }
                    return false;
                },
                cookiePassword: process.env.COOKIE_SECRET || 'campuseats-super-secret-cookie-key',
            },
            null,
            {
                resave: false,
                saveUninitialized: true,
                secret: process.env.SESSION_SECRET || 'campuseats-session-secret',
            }
        );

        router.use('/dashboard', adminRouter);
        console.log('✅   AdminJS mounted at /api/superadmin/dashboard');

    } catch (error) {
        console.error('❌   AdminJS initialization failed:', error);
    }
};

initializeAdminJS();

module.exports = router;