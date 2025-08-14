// API utility functions for interacting with MongoDB backend

export interface Client {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  notes?: string;
  totalAppointments: number;
  lastVisit?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Reservation {
  _id?: string;
  id?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  service: string;
  time: string;
  date: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export interface BusinessSettings {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  startHour: number;
  endHour: number;
  appointmentDuration: number;
  workingDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  services: Service[];
}

// Client API functions
export const clientApi = {
  async getAll(): Promise<Client[]> {
    const response = await fetch('/api/clients');
    if (!response.ok) throw new Error('Failed to fetch clients');
    return response.json();
  },

  async create(client: Omit<Client, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    if (!response.ok) throw new Error('Failed to create client');
    return response.json();
  },

  async update(id: string, client: Partial<Client>): Promise<void> {
    const response = await fetch('/api/clients', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...client }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update client');
    }
  },
};

// Reservation API functions
export const reservationApi = {
  async getAll(date?: string, clientId?: string): Promise<Reservation[]> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (clientId) params.append('clientId', clientId);

    const url = `/api/reservations?${params.toString()}`;
    console.log('[reservationApi.getAll] Request URL:', url || '/api/reservations');
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch reservations');
    const data: Reservation[] = await response.json();
    console.log('[reservationApi.getAll] Date:', date ?? '(none)', 'Count:', data.length);
    return data;
  },

  async create(reservation: Omit<Reservation, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<Reservation> {
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation),
    });
    if (!response.ok) throw new Error('Failed to create reservation');
    return response.json();
  },

  async update(id: string, reservation: Partial<Reservation>): Promise<void> {
    const response = await fetch('/api/reservations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...reservation }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update reservation');
    }
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/reservations?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete reservation');
    }
  },
};

// Settings API functions
export const settingsApi = {
  async get(): Promise<BusinessSettings> {
    const response = await fetch('/api/settings');
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },

  async update(settings: Partial<BusinessSettings>): Promise<void> {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update settings');
    }
  },
};