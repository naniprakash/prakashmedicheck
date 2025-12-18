import { useState, useRef } from 'react';
import api from '../utils/api';

export default function PillScanner({ onPillRecognized }) {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
            recognizePill(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const recognizePill = async (imageData) => {
        setScanning(true);
        setResult(null);

        try {
            const response = await api.recognizePill(imageData);
            setResult(response);

            if (response.success && onPillRecognized) {
                onPillRecognized(response);
            }
        } catch (error) {
            console.error('Error recognizing pill:', error);
            setResult({
                success: false,
                error: 'Failed to process image'
            });
        } finally {
            setScanning(false);
        }
    };

    const resetScanner = () => {
        setImagePreview(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="pill-scanner">
            <div className="glass-card">
                <h2>📸 Pill Recognition</h2>
                <p className="text-secondary mb-lg">
                    Upload a photo of your pill to identify it using AI
                </p>

                {!imagePreview ? (
                    <div
                        className="upload-zone"
                        style={{
                            border: '2px dashed var(--border-color)',
                            borderRadius: 'var(--radius-xl)',
                            padding: '3rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all var(--transition-base)',
                            background: 'var(--bg-glass)'
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderColor = 'var(--primary-blue)';
                            e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)';
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.background = 'var(--bg-glass)';
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.background = 'var(--bg-glass)';

                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith('image/')) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setImagePreview(reader.result);
                                    recognizePill(reader.result);
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                    >
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📷</div>
                        <h3>Upload Pill Image</h3>
                        <p className="text-secondary mb-lg">
                            Click to browse or drag and drop an image
                        </p>
                        <button className="btn btn-primary" type="button">
                            Choose Image
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
                    </div>
                ) : (
                    <div>
                        {/* Image Preview */}
                        <div style={{
                            marginBottom: '1.5rem',
                            borderRadius: 'var(--radius-xl)',
                            overflow: 'hidden',
                            maxHeight: '400px',
                            display: 'flex',
                            justifyContent: 'center',
                            background: 'var(--bg-glass)'
                        }}>
                            <img
                                src={imagePreview}
                                alt="Pill preview"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '400px',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>

                        {/* Scanning State */}
                        {scanning && (
                            <div className="text-center" style={{ padding: '2rem' }}>
                                <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                                <p className="text-secondary">Analyzing image with AI...</p>
                            </div>
                        )}

                        {/* Results */}
                        {result && !scanning && (
                            <div>
                                {result.success ? (
                                    <div className="glass-card" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--success-green)' }}>
                                        <h3>✅ Pill Identified</h3>

                                        <div style={{ marginTop: '1rem' }}>
                                            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                                                {result.pill_name}
                                            </div>

                                            <div className="flex items-center gap-md mb-lg">
                                                <span className="badge badge-success">
                                                    {(result.confidence * 100).toFixed(1)}% Confidence
                                                </span>
                                                {result.features && (
                                                    <span className="badge badge-info">
                                                        Color: {result.features.dominant_color}
                                                    </span>
                                                )}
                                            </div>

                                            {result.warning && (
                                                <div style={{
                                                    padding: '1rem',
                                                    background: 'rgba(245, 158, 11, 0.1)',
                                                    border: '1px solid var(--warning-yellow)',
                                                    borderRadius: 'var(--radius-md)',
                                                    marginBottom: '1rem'
                                                }}>
                                                    ⚠️ {result.warning}
                                                </div>
                                            )}

                                            {result.top_predictions && result.top_predictions.length > 1 && (
                                                <div>
                                                    <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                                        Other Possibilities:
                                                    </div>
                                                    <div className="grid gap-sm">
                                                        {result.top_predictions.slice(1).map((pred, idx) => (
                                                            <div key={idx} style={{
                                                                padding: '0.75rem',
                                                                background: 'var(--bg-glass)',
                                                                borderRadius: 'var(--radius-md)',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}>
                                                                <span>{pred.name}</span>
                                                                <span className="text-muted">
                                                                    {(pred.confidence * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--error-red)' }}>
                                        <h3>❌ Recognition Failed</h3>
                                        <p className="text-secondary">{result.error || result.message}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-md mt-lg">
                            <button className="btn btn-outline" onClick={resetScanner}>
                                📷 Scan Another
                            </button>
                            {result?.success && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        // Pre-fill medication form with recognized pill
                                        alert(`Add ${result.pill_name} to your medications`);
                                    }}
                                >
                                    ➕ Add to Medications
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-lg" style={{
                    padding: '1rem',
                    background: 'var(--bg-glass)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '4px solid var(--info-blue)'
                }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>💡 Tips for Best Results:</div>
                    <ul style={{ marginLeft: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <li>Use good lighting</li>
                        <li>Place pill on a plain background</li>
                        <li>Ensure pill is in focus</li>
                        <li>Include any imprints or markings</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
