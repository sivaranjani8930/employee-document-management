import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const VALID_USER = {
  role: 'HR',
  username: 'HR123',
  password: 'HR123',
  name: 'HR User'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (username, password, role) => {
    if (
      role === VALID_USER.role &&
      username === VALID_USER.username &&
      password === VALID_USER.password
    ) {
      const logged = { name: VALID_USER.name, role };
      setUser(logged);
      return { success: true, message: 'Welcome HR!', user: logged };
    }
    return { success: false, message: 'Invalid Credentials! Only HR Login Allowed' };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

