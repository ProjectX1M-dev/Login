import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  LogOut, 
  RefreshCw, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  User,
  Server,
  Zap,
  AlertTriangle,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react';
import { AccountInfo } from '../types/mt5';
import { getAccountInfo } from '../services/mt5Api';

interface DashboardProps {
  token: string;
  onLogout: () => void;
}

export function Dashboard({ token, onLogout }: DashboardProps) {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isConnected, setIsConnected] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  const [isRealTimeActive, setIsRealTimeActive] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchAccountInfo = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    
    try {
      const info = await getAccountInfo(token);
      
      if (mountedRef.current) {
        setAccountInfo(info);
        setLastUpdated(new Date());
        setIsConnected(true);
        setUpdateCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to fetch account info:', error);
      if (mountedRef.current) {
        setIsConnected(false);
      }
    } finally {
      if (mountedRef.current && showLoading) {
        setIsLoading(false);
      }
    }
  }, [token]);

  const startRealTimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (mountedRef.current && isRealTimeActive) {
        fetchAccountInfo(false);
      }
    }, 1000); // Update every second
  }, [fetchAccountInfo, isRealTimeActive]);

  const stopRealTimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const toggleRealTime = () => {
    setIsRealTimeActive(prev => {
      const newState = !prev;
      if (newState) {
        startRealTimeUpdates();
      } else {
        stopRealTimeUpdates();
      }
      return newState;
    });
  };

  useEffect(() => {
    mountedRef.current = true;
    
    // Initial fetch
    fetchAccountInfo(true);
    
    // Start real-time updates
    if (isRealTimeActive) {
      startRealTimeUpdates();
    }

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      stopRealTimeUpdates();
    };
  }, [fetchAccountInfo, startRealTimeUpdates, stopRealTimeUpdates, isRealTimeActive]);

  // Handle visibility change to pause/resume updates when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopRealTimeUpdates();
      } else if (isRealTimeActive) {
        startRealTimeUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [startRealTimeUpdates, stopRealTimeUpdates, isRealTimeActive]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-400';
    if (profit < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getProfitIcon = (profit: number) => {
    if (profit > 0) return <TrendingUp className="w-5 h-5" />;
    if (profit < 0) return <TrendingDown className="w-5 h-5" />;
    return <BarChart3 className="w-5 h-5" />;
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (!accountInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Loading account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">MT5 Trading Dashboard</h1>
              <div className="flex items-center gap-2 ml-4">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-xs font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'LIVE' : 'DISCONNECTED'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-blue-200 text-sm">
                <Clock className="w-4 h-4" />
                <span>Updates: {updateCount}</span>
              </div>
              
              <button
                onClick={toggleRealTime}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isRealTimeActive 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isRealTimeActive ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                {isRealTimeActive ? 'Real-time ON' : 'Real-time OFF'}
              </button>
              
              <button
                onClick={() => fetchAccountInfo(true)}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Real-time Status Bar */}
        <div className="mb-6 p-4 bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isRealTimeActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-white font-medium">
                  {isRealTimeActive ? 'Real-time Updates Active' : 'Real-time Updates Paused'}
                </span>
              </div>
              <div className="text-blue-200 text-sm">
                Last updated: {getTimeAgo(lastUpdated)}
              </div>
            </div>
            <div className="text-blue-200 text-sm">
              Next update in: {isRealTimeActive ? '1s' : 'Paused'}
            </div>
          </div>
        </div>

        {/* Account Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 transform transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-green-400 text-sm font-medium">Balance</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1 transition-all duration-300">
              {formatCurrency(accountInfo.balance, accountInfo.currency)}
            </div>
            <p className="text-blue-200 text-sm">Account Balance</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 transform transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-blue-400 text-sm font-medium">Equity</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1 transition-all duration-300">
              {formatCurrency(accountInfo.equity, accountInfo.currency)}
            </div>
            <p className="text-blue-200 text-sm">Current Equity</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 transform transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${accountInfo.profit >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {getProfitIcon(accountInfo.profit)}
              </div>
              <span className={`text-sm font-medium ${getProfitColor(accountInfo.profit)}`}>
                P&L
              </span>
            </div>
            <div className={`text-2xl font-bold mb-1 transition-all duration-300 ${getProfitColor(accountInfo.profit)}`}>
              {formatCurrency(accountInfo.profit, accountInfo.currency)}
            </div>
            <p className="text-blue-200 text-sm">Profit & Loss</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 transform transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <span className="text-yellow-400 text-sm font-medium">Margin</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1 transition-all duration-300">
              {formatPercentage(accountInfo.marginLevel)}
            </div>
            <p className="text-blue-200 text-sm">Margin Level</p>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Details */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Details
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-blue-200">Account Number</span>
                <span className="text-white font-medium">{accountInfo.accountNumber}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-blue-200">Account Name</span>
                <span className="text-white font-medium">{accountInfo.accountName}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-blue-200">Server</span>
                <span className="text-white font-medium flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  {accountInfo.serverName}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-blue-200">Leverage</span>
                <span className="text-white font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  1:{accountInfo.leverage}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-blue-200">Currency</span>
                <span className="text-white font-medium">{accountInfo.currency}</span>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Financial Summary
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-blue-200">Free Margin</span>
                <span className="text-white font-medium transition-all duration-300">
                  {formatCurrency(accountInfo.freeMargin, accountInfo.currency)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-blue-200">Used Margin</span>
                <span className="text-white font-medium transition-all duration-300">
                  {formatCurrency(accountInfo.margin, accountInfo.currency)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-blue-200">Margin Level</span>
                <span className={`font-medium transition-all duration-300 ${
                  accountInfo.marginLevel > 100 ? 'text-green-400' : 
                  accountInfo.marginLevel > 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {formatPercentage(accountInfo.marginLevel)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-blue-200">Connection Status</span>
                <span className={`font-medium flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-blue-200">Last Updated</span>
                <span className="text-white font-medium text-sm">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}