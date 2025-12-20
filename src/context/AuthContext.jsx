import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('google_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check if token is expired
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser({
                        id: decoded.sub,
                        email: decoded.email,
                        name: decoded.name,
                        picture: decoded.picture
                    });
                }
            } catch (error) {
                console.error('Invalid token:', error);
                logout();
            }
        }
        setLoading(false);
    }, [token]);

    const login = (idToken) => {
        localStorage.setItem('google_token', idToken);
        setToken(idToken);
    };

    const logout = () => {
        localStorage.removeItem('google_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
