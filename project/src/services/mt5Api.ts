import { LoginCredentials, AccountInfo, LoginResponse, ApiError } from '../types/mt5';

const MT5_API_BASE = '/api';

// Validate MT5 token format and content
function validateToken(token: string): boolean {
  if (!token || token.length < 10) return false;
  
  const errorKeywords = ['error', 'invalid', 'failed', 'denied', 'unauthorized'];
  const lowerToken = token.toLowerCase();
  
  return !errorKeywords.some(keyword => lowerToken.includes(keyword));
}

// Validate login credentials
function validateCredentials(credentials: LoginCredentials): string | null {
  const { username, password, server } = credentials;
  
  if (!username?.trim()) return 'Username is required';
  if (!password?.trim()) return 'Password is required';
  if (!server?.trim()) return 'Server is required';
  
  // Validate username is numeric (MT5 account numbers are typically numeric)
  if (!/^\d+$/.test(username.trim())) {
    return 'Username must be a valid account number (numeric)';
  }
  
  return null;
}

// Handle API response errors
async function handleApiError(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const errorData = await response.json();
      return errorData.message || errorData.error || `API Error: ${response.status}`;
    } else {
      const errorText = await response.text();
      return errorText || `HTTP Error: ${response.status}`;
    }
  } catch {
    return `Network Error: ${response.status} ${response.statusText}`;
  }
}

export async function loginToMT5(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    // Validate input credentials
    const validationError = validateCredentials(credentials);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Construct URL with query parameters
    const params = new URLSearchParams({
      user: credentials.username.trim(),
      password: credentials.password,
      server: credentials.server.trim()
    });

    const url = `${MT5_API_BASE}/ConnectEx?${params.toString()}`;

    // Make GET request to MT5 API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain, application/json',
      },
    });

    // Handle successful authentication (HTTP 200)
    if (response.ok && response.status === 200) {
      const token = await response.text();
      
      if (validateToken(token)) {
        return { success: true, token: token.trim() };
      } else {
        return { success: false, error: 'Invalid authentication token received' };
      }
    }

    // Handle MT5 API errors (often HTTP 201 or other non-200 codes)
    const errorMessage = await handleApiError(response);
    return { success: false, error: errorMessage };

  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError) {
      return { success: false, error: 'Network connection failed. Please check your internet connection.' };
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Request timeout. Please try again.' };
    }

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
}

export async function getAccountInfo(token: string): Promise<AccountInfo> {
  const defaultAccountInfo: AccountInfo = {
    balance: 0,
    equity: 0,
    margin: 0,
    freeMargin: 0,
    marginLevel: 0,
    currency: 'USD',
    accountNumber: 'N/A',
    accountName: 'N/A',
    serverName: 'N/A',
    leverage: 0,
    profit: 0,
  };

  if (!token?.trim()) {
    console.error('No authentication token provided');
    return defaultAccountInfo;
  }

  try {
    // Prepare API calls
    const summaryParams = new URLSearchParams({ id: token });
    const detailsParams = new URLSearchParams({ id: token });

    const summaryUrl = `${MT5_API_BASE}/AccountSummary?${summaryParams.toString()}`;
    const detailsUrl = `${MT5_API_BASE}/AccountDetails?${detailsParams.toString()}`;

    // Make concurrent API calls
    const [summaryResponse, detailsResponse] = await Promise.all([
      fetch(summaryUrl, { method: 'GET' }),
      fetch(detailsUrl, { method: 'GET' })
    ]);

    let summaryData = {};
    let detailsData = {};

    // Process account summary
    if (summaryResponse.ok) {
      try {
        summaryData = await summaryResponse.json();
      } catch (error) {
        console.error('Failed to parse account summary:', error);
      }
    } else {
      console.error('Account summary request failed:', summaryResponse.status);
    }

    // Process account details
    if (detailsResponse.ok) {
      try {
        detailsData = await detailsResponse.json();
      } catch (error) {
        console.error('Failed to parse account details:', error);
      }
    } else {
      console.error('Account details request failed:', detailsResponse.status);
    }

    // Combine and return account information
    return {
      balance: (summaryData as any)?.balance ?? defaultAccountInfo.balance,
      equity: (summaryData as any)?.equity ?? defaultAccountInfo.equity,
      margin: (summaryData as any)?.margin ?? defaultAccountInfo.margin,
      freeMargin: (summaryData as any)?.freeMargin ?? defaultAccountInfo.freeMargin,
      marginLevel: (summaryData as any)?.marginLevel ?? defaultAccountInfo.marginLevel,
      currency: (summaryData as any)?.currency ?? defaultAccountInfo.currency,
      profit: (summaryData as any)?.profit ?? defaultAccountInfo.profit,
      accountNumber: (detailsData as any)?.accountNumber ?? defaultAccountInfo.accountNumber,
      accountName: (detailsData as any)?.accountName ?? defaultAccountInfo.accountName,
      serverName: (detailsData as any)?.serverName ?? defaultAccountInfo.serverName,
      leverage: (detailsData as any)?.leverage ?? defaultAccountInfo.leverage,
    };

  } catch (error) {
    console.error('Error fetching account information:', error);
    return defaultAccountInfo;
  }
}