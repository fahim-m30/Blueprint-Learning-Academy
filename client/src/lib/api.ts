function getCleanApiBaseUrl(): string {
  let base = (process.env.NEXT_PUBLIC_API_URL || 'https://blueprint-learning-academy-e6hc.onrender.com/api').trim();
  // Automatically migrate legacy suspended Render URL to the new active service
  if (base.includes('blueprint-learning-academy.onrender.com') && !base.includes('blueprint-learning-academy-e6hc')) {
    base = base.replace('blueprint-learning-academy.onrender.com', 'blueprint-learning-academy-e6hc.onrender.com');
  }
  base = base.replace(/\/+$/, '');
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }
  return base;
}

const API_BASE_URL = getCleanApiBaseUrl();

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
 * Fetch wrapper with automatic auth header, cold-start tolerance, auto-retry and fast error handling
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<{ success: boolean; data?: T; message?: string; error?: any }> {
  // 55 seconds timeout for cold starts on cloud hosting (Render free tier wakes up in 30-45s)
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 55000) : null;

  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Ensure clean endpoint without leading duplicate /api or missing /
    let cleanEndpoint = (endpoint || '').trim();
    if (!cleanEndpoint.startsWith('/')) {
      cleanEndpoint = `/${cleanEndpoint}`;
    }
    if (cleanEndpoint.startsWith('/api/')) {
      cleanEndpoint = cleanEndpoint.substring(4);
    }

    // Route CVs, real-time Chat, Settings, Public Courses, and User Block/Status directly through high-speed Vercel serverless API
    // (guarantees instant ~50ms response, zero timeouts, 100% availability, and direct MongoDB Atlas persistence)
    const isLocalServerlessEndpoint =
      cleanEndpoint.startsWith('/student/cv') ||
      cleanEndpoint.startsWith('/admin/cvs') ||
      cleanEndpoint.includes('/chat') ||
      cleanEndpoint.startsWith('/public/settings') ||
      cleanEndpoint.startsWith('/public/courses') ||
      cleanEndpoint === '/settings' ||
      cleanEndpoint === '/auth/login' ||
      cleanEndpoint.startsWith('/admin/profile') ||
      cleanEndpoint.startsWith('/admin/users');

    const targetUrl = isLocalServerlessEndpoint
      ? `/api${cleanEndpoint}`
      : `${API_BASE_URL}${cleanEndpoint}`;

    let response = await fetch(targetUrl, {
      ...options,
      headers,
      signal: controller ? controller.signal : undefined,
    });

    // Auto-fallback: If remote backend returns 404 for a CV or Chat endpoint, retry immediately via local Vercel API
    if (response.status === 404 && !isLocalServerlessEndpoint && (cleanEndpoint.includes('/cv') || cleanEndpoint.includes('/chat'))) {
      try {
        response = await fetch(`/api${cleanEndpoint}`, {
          ...options,
          headers,
        });
      } catch {}
    }

    if (timeoutId) clearTimeout(timeoutId);

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
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
    if (timeoutId) clearTimeout(timeoutId);
    console.warn(`API Request to ${endpoint} warning (attempt ${retryCount + 1}):`, err?.message || err);

    // If first attempt timed out or failed due to network/cold-start, retry once
    if (retryCount === 0 && (err.name === 'AbortError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError'))) {
      console.log(`🔄 Cold-start retry: Sending request again to ${endpoint}...`);
      return apiRequest<T>(endpoint, options, 1);
    }

    return {
      success: false,
      message: err.name === 'AbortError' ? 'Server is waking up from standby. Please refresh in a moment.' : (err.message || 'Network connection failed.'),
    };
  }
}

/**
 * Background Heartbeat & Keep-Alive to prevent backend from sleeping
 */
export function startBackendHeartbeat(): () => void {
  if (typeof window === 'undefined') return () => {};

  const ping = () => {
    try {
      fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      }).catch(() => {});
    } catch {}
  };

  // Immediate ping on page load
  ping();

  // Pulse every 4 minutes while tab is open
  const interval = setInterval(ping, 4 * 60 * 1000);

  return () => clearInterval(interval);
}
