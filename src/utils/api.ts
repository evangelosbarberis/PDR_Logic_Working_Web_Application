import { Estimate, UserAccount, ReportRecord } from '../types';

const TOKEN_KEY = 'pdr_logic_jwt_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function removeAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface AuthResponse {
  user: UserAccount;
  token: string;
  savedEstimate?: Estimate | null;
  message?: string;
}

// 1. Sign In
export async function loginUser(email: string, password?: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to sign in');
  }

  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

// 2. Register New User
export async function registerUser(payload: {
  name: string;
  email: string;
  password?: string;
  company?: string;
  role?: string;
  phone?: string;
  hourlyRIRate?: number;
}): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create account');
  }

  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

// 3. Verify Session / Get Me
export async function fetchCurrentUser(): Promise<{ user: UserAccount; savedEstimate?: Estimate | null; reportsCount?: number } | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      removeAuthToken();
      return null;
    }

    return await res.json();
  } catch (err) {
    console.warn('Session verification error:', err);
    return null;
  }
}

// 4. Save Active Estimate State to Cloud (Resume Where Left Off)
export async function syncActiveEstimate(estimate: Estimate): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const res = await fetch('/api/user/active-estimate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(estimate),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to sync estimate state to server:', err);
    return false;
  }
}

// 5. Fetch User's Active Estimate State from Cloud
export async function fetchActiveEstimate(): Promise<Estimate | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/user/active-estimate', {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.estimate || null;
  } catch {
    return null;
  }
}

// 6. Get Sent Reports History
export async function fetchReportsHistory(): Promise<ReportRecord[]> {
  try {
    const res = await fetch('/api/reports/history', {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.reports || [];
  } catch (err) {
    console.error('Error fetching reports history:', err);
    return [];
  }
}

// 7. Delete a Sent Report from History
export async function deleteReportRecordApi(reportId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/reports/${reportId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// 8. Send Report Email (With PDF attachment and automatic history saving)
export async function sendReportEmailApi(
  recipientEmail: string,
  estimate: Estimate,
  pdfBase64?: string,
  fileName?: string
): Promise<any> {
  const res = await fetch('/api/send-report-email', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      recipientEmail,
      estimate,
      pdfBase64,
      fileName,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to dispatch appraisal email');
  }
  return data;
}
