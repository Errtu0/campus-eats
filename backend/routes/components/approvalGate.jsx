// backend/routes/components/approvalGate.jsx
import React, { useEffect, useState } from 'react';
import { ApiClient } from 'adminjs';

const ApprovalGate = () => {
    const [pendingBranches, setPendingBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const api = new ApiClient();

    const fetchPending = () => {
        setLoading(true);
        // AdminJS'in custom page handler'ından verileri çekiyoruz
        api.getPage({ pageName: 'approvalGate' })
            .then(response => {
                setPendingBranches(response.data.branches || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load pending branches:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = (id, newStatus) => {
        // AdminJS kaynak aksiyonunu tetikleyerek durumu güncelliyoruz
        api.resourceAction({
            resourceId: 'Restaurant',
            actionName: 'edit',
            recordId: id,
            payload: { status: newStatus }
        }).then(() => {
            fetchPending(); // Listeyi canlı olarak yenile
        }).catch(err => {
            alert("Database update failed. Check server fields.");
        });
    };

    // Stiller (Uygulamanın yerel brutalist yapısına tam uyumlu)
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '24px',
        marginTop: '32px'
    };

    const cardStyle = {
        backgroundColor: '#FFFFFF',
        border: '4px solid #000000',
        boxShadow: '8px 8px 0px #000000',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    };

    const badgeStyle = {
        display: 'inline-block',
        backgroundColor: '#618C82',
        color: '#FFFFFF',
        border: '2px solid #000000',
        padding: '4px 8px',
        fontWeight: 900,
        fontSize: '11px',
        letterSpacing: '0.05em',
        marginBottom: '16px',
        alignSelf: 'flex-start'
    };

    const btnApprove = {
        flex: 1,
        border: '2px solid #000000',
        backgroundColor: '#618C82',
        color: '#FFFFFF',
        fontWeight: 900,
        padding: '12px',
        cursor: 'pointer',
        boxShadow: '3px 3px 0px #000000'
    };

    const btnReject = {
        flex: 1,
        border: '2px solid #000000',
        backgroundColor: '#DD5544',
        color: '#FFFFFF',
        fontWeight: 900,
        padding: '12px',
        cursor: 'pointer',
        boxShadow: '3px 3px 0px #000000'
    };

    return (
        <div style={{ padding: '32px', backgroundColor: '#F4F1DE', minHeight: '100vh' }}>
            <div>
                <h1 style={{ fontWeight: 900, fontSize: '32px', textTransform: 'uppercase', color: '#000000', margin: 0 }}>
                    Approval Gate
                </h1>
                <p style={{ color: '#618C82', fontWeight: 700, marginTop: '4px', fontSize: '14px' }}>
                    ADMINISTRATIVE GATEWAY — REVIEW AND CLEAR PENDING BRANCH APPLICATIONS
                </p>
            </div>

            {loading ? (
                <p style={{ fontWeight: 800, marginTop: '40px' }}>FETCHING BRANCH REGISTRIES...</p>
            ) : pendingBranches.length === 0 ? (
                <div style={{ marginTop: '40px', padding: '24px', border: '4px dashed #000000', textAlign: 'center', fontWeight: 800 }}>
                    ALL SYSTEMS CLEAR. NO PENDING BRANCHES REQUIRING ATTENTION.
                </div>
            ) : (
                <div style={gridStyle}>
                    {pendingBranches.map(branch => (
                        <div key={branch.id} style={cardStyle}>
                            <div>
                                <span style={badgeStyle}>PENDING CLEARANCE</span>
                                <h2 style={{ margin: '0 0 8px 0', fontWeight: 900, textTransform: 'uppercase', fontSize: '20px' }}>
                                    {branch.name}
                                </h2>
                                <p style={{ fontWeight: 600, color: '#333333', fontSize: '13px', lineHeight: 1.5, marginBottom: '24px' }}>
                                    Branch Registry ID: #{branch.id} <br />
                                    Assigned Manager ID: #{branch.admin_id || 'NONE'} <br />
                                    Seating Total Capacity: {branch.total_capacity} Tables
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button style={btnApprove} onClick={() => handleAction(branch.id, 'APPROVED')}>APPROVE</button>
                                <button style={btnReject} onClick={() => handleAction(branch.id, 'SUSPENDED')}>REJECT</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ApprovalGate;