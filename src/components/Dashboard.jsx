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
        <div className="dashboard">
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1>🏥 Medicine Tracker</h1>
                    <p className="text-secondary">Your health companion powered by AI</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-3 mb-lg">
                <div className="glass-card">
                    <div className="flex items-center gap-md mb-md">
                        <div style={{ fontSize: '2rem' }}>💊</div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.875rem' }}>Total Medications</div>
                            <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                                {dashboardData?.total_medications || 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-card">
                    <div className="flex items-center gap-md mb-md">
                        <div style={{ fontSize: '2rem' }}>📅</div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.875rem' }}>Today's Doses</div>
                            <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                                {dashboardData?.today_doses || 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-card">
                    <div className="flex items-center gap-md mb-md">
                        <div style={{ fontSize: '2rem' }}>📊</div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.875rem' }}>Adherence Rate (7d)</div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: adherenceRate >= 80 ? 'var(--success-green)' : adherenceRate >= 50 ? 'var(--warning-yellow)' : 'var(--error-red)' }}>
                                {adherenceRate.toFixed(0)}%
                            </div>
                        </div>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${adherenceRate}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Interaction Warnings */}
            {interactions.overall_risk && interactions.overall_risk !== 'none' && (
                <div className="glass-card mb-lg" style={{
                    borderColor: interactions.overall_risk === 'high' ? 'var(--error-red)' :
                        interactions.overall_risk === 'medium' ? 'var(--warning-yellow)' :
                            'var(--info-blue)',
                    borderWidth: '2px'
                }}>
                    <h3>⚠️ Drug Interactions</h3>
                    <p className="text-secondary mb-md">{interactions.message}</p>
                    {interactions.interactions && interactions.interactions.slice(0, 3).map((interaction, idx) => (
                        <div key={idx} className="mb-sm" style={{
                            padding: '0.75rem',
                            background: 'var(--bg-glass)',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: `4px solid ${interaction.severity === 'high' ? 'var(--error-red)' : 'var(--warning-yellow)'}`
                        }}>
                            <div className="flex justify-between items-center mb-sm">
                                <strong>{interaction.drug1} + {interaction.drug2}</strong>
                                <span className={`badge badge-${interaction.severity === 'high' ? 'danger' : 'warning'}`}>
                                    {interaction.severity}
                                </span>
                            </div>
                            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>{interaction.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Today's Schedule */}
            <div className="glass-card">
                <h2>📋 Today's Schedule</h2>
                <p className="text-secondary mb-lg">Track your medication intake for today</p>

                {todayLogs.length === 0 ? (
                    <div className="text-center text-muted" style={{ padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <p>No medications scheduled for today</p>
                    </div>
                ) : (
                    <div className="grid gap-md">
                        {todayLogs.map((log) => (
                            <div key={log.id} className="flex justify-between items-center" style={{
                                padding: '1rem',
                                background: 'var(--bg-glass)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: `4px solid ${log.status === 'taken' ? 'var(--success-green)' : log.status === 'missed' ? 'var(--error-red)' : 'var(--warning-yellow)'}`
                            }}>
                                <div className="flex items-center gap-md">
                                    <div style={{ fontSize: '1.5rem' }}>
                                        {log.status === 'taken' ? '✅' : log.status === 'missed' ? '❌' : '⏰'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>Medication #{log.medication_id}</div>
                                        <div className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                            Scheduled: {new Date(log.scheduled_time).toLocaleTimeString()}
                                        </div>
                                        {log.taken_time && (
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                Taken: {new Date(log.taken_time).toLocaleTimeString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-sm">
                                    <span className={`badge badge-${log.status === 'taken' ? 'success' : log.status === 'missed' ? 'danger' : 'warning'}`}>
                                        {log.status}
                                    </span>
                                    {log.status === 'pending' && (
                                        <button
                                            className="btn btn-primary btn-icon"
                                            onClick={() => markAsTaken(log.id)}
                                            title="Mark as taken"
                                        >
                                            ✓
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Medications */}
            {dashboardData?.medications && dashboardData.medications.length > 0 && (
                <div className="glass-card mt-lg">
                    <h3>💊 Recent Medications</h3>
                    <div className="grid gap-md mt-md">
                        {dashboardData.medications.map((med) => (
                            <div key={med.id} style={{
                                padding: '1rem',
                                background: 'var(--bg-glass)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{med.name}</div>
                                        <div className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                            {med.dosage} • {med.frequency}
                                        </div>
                                    </div>
                                    <div className="badge badge-info">
                                        {(typeof med.times === 'string' ? JSON.parse(med.times) : med.times).length}x daily
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
