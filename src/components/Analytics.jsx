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
        <div className="analytics">
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h2>📊 Analytics & Insights</h2>
                    <p className="text-secondary">Track your medication adherence patterns</p>
                </div>
                <select
                    className="input-field"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                    style={{ width: 'auto' }}
                >
                    <option value={7}>Last 7 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={90}>Last 90 Days</option>
                </select>
            </div>

            {/* Adherence Overview */}
            <div className="grid grid-2 mb-lg">
                <div className="glass-card">
                    <h3>Overall Adherence</h3>
                    <div style={{
                        fontSize: '4rem',
                        fontWeight: '700',
                        textAlign: 'center',
                        margin: '2rem 0',
                        color: adherenceRate >= 80 ? 'var(--success-green)' :
                            adherenceRate >= 50 ? 'var(--warning-yellow)' :
                                'var(--error-red)'
                    }}>
                        {adherenceRate.toFixed(0)}%
                    </div>
                    <div className="progress-bar" style={{ height: '1rem' }}>
                        <div className="progress-fill" style={{ width: `${adherenceRate}%` }}></div>
                    </div>
                    <p className="text-center text-secondary mt-md">
                        {adherenceRate >= 80 ? '🎉 Excellent adherence!' :
                            adherenceRate >= 50 ? '👍 Good, but room for improvement' :
                                '⚠️ Needs attention'}
                    </p>
                </div>

                <div className="glass-card">
                    <h3>Statistics</h3>
                    <div className="grid gap-md mt-md">
                        <div className="flex justify-between items-center" style={{
                            padding: '1rem',
                            background: 'var(--bg-glass)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <span className="text-secondary">Total Doses</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                                {stats?.total || 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center" style={{
                            padding: '1rem',
                            background: 'var(--bg-glass)',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: '4px solid var(--success-green)'
                        }}>
                            <span className="text-secondary">✅ Taken</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success-green)' }}>
                                {stats?.taken || 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center" style={{
                            padding: '1rem',
                            background: 'var(--bg-glass)',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: '4px solid var(--error-red)'
                        }}>
                            <span className="text-secondary">❌ Missed</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--error-red)' }}>
                                {stats?.missed || 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center" style={{
                            padding: '1rem',
                            background: 'var(--bg-glass)',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: '4px solid var(--warning-yellow)'
                        }}>
                            <span className="text-secondary">⏰ Pending</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning-yellow)' }}>
                                {stats?.pending || 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card">
                <h3>📅 Recent Activity</h3>
                <p className="text-secondary mb-lg">Your medication history</p>

                {logs.length === 0 ? (
                    <div className="text-center text-muted" style={{ padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                        <p>No activity recorded yet</p>
                    </div>
                ) : (
                    <div className="grid gap-sm" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        {logs.slice(0, 20).map((log) => (
                            <div key={log.id} style={{
                                padding: '1rem',
                                background: 'var(--bg-glass)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: `4px solid ${log.status === 'taken' ? 'var(--success-green)' :
                                        log.status === 'missed' ? 'var(--error-red)' :
                                            'var(--warning-yellow)'
                                    }`
                            }}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-md mb-sm">
                                            <span style={{ fontSize: '1.2rem' }}>
                                                {log.status === 'taken' ? '✅' : log.status === 'missed' ? '❌' : '⏰'}
                                            </span>
                                            <span style={{ fontWeight: '600' }}>
                                                Medication #{log.medication_id}
                                            </span>
                                            <span className={`badge badge-${log.status === 'taken' ? 'success' :
                                                    log.status === 'missed' ? 'danger' :
                                                        'warning'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </div>
                                        <div className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                            Scheduled: {new Date(log.scheduled_time).toLocaleString()}
                                        </div>
                                        {log.taken_time && (
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                Taken: {new Date(log.taken_time).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Insights */}
            <div className="glass-card mt-lg" style={{
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                borderColor: 'var(--primary-blue)'
            }}>
                <h3>💡 AI-Powered Insights</h3>
                <div className="grid gap-md mt-md">
                    {adherenceRate >= 80 && (
                        <div style={{
                            padding: '1rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: '4px solid var(--success-green)'
                        }}>
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                                🎉 Great Job!
                            </div>
                            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                Your adherence rate is excellent. Keep up the good work!
                            </p>
                        </div>
                    )}

                    {adherenceRate < 80 && adherenceRate >= 50 && (
                        <div style={{
                            padding: '1rem',
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: '4px solid var(--warning-yellow)'
                        }}>
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                                💪 Room for Improvement
                            </div>
                            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                Try setting more reminders or using a pill organizer to improve adherence.
                            </p>
                        </div>
                    )}

                    {adherenceRate < 50 && (
                        <div style={{
                            padding: '1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: '4px solid var(--error-red)'
                        }}>
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                                ⚠️ Action Needed
                            </div>
                            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                Your adherence is below target. Consider consulting with your healthcare provider about your medication schedule.
                            </p>
                        </div>
                    )}

                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-glass)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '4px solid var(--info-blue)'
                    }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                            📱 Tip: Enable Notifications
                        </div>
                        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                            Turn on browser notifications to get timely reminders for your medications.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
