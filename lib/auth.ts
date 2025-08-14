// Authentication utilities for managing login state and local storage

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Local storage keys
const AUTH_TOKEN_KEY = 'barbershop_auth_token';
const USER_DATA_KEY = 'barbershop_user_data';
const AUTH_TIMESTAMP_KEY = 'barbershop_auth_timestamp';

// Session timeout (24 hours in milliseconds)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

// Mock admin credentials (in a real app, this would be in a secure database)
const ADMIN_CREDENTIALS = {
  email: 'admin@admin.com',
  password: 'admin111',
  name: 'Administrator',
  role: 'admin' as const
};

// Generate a simple token (in production, use JWT)
const generateToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Save authentication data to local storage
export const saveAuthToStorage = (user: User, token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
  }
};

// Get authentication data from local storage
export const getAuthFromStorage = (): { user: User | null; token: string | null } => {
  if (typeof window === 'undefined') {
    return { user: null, token: null };
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const userData = localStorage.getItem(USER_DATA_KEY);
  const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);

  if (!token || !userData || !timestamp) {
    return { user: null, token: null };
  }

  // Check if session has expired
  const loginTime = parseInt(timestamp);
  const currentTime = Date.now();
  
  if (currentTime - loginTime > SESSION_TIMEOUT) {
    clearAuthFromStorage();
    return { user: null, token: null };
  }

  try {
    const user = JSON.parse(userData) as User;
    return { user, token };
  } catch (error) {
    console.error('Error parsing user data from storage:', error);
    return { user: null, token: null };
  }
};

// Clear authentication data from local storage
export const clearAuthFromStorage = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(AUTH_TIMESTAMP_KEY);
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const { user, token } = getAuthFromStorage();
  return !!(user && token);
};

// Login function
export const login = async (credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check credentials
  if (credentials.email === ADMIN_CREDENTIALS.email && credentials.password === ADMIN_CREDENTIALS.password) {
    const user: User = {
      id: '1',
      email: ADMIN_CREDENTIALS.email,
      name: ADMIN_CREDENTIALS.name,
      role: ADMIN_CREDENTIALS.role
    };

    const token = generateToken();
    saveAuthToStorage(user, token);

    return { success: true, user };
  }

  return { success: false, error: 'Invalid credentials. Please try again.' };
};

// Logout function
export const logout = (): void => {
  clearAuthFromStorage();
};

// Get current user
export const getCurrentUser = (): User | null => {
  const { user } = getAuthFromStorage();
  return user;
};

// Validate token (in a real app, this would validate with the server)
export const validateToken = (): boolean => {
  const { token } = getAuthFromStorage();
  return !!token;
};
