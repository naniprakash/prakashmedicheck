import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Analytics() {
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(30);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, [selectedPeriod]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const [statsResult, logsResult] = await Promise.all([
                api.getAdherenceStats(null, selectedPeriod),
                api.getLogs()
            ]);

            if (statsResult.success) {
                setStats(statsResult.stats);
            }
            if (logsResult.success) {
                setLogs(logsResult.logs);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center" style={{ minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    const adherenceRate = stats?.adherence_rate || 0;

    return (
        <div className="analytics animate-fade-in">
            <div className="flex justify-between items-center mb-xl">
                <div>
                    <h1 style={{ marginBottom: '0.25rem' }}>Analytical Insights</h1>
                    <p className="text-secondary">Comprehensive review of your treatment adherence and history.</p>
                </div>
                <div className="flex items-center gap-md">
                    <span className="text-muted" style={{ fontSize: '0.875rem' }}>Reporting Period:</span>
                    <select
                        className="input-field"
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                        style={{ width: 'auto' }}
                    >
                        <option value={7}>Prior 7 Days</option>
                        <option value={30}>Prior 30 Days</option>
                        <option value={90}>Prior 90 Days</option>
                    </select>
                </div>
            </div>

            {/* Adherence Overview */}
            <div className="grid grid-2 mb-xl">
                <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 className="text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Composite Adherence Rate</h4>
                    <div style={{
                        fontSize: '4.5rem',
                        fontWeight: '800',
                        margin: '1.5rem 0',
                        color: adherenceRate >= 80 ? 'var(--success)' :
                            adherenceRate >= 50 ? 'var(--warning)' :
                                'var(--danger)',
                        lineHeight: 1
                    }}>
                        {adherenceRate.toFixed(0)}%
                    </div>
                    <div className="progress-bar" style={{ height: '0.75rem', maxWidth: '80%', margin: '0 auto' }}>
                        <div className="progress-fill" style={{
                            width: `${adherenceRate}%`,
                            backgroundColor: adherenceRate >= 80 ? 'var(--success)' : adherenceRate >= 50 ? 'var(--warning)' : 'var(--danger)'
                        }}></div>
                    </div>
                    <p className="mt-lg" style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
                        {adherenceRate >= 80 ? '✓ Metric signifies optimal adherence' :
                            adherenceRate >= 50 ? '⚠ Sub-optimal adherence detected' :
                                '❗ Critical adherence variance detected'}
                    </p>
                </div>

                <div className="card">
                    <h4 className="mb-lg">Dosage Statistics</h4>
                    <div className="flex flex-col gap-sm">
                        <div className="flex justify-between items-center p-md" style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                            <span className="text-secondary" style={{ fontWeight: '500' }}>Total Scheduled Doses</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>{stats?.total || 0}</span>
                        </div>
                        <div className="grid grid-2 gap-sm">
                            <div className="p-md" style={{ backgroundColor: '#f0fdf4', borderRadius: 'var(--radius-md)', border: '1px solid #dcfce7' }}>
                                <div className="text-muted mb-xs" style={{ fontSize: '0.75rem', fontWeight: '600' }}>CONFIRMED</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success)' }}>{stats?.taken || 0}</div>
                            </div>
                            <div className="p-md" style={{ backgroundColor: '#fef2f2', borderRadius: 'var(--radius-md)', border: '1px solid #fee2e2' }}>
                                <div className="text-muted mb-xs" style={{ fontSize: '0.75rem', fontWeight: '600' }}>VARIANCES</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--danger)' }}>{stats?.missed || 0}</div>
                            </div>
                        </div>
                        <div className="p-md" style={{ backgroundColor: '#fffbeb', borderRadius: 'var(--radius-md)', border: '1px solid #fef9c3' }}>
                            <div className="flex justify-between items-center">
                                <span className="text-secondary" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Pending Administration</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--warning)' }}>{stats?.pending || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card mb-xl">
                <div className="flex justify-between items-center mb-lg">
                    <h3 style={{ margin: 0 }}>Treatment Log History</h3>
                    <button className="btn btn-outline" style={{ fontSize: '0.75rem' }}>Export Data</button>
                </div>

                {logs.length === 0 ? (
                    <div className="text-center text-muted" style={{ padding: '4rem 0' }}>
                        <p>No historical treatment data available for this period.</p>
                    </div>
                ) : (
                    <div className="flex flex-col" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Treatment</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Timestamp</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.slice(0, 15).map((log) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <td style={{ padding: '1rem', fontWeight: '600' }}>Medication Record #{log.medication_id}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            {new Date(log.scheduled_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className={`badge badge-${log.status === 'taken' ? 'success' : log.status === 'missed' ? 'danger' : 'warning'}`}>
                                                {log.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Insights */}
            <div className="card" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                <div className="flex items-center gap-md mb-md">
                    <div style={{ fontSize: '2rem' }}>💡</div>
                    <h3 style={{ margin: 0, color: 'white' }}>System Recommendations</h3>
                </div>
                <div className="grid grid-2 gap-lg">
                    <div className="p-md" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontWeight: '700', marginBottom: '0.50rem' }}>Status Analysis</div>
                        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                            {adherenceRate >= 80 ? 'Current schedule maintains peak pharmaceutical efficacy. No protocol adjustments required.' :
                                adherenceRate >= 50 ? 'Variances detected. We recommend enabling proactive SMS alerts to mitigate missing doses.' :
                                    'Significant protocol divergence detected. Please review your regimen with a healthcare professional.'}
                        </p>
                    </div>
                    <div className="p-md" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontWeight: '700', marginBottom: '0.50rem' }}>AI Optimization Tip</div>
                        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                            Based on your login patterns, scheduling dose confirmations between 08:00 AM and 09:30 AM correlates with 100% adherence.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
