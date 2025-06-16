import React, { useState } from 'react';
import { LogIn, Server, User, Lock, AlertCircle, Loader2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { LoginCredentials } from '../types/mt5';

interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const COMMON_SERVERS = [
  'MetaQuotes-Demo',
  'MetaQuotes-Server',
  'ACGMarkets-Demo',
  'ACGMarkets-Main',
  'ACGMarkets-Server',
  'FXTM-Demo',
  'FXTM-Server',
  'XM-Demo',
  'XM-Server',
  'Exness-Demo',
  'Exness-Server',
  'IC Markets-Demo',
  'IC Markets-Server',
  'Pepperstone-Demo',
  'Pepperstone-Server',
  'Admiral Markets-Demo',
  'Admiral Markets-Server'
];

export function LoginForm({ onLogin, isLoading, error }: LoginFormProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
    server: ''
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<LoginCredentials>>({});
  const [showServerHelp, setShowServerHelp] = useState(false);
  const [showServerSuggestions, setShowServerSuggestions] = useState(false);

  const validateForm = (): boolean => {
    const errors: Partial<LoginCredentials> = {};
    
    if (!credentials.username.trim()) {
      errors.username = 'Account number is required';
    } else if (!/^\d+$/.test(credentials.username.trim())) {
      errors.username = 'Account number must be numeric';
    }
    
    if (!credentials.password.trim()) {
      errors.password = 'Password is required';
    }
    
    if (!credentials.server.trim()) {
      errors.server = 'Server is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    await onLogin(credentials);
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleServerSelect = (serverName: string) => {
    handleInputChange('server', serverName);
    setShowServerSuggestions(false);
  };

  const filteredServers = COMMON_SERVERS.filter(server =>
    server.toLowerCase().includes(credentials.server.toLowerCase())
  );

  const getErrorMessage = (error: string) => {
    if (error.includes('Server not found')) {
      return (
        <div>
          <p className="font-medium">Server not found</p>
          <p className="text-sm mt-1">
            The server name "{credentials.server}" was not recognized. 
            Please check the exact server name from your broker or try one of the common formats below.
          </p>
        </div>
      );
    }
    return error;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">MT5 Trading</h1>
            <p className="text-blue-200">Connect to your trading account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-red-200 text-sm">
                  {getErrorMessage(error)}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Account Number
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    fieldErrors.username ? 'border-red-500' : 'border-white/20'
                  }`}
                  placeholder="Enter your account number"
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    fieldErrors.password ? 'border-red-500' : 'border-white/20'
                  }`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-blue-200">
                  Server
                </label>
                <button
                  type="button"
                  onClick={() => setShowServerHelp(!showServerHelp)}
                  className="text-blue-300 hover:text-blue-200 text-xs flex items-center gap-1"
                >
                  <Info className="w-3 h-3" />
                  Help
                </button>
              </div>
              
              <div className="relative">
                <Server className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300 z-10" />
                <input
                  type="text"
                  value={credentials.server}
                  onChange={(e) => {
                    handleInputChange('server', e.target.value);
                    setShowServerSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowServerSuggestions(credentials.server.length > 0)}
                  className={`w-full pl-10 pr-10 py-3 bg-white/10 border rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    fieldErrors.server ? 'border-red-500' : 'border-white/20'
                  }`}
                  placeholder="e.g., MetaQuotes-Demo"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowServerSuggestions(!showServerSuggestions)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-200"
                >
                  {showServerSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {showServerSuggestions && filteredServers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                    {filteredServers.map((server, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleServerSelect(server)}
                        className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {server}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {fieldErrors.server && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.server}</p>
              )}

              {showServerHelp && (
                <div className="mt-3 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <div className="text-blue-200 text-sm space-y-2">
                    <p className="font-medium">Server Name Tips:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Check your MT5 platform for the exact server name</li>
                      <li>Common formats: "BrokerName-Demo" or "BrokerName-Server"</li>
                      <li>Server names are case-sensitive</li>
                      <li>Contact your broker if unsure about the server name</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Connect to MT5
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-blue-300 text-sm">
              Secure connection to MetaTrader 5 servers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}