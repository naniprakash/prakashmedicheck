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
        <div className="pill-scanner animate-fade-in">
            <div className="card">
                <div className="mb-lg">
                    <h1 style={{ marginBottom: '0.25rem' }}>Visual Identification System</h1>
                    <p className="text-secondary">Leverage AI to identify pharmaceutical products from photographic imagery.</p>
                </div>

                {!imagePreview ? (
                    <div
                        className="upload-zone"
                        style={{
                            border: '2px dashed var(--border-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '4rem 2rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all var(--transition-base)',
                            backgroundColor: 'var(--bg-secondary)'
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.05)';
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';

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
                        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>📸</div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Upload Product Image</h3>
                        <p className="text-secondary mb-xl" style={{ fontSize: '0.875rem' }}>
                            Supported formats: PNG, JPG, WEBP. Maximum file size: 10MB.
                        </p>
                        <button className="btn btn-primary" type="button">
                            Select Source Image
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
                            borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden',
                            maxHeight: '350px',
                            display: 'flex',
                            justifyContent: 'center',
                            backgroundColor: 'white',
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <img
                                src={imagePreview}
                                alt="Source documentation"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '350px',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>

                        {/* Scanning State */}
                        {scanning && (
                            <div className="text-center" style={{ padding: '3rem 0' }}>
                                <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
                                <p className="text-secondary" style={{ fontWeight: '500' }}>Executing AI Recognition Sequence...</p>
                            </div>
                        )}

                        {/* Results */}
                        {result && !scanning && (
                            <div className="mt-xl">
                                {result.success ? (
                                    <div className="card" style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid var(--success)', padding: '1.5rem' }}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Recognition Result</div>
                                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                                                    {result.pill_name}
                                                </div>
                                            </div>
                                            <div className="badge badge-success" style={{ padding: '0.4rem 0.8rem' }}>
                                                {(result.confidence * 100).toFixed(1)}% Confidence
                                            </div>
                                        </div>

                                        <div className="flex gap-md mb-lg">
                                            {result.features && (
                                                <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                                    <span style={{ fontWeight: '600' }}>Dominant Color:</span> {result.features.dominant_color}
                                                </span>
                                            )}
                                        </div>

                                        {result.warning && (
                                            <div className="p-md mb-lg" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 'var(--radius-md)', color: '#9a3412', fontSize: '0.875rem' }}>
                                                <strong>⚠️ Clinical Precaution:</strong> {result.warning}
                                            </div>
                                        )}

                                        {result.top_predictions && result.top_predictions.length > 1 && (
                                            <div className="mt-md pt-md" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                                <div className="text-muted mb-sm" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Alternative Probabilities</div>
                                                <div className="flex flex-col gap-xs">
                                                    {result.top_predictions.slice(1, 3).map((pred, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-secondary" style={{ fontSize: '0.875rem' }}>
                                                            <span>{pred.name}</span>
                                                            <span style={{ fontWeight: '600' }}>{(pred.confidence * 100).toFixed(1)}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="card" style={{ borderLeft: '4px solid var(--danger)', backgroundColor: '#fef2f2' }}>
                                        <h4 style={{ color: 'var(--danger)', margin: 0 }}>Recognition Variance</h4>
                                        <p className="text-secondary mt-sm" style={{ margin: 0 }}>{result.error || result.message}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-md mt-xl justify-center">
                            <button className="btn btn-outline" onClick={resetScanner}>
                                Reset Identification
                            </button>
                            {result?.success && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => alert(`Redirecting to enrollment for ${result.pill_name}`)}
                                >
                                    Confirm & Register
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-xl p-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <h5 style={{ margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>Documentation Protocol:</h5>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <li>Ensure high-intensity ambient lighting.</li>
                        <li>Utilize a neutral, non-reflective backdrop.</li>
                        <li>Verify focus on pharmaceutical imprints.</li>
                        <li>Position the product centrally in frame.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
