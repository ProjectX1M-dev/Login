import React, { useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { LoginCredentials } from './types/mt5';
import { loginToMT5 } from './services/mt5Api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginToMT5(credentials);
      
      if (response.success && response.token) {
        setAuthToken(response.token);
        setIsAuthenticated(true);
      } else {
        setError(response.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthToken(null);
    setError(null);
  };

  if (isAuthenticated && authToken) {
    return <Dashboard token={authToken} onLogout={handleLogout} />;
  }

  return (
    <LoginForm 
      onLogin={handleLogin} 
      isLoading={isLoading} 
      error={error} 
    />
  );
}

export default App;