// ─── Enums ────────────────────────────────────────────────────────────────────
export type Role = 'OWNER' | 'RECIPIENT';

export type InvestmentType = 'MUDARABAH' | 'MUSHARAKAH' | 'QARD_HASSAN' | 'MURABAHAH';

export type InvestmentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DEFAULTED';

export type NotificationType =
  | 'REPAYMENT_DUE'
  | 'PAYMENT_OVERDUE'
  | 'NEW_INVESTMENT'
  | 'INVESTMENT_COMPLETED'
  | 'DOCUMENT_ADDED'
  | 'GENERAL';

// ─── Models ───────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  photoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Investment {
  id: string;
  title: string;
  recipientId: string;
  recipient: Pick<User, 'id' | 'name' | 'email' | 'phone'>;
  type: InvestmentType;
  status: InvestmentStatus;
  principalAmount: number;
  currencyCode: string;
  ownerProfitRatio: number;
  recipientProfitRatio: number;
  startDate: string;
  endDate?: string | null;
  purpose?: string | null;
  notes?: string | null;
  shariaAdvisorNotes?: string | null;
  totalRepaid: number;
  totalProfitReceived: number;
  isFullyRepaid: boolean;
  nextRepaymentDate?: string | null;
  createdAt: string;
  updatedAt: string;
  repayments?: Repayment[];
  documents?: Document[];
  _count?: { repayments: number; documents: number };
}

export interface Repayment {
  id: string;
  investmentId: string;
  amount: number;
  principalPortion: number;
  profitPortion: number;
  paymentDate: string;
  notes?: string | null;
  receiptUrl?: string | null;
  createdAt: string;
}

export interface Document {
  id: string;
  investmentId: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
  isAcknowledged: boolean;
  acknowledgedAt?: string | null;
  uploadedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  investmentId?: string | null;
  investment?: Pick<Investment, 'id' | 'title'> | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DashboardStats {
  statusCounts: Record<InvestmentStatus, number>;
  totalInvested: number;
  totalRepaid: number;
  totalProfitReceived: number;
  upcomingIn7Days: number;
  upcomingIn30Days: number;
  recentInvestments: Investment[];
}

// ─── Form Types ───────────────────────────────────────────────────────────────
export interface InvestmentFormData {
  title: string;
  recipientId: string;
  type: InvestmentType;
  principalAmount: number;
  ownerProfitRatio: number;
  recipientProfitRatio: number;
  startDate: string;
  endDate?: string;
  purpose?: string;
  notes?: string;
  shariaAdvisorNotes?: string;
  nextRepaymentDate?: string;
  lossHandlingAcknowledged?: boolean;
  lossHandlingNotes?: string;
}

export interface RepaymentFormData {
  amount: number;
  principalPortion: number;
  profitPortion: number;
  paymentDate: string;
  notes?: string;
}
