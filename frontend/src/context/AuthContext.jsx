import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(sessionStorage.getItem('access_token'));
  const [user, setUser] = useState(JSON.parse(sessionStorage.getItem('user_data')));

  const handleAuth = async (endpoint, data) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, data);
      setToken(res.data.access_token);
      setUser(res.data.user);
      sessionStorage.setItem('access_token', res.data.access_token);
      sessionStorage.setItem('user_data', JSON.stringify(res.data.user));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || `${endpoint} failed` };
    }
  };

  const login = (email, password) => handleAuth('login', { email, password });
  const register = (name, email, password) => handleAuth('register', { name, email, password });

  const logout = () => {
    setToken(null); setUser(null);
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user_data');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
