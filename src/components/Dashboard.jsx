import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [todayLogs, setTodayLogs] = useState([]);

    useEffect(() => {
        loadDashboard();
        loadTodayLogs();
    }, []);

    const loadDashboard = async () => {
        try {
            const result = await api.getDashboardData();
            if (result.success) {
                setDashboardData(result);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTodayLogs = async () => {
        const today = new Date().toISOString().split('T')[0];
        try {
            const result = await api.getLogs(null, today, today);
            if (result.success) {
                setTodayLogs(result.logs);
            }
        } catch (error) {
            console.error('Error loading logs:', error);
        }
    };

    const markAsTaken = async (logId) => {
        try {
            const now = new Date().toISOString();
            await api.updateLog(logId, 'taken', now);
            loadTodayLogs();
            loadDashboard();
        } catch (error) {
            console.error('Error updating log:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center" style={{ minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    const adherenceRate = dashboardData?.adherence_rate || 0;
    const interactions = dashboardData?.interactions || {};

    return (
        <div className="dashboard animate-fade-in">
            <div className="mb-lg">
                <h1 style={{ marginBottom: '0.25rem' }}>Dashboard Overview</h1>
                <p className="text-secondary">Track your medication adherence and health insights.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-3 mb-xl">
                <div className="card">
                    <div className="text-muted mb-xs" style={{ fontSize: '0.875rem', fontWeight: '500', textTransform: 'uppercase' }}>Active Medications</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>
                        {dashboardData?.total_medications || 0}
                    </div>
                </div>

                <div className="card">
                    <div className="text-muted mb-xs" style={{ fontSize: '0.875rem', fontWeight: '500', textTransform: 'uppercase' }}>Scheduled Doses Today</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>
                        {dashboardData?.today_doses || 0}
                    </div>
                </div>

                <div className="card">
                    <div className="text-muted mb-xs" style={{ fontSize: '0.875rem', fontWeight: '500', textTransform: 'uppercase' }}>7-Day Compliance</div>
                    <div className="flex items-center justify-between mb-sm">
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: adherenceRate >= 80 ? 'var(--success)' : adherenceRate >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                            {adherenceRate.toFixed(0)}%
                        </div>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${adherenceRate}%`, backgroundColor: adherenceRate >= 80 ? 'var(--success)' : adherenceRate >= 50 ? 'var(--warning)' : 'var(--danger)' }}></div>
                    </div>
                </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
                {/* Left Column: Schedule */}
                <div className="flex flex-col gap-lg">
                    {/* Interaction Warnings */}
                    {interactions.overall_risk && interactions.overall_risk !== 'none' && (
                        <div className="card" style={{
                            backgroundColor: interactions.overall_risk === 'high' ? '#fef2f2' : '#fffbeb',
                            borderColor: interactions.overall_risk === 'high' ? 'var(--danger)' : 'var(--warning)',
                        }}>
                            <h4 className="flex items-center gap-sm" style={{ color: interactions.overall_risk === 'high' ? 'var(--danger)' : 'var(--warning)' }}>
                                <span>⚠️</span> Drug Interaction Alerts
                            </h4>
                            <p className="text-secondary mb-md" style={{ fontSize: '0.875rem' }}>{interactions.message}</p>
                            <div className="flex flex-col gap-sm">
                                {interactions.interactions && interactions.interactions.slice(0, 2).map((interaction, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-sm" style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                        <div>
                                            <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{interaction.drug1} + {interaction.drug2}</span>
                                        </div>
                                        <span className={`badge badge-${interaction.severity === 'high' ? 'danger' : 'warning'}`}>
                                            {interaction.severity}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <div className="flex justify-between items-center mb-lg">
                            <h3 style={{ margin: 0 }}>Today's Schedule</h3>
                            <div className="badge badge-info">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                        </div>

                        {todayLogs.length === 0 ? (
                            <div className="text-center text-muted" style={{ padding: '3rem 0' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
                                <p>All clear! No medications remaining for today.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-sm">
                                {todayLogs.map((log) => (
                                    <div key={log.id} className="flex justify-between items-center p-md" style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        borderLeft: `4px solid ${log.status === 'taken' ? 'var(--success)' : log.status === 'missed' ? 'var(--danger)' : 'var(--warning)'}`
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: '600', color: 'var(--primary)' }}>Medication ID: {log.medication_id}</div>
                                            <div className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                                Expected: {new Date(log.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-md">
                                            <span className={`badge badge-${log.status === 'taken' ? 'success' : log.status === 'missed' ? 'danger' : 'warning'}`}>
                                                {log.status.toUpperCase()}
                                            </span>
                                            {log.status === 'pending' && (
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                                    onClick={() => markAsTaken(log.id)}
                                                >
                                                    Confirm Intake
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Mini List */}
                <div className="flex flex-col gap-lg">
                    <div className="card">
                        <h4 className="mb-md">Active Regimen</h4>
                        <div className="flex flex-col gap-md">
                            {dashboardData?.medications?.slice(0, 5).map((med) => (
                                <div key={med.id} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--spacing-sm)' }}>
                                    <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{med.name}</div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                        {med.dosage} • {med.frequency}
                                    </div>
                                </div>
                            ))}
                            <button className="btn btn-outline w-full" style={{ marginTop: 'var(--spacing-sm)', width: '100%' }}>
                                View Full List
                            </button>
                        </div>
                    </div>

                    <div className="card bg-primary" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                        <h4 style={{ color: 'white' }}>AI Health Tip</h4>
                        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                            Consistent timing increases medication efficacy. Try taking your primary dose within a 15-minute window each day.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
