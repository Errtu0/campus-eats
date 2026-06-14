import React, { useEffect, useState } from 'react';
import { ApiClient } from 'adminjs';

const Dashboard = () => {
    const [stats, setStats] = useState({
        users: '...',
        restaurants: '...',
        orders: '...',
        menuItems: '...'
    });

    useEffect(() => {
        const api = new ApiClient();
        api.getDashboard()
            .then((response) => {
                if (response.data) {
                    setStats(response.data);
                }
            })
            .catch((error) => {
                console.error("Failed to fetch database analytics for Dashboard:", error);
            });
    }, []);

    const cardStyle = {
        backgroundColor: '#FFFFFF',
        border: '4px solid #000000',
        boxShadow: '8px 8px 0px #000000',
        padding: '24px',
        marginBottom: '24px',
    };

    const headingStyle = {
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: '#000000',
        borderBottom: '4px solid #000000',
        paddingBottom: '12px',
        marginBottom: '16px',
    };

    const statBoxStyle = {
        backgroundColor: '#F4F1DE',
        border: '3px solid #000000',
        boxShadow: '5px 5px 0px #000000',
        padding: '20px',
        textAlign: 'center',
        flex: '1',
        minWidth: '160px',
    };

    const labelStyle = {
        fontWeight: 800,
        textTransform: 'uppercase',
        fontSize: '11px',
        letterSpacing: '0.1em',
        color: '#618C82',
        marginBottom: '8px',
    };

    const valueStyle = {
        fontWeight: 900,
        fontSize: '36px',
        color: '#DD5544',
        lineHeight: 1,
    };

    const linkButtonStyle = {
        display: 'inline-block',
        border: '2px solid #000000',
        backgroundColor: '#DD5544',
        color: '#FFFFFF',
        fontWeight: 900,
        fontSize: '13px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '10px 20px',
        textDecoration: 'none',
        boxShadow: '4px 4px 0px #000000',
        marginRight: '12px',
        marginTop: '8px',
        cursor: 'pointer',
    };

    const quickLinks = [
        { label: 'View All Orders',       href: '/api/superadmin/dashboard/resources/Order'          },
        { label: 'Menu Items',             href: '/api/superadmin/dashboard/resources/MenuItem'       },
        { label: 'Restaurants',            href: '/api/superadmin/dashboard/resources/Restaurant'     },
        { label: 'Users',                  href: '/api/superadmin/dashboard/resources/User'           },
        { label: 'Coupons',                href: '/api/superadmin/dashboard/resources/Coupon'         },
        { label: 'Inventory',              href: '/api/superadmin/dashboard/resources/InventoryItem'  },
        { label: 'Promotions',             href: '/api/superadmin/dashboard/resources/PromotionNews'  },
        { label: 'Payments',               href: '/api/superadmin/dashboard/resources/Payment'        },
    ];

    return (
        <div style={{ padding: '32px', backgroundColor: '#F4F1DE', minHeight: '100vh' }}>

            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                    fontWeight: 900,
                    fontSize: '32px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#000000',
                    margin: 0,
                }}>
                    Campus Eats OS
                </h1>
                <p style={{ color: '#618C82', fontWeight: 700, marginTop: '4px', fontSize: '14px' }}>
                    SUPERADMIN CONTROL PANEL — FULL SYSTEM OVERVIEW
                </p>
            </div>

            {/* Stat Cards Row */}
            <div style={cardStyle}>
                <h2 style={headingStyle}>System Stats</h2>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Total Users',       value: stats.users },
                        { label: 'Restaurants',       value: stats.restaurants },
                        { label: 'Active Orders',     value: stats.orders },
                        { label: 'Menu Items',        value: stats.menuItems },
                    ].map(({ label, value }) => (
                        <div key={label} style={statBoxStyle}>
                            <div style={labelStyle}>{label}</div>
                            <div style={valueStyle}>{value}</div>
                        </div>
                    ))}
                </div>
                <p style={{ marginTop: '16px', fontSize: '12px', color: '#618C82', fontWeight: 600 }}>
                    Live production metrics synchronized securely from system database.
                </p>
            </div>

            {/* Quick Links */}
            <div style={cardStyle}>
                <h2 style={headingStyle}>Quick Navigation</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {quickLinks.map(({ label, href }) => (
                        <a key={href} href={href} style={linkButtonStyle}>
                            {label}
                        </a>
                    ))}
                </div>
            </div>

            {/* Pending Approvals Reminder */}
            <div style={{ ...cardStyle, borderColor: '#DD5544', boxShadow: '8px 8px 0px #DD5544' }}>
                <h2 style={{ ...headingStyle, borderColor: '#DD5544' }}>Notice: Approval Queue</h2>
                <p style={{ fontWeight: 700, color: '#333333' }}>
                    Restaurants with status PENDING are waiting for administrative clearance.
                    Review them in the{' '}
                    <a
                        href="/api/superadmin/dashboard/resources/Restaurant?filters.status=PENDING"
                        style={{ color: '#DD5544', fontWeight: 900, textDecoration: 'underline' }}
                    >
                        Approval Gate
                    </a>.
                </p>
            </div>

        </div>
    );
};

export default Dashboard;