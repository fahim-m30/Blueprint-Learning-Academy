const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cp_token');
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cp_token', token);
  }
};

export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cp_token');
    localStorage.removeItem('cp_user');
  }
};

export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('cp_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cp_user', JSON.stringify(user));
  }
};

/**
 * Fetch wrapper with automatic auth header and error handling
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: any }> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If token expired or blocked
      if (response.status === 401 && typeof window !== 'undefined') {
        // removeAuthToken();
      }
      return {
        success: false,
        message: result.message || `Request failed with status ${response.status}`,
        error: result,
      };
    }

    return {
      success: true,
      data: result,
      message: result.message,
    };
  } catch (err: any) {
    console.error('API Request failed:', err);
    return {
      success: false,
      message: err.message || 'Network connection failed. Please check if the server is running.',
    };
  }
}
