export interface Member {
  id: string;
  name: string;
  groupId: string;
  createdAt: string;
}

export interface ExpenseShare {
  id: string;
  expenseId: string;
  memberId: string;
  member: Member;
  amount: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  paidBy: Member;
  groupId: string;
  splitType: 'equal' | 'custom';
  createdAt: string;
  shares: ExpenseShare[];
}

export interface Settlement {
  id: string;
  amount: number;
  fromId: string;
  from: Member;
  toId: string;
  to: Member;
  groupId: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: Member[];
  expenses?: Expense[];
  settlements?: Settlement[];
  _count?: {
    expenses: number;
    settlements: number;
  };
}

export interface Balance {
  member: Member;
  balance: number;
}

export interface SuggestedSettlement {
  from: Member;
  to: Member;
  amount: number;
}
