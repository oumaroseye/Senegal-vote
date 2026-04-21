import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [electeur, setElecteur] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier le token au chargement
    const token = localStorage.getItem('token');
    const savedElecteur = localStorage.getItem('electeur');
    const savedAdmin = localStorage.getItem('admin');

    if (token && savedElecteur) {
      setElecteur(JSON.parse(savedElecteur));
      setIsAuthenticated(true);
    }

    if (token && savedAdmin) {
      setAdmin(JSON.parse(savedAdmin));
      setIsAdmin(true);
    }

    setLoading(false);
  }, []);

  const loginElecteur = (token, electeurData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('electeur', JSON.stringify(electeurData));
    setElecteur(electeurData);
    setIsAuthenticated(true);
  };

  const loginAdmin = (token, adminData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('admin', JSON.stringify(adminData));
    setAdmin(adminData);
    setIsAdmin(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tempToken');
    localStorage.removeItem('electeur');
    localStorage.removeItem('admin');
    setElecteur(null);
    setAdmin(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      electeur, admin, isAuthenticated, isAdmin, loading,
      loginElecteur, loginAdmin, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
