import type { Group, Member, Expense, Settlement, Balance, SuggestedSettlement } from '../types';

const API_BASE = '/api';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

// Groups
export const groupsApi = {
  getAll: () => fetchApi<Group[]>('/groups'),
  
  getById: (id: string) => fetchApi<Group>(`/groups/${id}`),
  
  create: (data: { name: string; description?: string; members?: { name: string }[] }) =>
    fetchApi<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: { name?: string; description?: string }) =>
    fetchApi<Group>(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchApi<{ message: string }>(`/groups/${id}`, {
      method: 'DELETE',
    }),
  
  getBalances: (groupId: string) =>
    fetchApi<Balance[]>(`/groups/${groupId}/balances`),
};

// Members
export const membersApi = {
  getAll: (groupId: string) => fetchApi<Member[]>(`/groups/${groupId}/members`),
  
  add: (groupId: string, name: string) =>
    fetchApi<Member>(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  
  update: (groupId: string, memberId: string, name: string) =>
    fetchApi<Member>(`/groups/${groupId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),
  
  remove: (groupId: string, memberId: string) =>
    fetchApi<{ message: string }>(`/groups/${groupId}/members/${memberId}`, {
      method: 'DELETE',
    }),
};

// Expenses
export const expensesApi = {
  getAll: (groupId: string) => fetchApi<Expense[]>(`/groups/${groupId}/expenses`),
  
  add: (groupId: string, data: {
    description: string;
    amount: number;
    paidById: string;
    splitType?: 'equal' | 'custom';
    shares?: { memberId: string; amount: number }[];
  }) =>
    fetchApi<Expense>(`/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (groupId: string, expenseId: string, data: {
    description: string;
    amount: number;
    paidById: string;
    splitType?: 'equal' | 'custom';
    shares?: { memberId: string; amount: number }[];
  }) =>
    fetchApi<Expense>(`/groups/${groupId}/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (groupId: string, expenseId: string) =>
    fetchApi<{ message: string }>(`/groups/${groupId}/expenses/${expenseId}`, {
      method: 'DELETE',
    }),
};

// Settlements
export const settlementsApi = {
  getAll: (groupId: string) => fetchApi<Settlement[]>(`/groups/${groupId}/settlements`),
  
  add: (groupId: string, data: { fromId: string; toId: string; amount: number }) =>
    fetchApi<Settlement>(`/groups/${groupId}/settlements`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  delete: (groupId: string, settlementId: string) =>
    fetchApi<{ message: string }>(`/groups/${groupId}/settlements/${settlementId}`, {
      method: 'DELETE',
    }),
  
  getSuggested: (groupId: string) =>
    fetchApi<SuggestedSettlement[]>(`/groups/${groupId}/settlements/suggested`),
};
