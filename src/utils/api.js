const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const getHeaders = () => {
    const token = localStorage.getItem('google_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    // Auth
    login: async (idToken) => {
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            }
        });
        return response.json();
    },

    // Medications
    getMedications: async () => {
        const response = await fetch(`${API_BASE_URL}/medications`, {
            headers: getHeaders()
        });
        return response.json();
    },

    addMedication: async (medication) => {
        const response = await fetch(`${API_BASE_URL}/medications`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(medication),
        });
        return response.json();
    },

    updateMedication: async (id, medication) => {
        const response = await fetch(`${API_BASE_URL}/medications/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(medication),
        });
        return response.json();
    },

    deleteMedication: async (id) => {
        const response = await fetch(`${API_BASE_URL}/medications/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return response.json();
    },

    // Logs
    getLogs: async (medicationId, startDate, endDate) => {
        const params = new URLSearchParams();
        if (medicationId) params.append('medication_id', medicationId);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await fetch(`${API_BASE_URL}/logs?${params}`, {
            headers: getHeaders()
        });
        return response.json();
    },

    logMedication: async (log) => {
        const response = await fetch(`${API_BASE_URL}/logs`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(log),
        });
        return response.json();
    },

    updateLog: async (id, status, takenTime) => {
        const response = await fetch(`${API_BASE_URL}/logs/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status, taken_time: takenTime }),
        });
        return response.json();
    },

    // ML Features
    recognizePill: async (imageData) => {
        const response = await fetch(`${API_BASE_URL}/ml/recognize-pill`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ image: imageData }),
        });
        return response.json();
    },

    predictAdherence: async (medicationId) => {
        const response = await fetch(`${API_BASE_URL}/ml/predict-adherence`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ medication_id: medicationId }),
        });
        return response.json();
    },

    checkInteractions: async (medications) => {
        const response = await fetch(`${API_BASE_URL}/ml/check-interactions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ medications }),
        });
        return response.json();
    },

    // Analytics
    getAdherenceStats: async (medicationId, days = 30) => {
        const params = new URLSearchParams();
        if (medicationId) params.append('medication_id', medicationId);
        params.append('days', days);

        const response = await fetch(`${API_BASE_URL}/analytics/adherence?${params}`, {
            headers: getHeaders()
        });
        return response.json();
    },

    getDashboardData: async () => {
        const response = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
            headers: getHeaders()
        });
        return response.json();
    },

    // Models Info
    getModelsInfo: async () => {
        const response = await fetch(`${API_BASE_URL}/models/info`, {
            headers: getHeaders()
        });
        return response.json();
    },
};

export default api;
