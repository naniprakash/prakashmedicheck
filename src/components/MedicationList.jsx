import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function MedicationList({ onSelectMedication }) {
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMed, setNewMed] = useState({
        name: '',
        dosage: '',
        frequency: 'daily',
        times: ['09:00'],
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: '',
        phone_number: '',
        reminder_minutes: 15
    });

    useEffect(() => {
        loadMedications();
    }, []);

    const loadMedications = async () => {
        try {
            const result = await api.getMedications();
            if (result.success) {
                setMedications(result.medications);
            }
        } catch (error) {
            console.error('Error loading medications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMedication = async (e) => {
        e.preventDefault();
        try {
            const result = await api.addMedication(newMed);
            if (result.success) {
                setShowAddModal(false);
                setNewMed({
                    name: '',
                    dosage: '',
                    frequency: 'daily',
                    times: ['09:00'],
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: '',
                    notes: '',
                    phone_number: '',
                    reminder_minutes: 15
                });
                loadMedications();

                // Show interaction warnings if any
                if (result.interactions && result.interactions.total_interactions > 0) {
                    alert(`⚠️ ${result.interactions.message}`);
                }
            }
        } catch (error) {
            console.error('Error adding medication:', error);
            alert('Failed to add medication');
        }
    };

    const handleDeleteMedication = async (id) => {
        if (!confirm('Are you sure you want to delete this medication?')) return;

        try {
            const result = await api.deleteMedication(id);
            if (result.success) {
                loadMedications();
            }
        } catch (error) {
            console.error('Error deleting medication:', error);
        }
    };

    const addTimeSlot = () => {
        setNewMed({ ...newMed, times: [...newMed.times, '12:00'] });
    };

    const updateTimeSlot = (index, value) => {
        const newTimes = [...newMed.times];
        newTimes[index] = value;
        setNewMed({ ...newMed, times: newTimes });
    };

    const removeTimeSlot = (index) => {
        const newTimes = newMed.times.filter((_, i) => i !== index);
        setNewMed({ ...newMed, times: newTimes });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center" style={{ minHeight: '400px' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="medication-list animate-fade-in">
            <div className="flex justify-between items-center mb-xl">
                <div>
                    <h1 style={{ marginBottom: '0.25rem' }}>Active Regimen</h1>
                    <p className="text-secondary">Comprehensive list of your current medications and schedules.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <span>+</span> Register New Medication
                </button>
            </div>

            {medications.length === 0 ? (
                <div className="card text-center" style={{ padding: '4rem 0', backgroundColor: 'var(--bg-secondary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>📋</div>
                    <h3>No Active Medications</h3>
                    <p className="text-secondary mb-lg">Your medication list is currently empty.</p>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        Initialize Medication Record
                    </button>
                </div>
            ) : (
                <div className="grid grid-2">
                    {medications.map((med) => (
                        <div key={med.id} className="card">
                            <div className="flex justify-between items-start mb-lg">
                                <div>
                                    <h3 style={{ margin: 0, color: 'var(--primary)' }}>{med.name}</h3>
                                    <div className="flex gap-sm mt-sm">
                                        <span className={`badge badge-info`}>{med.dosage}</span>
                                        <span className={`badge badge-success`}>{med.frequency.toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className="flex gap-sm">
                                    <button
                                        className="btn btn-outline"
                                        style={{ padding: '0.4rem' }}
                                        onClick={() => onSelectMedication && onSelectMedication(med)}
                                        title="Detailed Analysis"
                                    >
                                        🔍
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        style={{ padding: '0.4rem', color: 'var(--danger)' }}
                                        onClick={() => handleDeleteMedication(med.id)}
                                        title="Remove Record"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <div className="mb-md p-md" style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                                    Scheduled Intake
                                </div>
                                <div className="flex gap-sm flex-wrap">
                                    {(typeof med.times === 'string' ? JSON.parse(med.times) : med.times).map((time, idx) => (
                                        <span key={idx} style={{
                                            padding: '0.25rem 0.75rem',
                                            backgroundColor: 'white',
                                            border: '1px solid var(--border-subtle)',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.875rem',
                                            fontWeight: '600'
                                        }}>
                                            {time}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center" style={{ fontSize: '0.875rem' }}>
                                <div className="text-secondary">
                                    <span style={{ fontWeight: '600' }}>Starts:</span> {new Date(med.start_date).toLocaleDateString()}
                                </div>
                                {med.phone_number && (
                                    <div className="badge badge-info" style={{ borderRadius: 'var(--radius-sm)' }}>
                                        SMS Reminders Enabled ({med.reminder_minutes}m)
                                    </div>
                                )}
                            </div>

                            {med.notes && (
                                <div className="mt-md pt-md" style={{ borderTop: '1px solid var(--border-subtle)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--primary)' }}>Instructions:</span> {med.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Medication Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-xl">
                            <h2 style={{ margin: 0 }}>Register Medication</h2>
                            <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => setShowAddModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleAddMedication}>
                            <div className="input-group">
                                <label className="input-label">Pharmaceutical Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Enter medication name"
                                    value={newMed.name}
                                    onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-2">
                                <div className="input-group">
                                    <label className="input-label">Dosage (Unit)</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g., 500mg"
                                        value={newMed.dosage}
                                        onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Interval Frequency</label>
                                    <select
                                        className="input-field"
                                        value={newMed.frequency}
                                        onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                                    >
                                        <option value="daily">Every 24 Hours (Daily)</option>
                                        <option value="twice-daily">Every 12 Hours</option>
                                        <option value="three-times-daily">Every 8 Hours</option>
                                        <option value="weekly">Weekly Analysis</option>
                                        <option value="as-needed">PRN (As Needed)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Scheduled Intake Times</label>
                                <div className="flex flex-col gap-sm">
                                    {newMed.times.map((time, idx) => (
                                        <div key={idx} className="flex gap-sm">
                                            <input
                                                type="time"
                                                className="input-field"
                                                value={time}
                                                onChange={(e) => updateTimeSlot(idx, e.target.value)}
                                                required
                                            />
                                            {newMed.times.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline"
                                                    style={{ color: 'var(--danger)' }}
                                                    onClick={() => removeTimeSlot(idx)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn btn-outline mt-xs"
                                        style={{ width: 'fit-content' }}
                                        onClick={addTimeSlot}
                                    >
                                        + Add Time Slot
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-2 mt-md">
                                <div className="input-group">
                                    <label className="input-label">Initiation Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={newMed.start_date}
                                        onChange={(e) => setNewMed({ ...newMed, start_date: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Termination Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={newMed.end_date}
                                        onChange={(e) => setNewMed({ ...newMed, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-2">
                                <div className="input-group">
                                    <label className="input-label">Notification Number</label>
                                    <input
                                        type="tel"
                                        className="input-field"
                                        placeholder="+1234567890"
                                        value={newMed.phone_number}
                                        onChange={(e) => setNewMed({ ...newMed, phone_number: e.target.value })}
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Alert Sensitivity (Lead Time)</label>
                                    <select
                                        className="input-field"
                                        value={newMed.reminder_minutes}
                                        onChange={(e) => setNewMed({ ...newMed, reminder_minutes: parseInt(e.target.value) })}
                                    >
                                        <option value="5">5 Minutes</option>
                                        <option value="15">15 Minutes</option>
                                        <option value="30">30 Minutes</option>
                                        <option value="60">1 Hour</option>
                                    </select>
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Clinical Notes / Instructions</label>
                                <textarea
                                    className="input-field"
                                    placeholder="Specify administration notes (e.g., take with food)"
                                    rows="3"
                                    value={newMed.notes}
                                    onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-md justify-end mt-xl">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Discard
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ padding: '0.625rem 2rem' }}>
                                    Confirm Enrollment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
