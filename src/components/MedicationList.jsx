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
        notes: ''
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
                    notes: ''
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
        <div className="medication-list">
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h2>💊 My Medications</h2>
                    <p className="text-secondary">Manage your medication schedule</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    + Add Medication
                </button>
            </div>

            {medications.length === 0 ? (
                <div className="glass-card text-center" style={{ padding: '3rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💊</div>
                    <h3>No medications yet</h3>
                    <p className="text-secondary mb-lg">Start by adding your first medication</p>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        + Add Your First Medication
                    </button>
                </div>
            ) : (
                <div className="grid gap-lg">
                    {medications.map((med) => (
                        <div key={med.id} className="glass-card">
                            <div className="flex justify-between items-start mb-md">
                                <div>
                                    <h3>{med.name}</h3>
                                    <div className="flex gap-sm mt-sm">
                                        <span className="badge badge-info">{med.dosage}</span>
                                        <span className="badge badge-success">{med.frequency}</span>
                                    </div>
                                </div>
                                <div className="flex gap-sm">
                                    <button
                                        className="btn btn-outline btn-icon"
                                        onClick={() => onSelectMedication && onSelectMedication(med)}
                                        title="View details"
                                    >
                                        👁️
                                    </button>
                                    <button
                                        className="btn btn-danger btn-icon"
                                        onClick={() => handleDeleteMedication(med.id)}
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <div className="mb-md">
                                <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    Schedule Times:
                                </div>
                                <div className="flex gap-sm flex-wrap">
                                    {(typeof med.times === 'string' ? JSON.parse(med.times) : med.times).map((time, idx) => (
                                        <div key={idx} style={{
                                            padding: '0.5rem 1rem',
                                            background: 'var(--bg-glass)',
                                            borderRadius: 'var(--radius-md)',
                                            fontWeight: '600'
                                        }}>
                                            ⏰ {time}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center" style={{
                                padding: '0.75rem',
                                background: 'var(--bg-glass)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                    📅 Started: {new Date(med.start_date).toLocaleDateString()}
                                    {med.end_date && ` • Ends: ${new Date(med.end_date).toLocaleDateString()}`}
                                </div>
                            </div>

                            {med.notes && (
                                <div className="mt-md" style={{
                                    padding: '0.75rem',
                                    background: 'var(--bg-glass)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.875rem',
                                    fontStyle: 'italic',
                                    color: 'var(--text-secondary)'
                                }}>
                                    📝 {med.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Medication Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Add New Medication</h2>
                        <form onSubmit={handleAddMedication}>
                            <div className="input-group">
                                <label className="input-label">Medication Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g., Aspirin"
                                    value={newMed.name}
                                    onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-2">
                                <div className="input-group">
                                    <label className="input-label">Dosage</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g., 100mg"
                                        value={newMed.dosage}
                                        onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Frequency</label>
                                    <select
                                        className="input-field"
                                        value={newMed.frequency}
                                        onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="twice-daily">Twice Daily</option>
                                        <option value="three-times-daily">Three Times Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="as-needed">As Needed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Schedule Times</label>
                                {newMed.times.map((time, idx) => (
                                    <div key={idx} className="flex gap-sm mb-sm">
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
                                                className="btn btn-danger btn-icon"
                                                onClick={() => removeTimeSlot(idx)}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={addTimeSlot}
                                    style={{ marginTop: '0.5rem' }}
                                >
                                    + Add Time Slot
                                </button>
                            </div>

                            <div className="grid grid-2">
                                <div className="input-group">
                                    <label className="input-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={newMed.start_date}
                                        onChange={(e) => setNewMed({ ...newMed, start_date: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">End Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={newMed.end_date}
                                        onChange={(e) => setNewMed({ ...newMed, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Notes (Optional)</label>
                                <textarea
                                    className="input-field"
                                    placeholder="Any special instructions..."
                                    rows="3"
                                    value={newMed.notes}
                                    onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-md justify-end">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Add Medication
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
