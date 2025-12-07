/**
 * API Service Layer
 * Handles all backend API communications
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: { field: string; message: string }[];
}

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('inheritx_token', token);
    } else {
      localStorage.removeItem('inheritx_token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('inheritx_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'An error occurred',
          details: data.details,
        };
      }

      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private async requestFormData<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: HeadersInit = {};
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'An error occurred',
          details: data.details,
        };
      }

      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // ============================================
  // AUTH
  // ============================================

  async getNonce(walletAddress: string) {
    return this.request<{ nonce: string }>(`/auth/nonce?walletAddress=${walletAddress}`);
  }

  async login(walletAddress: string, signature: string, message: string) {
    return this.request<{ token: string; user: User; isNewUser: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature, message }),
    });
  }

  async adminLogin(email: string, password: string) {
    return this.request<{ token: string; user: User }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<User>('/auth/me');
  }

  async updateProfile(data: { email?: string; name?: string }) {
    return this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // KYC
  // ============================================

  async getKYCStatus() {
    return this.request<KYCStatus>('/kyc/status');
  }

  async submitKYC(formData: FormData) {
    return this.requestFormData<{ message: string; status: string; kycDataHash: string }>(
      '/kyc/submit',
      formData
    );
  }

  async getKYCHash() {
    return this.request<{ kycDataHash: string; status: string }>('/kyc/hash');
  }

  // ============================================
  // PLANS
  // ============================================

  async getPlans() {
    return this.request<Plan[]>('/plans');
  }

  async getPlan(id: string) {
    return this.request<Plan>(`/plans/${id}`);
  }

  async createPlan(planData: CreatePlanData) {
    return this.request<{ plan: Plan; contractData: ContractData }>('/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  async updatePlanContract(id: string, data: { globalPlanId: number; userPlanId: number; txHash: string }) {
    return this.request<Plan>(`/plans/${id}/contract`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePlanStatus(id: string, status: 'ACTIVE' | 'PAUSED' | 'CANCELLED') {
    return this.request<Plan>(`/plans/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getClaimCode(planId: string) {
    return this.request<{ claimCode: string }>(`/plans/${planId}/claim-code`);
  }

  // ============================================
  // CLAIMS
  // ============================================

  async getPlanForClaim(globalPlanId: number) {
    return this.request<ClaimPlanInfo>(`/claim/plan/${globalPlanId}`);
  }

  async verifyClaim(data: VerifyClaimData) {
    return this.request<VerifyClaimResponse>('/claim/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeClaim(data: CompleteClaimData) {
    return this.request<{ success: boolean; message: string; allBeneficiariesClaimed: boolean }>(
      '/claim/complete',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getMyClaims(email: string) {
    return this.request<ClaimInfo[]>(`/claim/my-claims?email=${encodeURIComponent(email)}`);
  }

  // ============================================
  // ADMIN
  // ============================================

  async getAdminStats() {
    return this.request<AdminStats>('/admin/stats');
  }

  async getAdminKYCList(params: { status?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    return this.request<{ data: KYCApplication[]; pagination: Pagination }>(`/admin/kyc?${query}`);
  }

  async getAdminKYC(id: string) {
    return this.request<KYCApplication>(`/admin/kyc/${id}`);
  }

  async approveKYC(id: string) {
    return this.request<{ message: string; kyc: KYCApplication }>(`/admin/kyc/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectKYC(id: string, reason?: string) {
    return this.request<{ message: string; kyc: KYCApplication }>(`/admin/kyc/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getAdminUsers(params: { role?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    return this.request<{ data: User[]; pagination: Pagination }>(`/admin/users?${query}`);
  }

  async updateUserRole(id: string, role: 'USER' | 'ADMIN' | 'SUPER_ADMIN') {
    return this.request<User>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async getAdminPlans(params: { status?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    return this.request<{ data: Plan[]; pagination: Pagination }>(`/admin/plans?${query}`);
  }

  async getAdminActivity(params: { type?: string; userId?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.userId) query.set('userId', params.userId);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    return this.request<{ data: Activity[]; pagination: Pagination }>(`/admin/activity?${query}`);
  }
}

export const api = new ApiService();

// ============================================
// TYPES
// ============================================

export interface User {
  id: string;
  walletAddress: string;
  email: string | null;
  name: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  kycStatus: string;
  planCount: number;
  createdAt: string;
}

export interface KYCStatus {
  status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  fullName: string | null;
  email: string | null;
  idType: string | null;
}

export interface KYCApplication {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  fullName: string;
  email: string;
  dateOfBirth: string;
  nationality: string;
  idType: string;
  idNumber: string;
  idDocumentUrl: string;
  idExpiryDate: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  kycDataHash: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    walletAddress: string;
    createdAt: string;
  };
}

export interface Beneficiary {
  id: string;
  name: string;
  email: string;
  relationship: string;
  allocatedPercentage: number;
  allocatedAmount: string;
  hasClaimed: boolean;
  claimedAt: string | null;
  beneficiaryIndex: number;
}

export interface Plan {
  id: string;
  globalPlanId: number | null;
  userPlanId: number | null;
  planName: string;
  planDescription: string;
  assetType: string;
  assetAmount: string;
  assetAmountWei: string; // Amount in wei/smallest unit
  distributionMethod: string;
  transferDate: string;
  periodicPercentage: number | null; // For non-lump sum distributions
  status: string;
  txHash: string | null;
  createdAt: string;
  beneficiaries: Beneficiary[];
  distributions?: Distribution[];
  claimCode?: string; // Only returned on plan creation
}

export interface Distribution {
  periodNumber: number;
  amount: string;
  scheduledDate: string;
  status: string;
}

export interface CreatePlanData {
  planName: string;
  planDescription: string;
  assetType: 'ERC20_TOKEN1' | 'ERC20_TOKEN2' | 'ERC20_TOKEN3';
  assetAmount: string;
  assetAmountWei: string;
  distributionMethod: 'LUMP_SUM' | 'QUARTERLY' | 'YEARLY' | 'MONTHLY';
  transferDate: string;
  periodicPercentage?: number;
  beneficiaries: {
    name: string;
    email: string;
    relationship: string;
    allocatedPercentage: number;
  }[];
  claimCode?: string;
}

export interface ContractData {
  planNameHash: string;
  planDescriptionHash: string;
  claimCodeHash: string;
  beneficiaries: {
    nameHash: string;
    emailHash: string;
    relationshipHash: string;
    allocatedPercentage: number;
  }[];
}

export interface ClaimPlanInfo {
  id: string;
  planName: string;
  planDescription: string;
  assetType: string;
  assetAmount: string;
  distributionMethod: string;
  transferDate: string;
  status: string;
  isClaimable: boolean;
  timeUntilClaimable: number;
  beneficiaries: {
    beneficiaryIndex: number;
    allocatedPercentage: number;
    allocatedAmount: string;
    hasClaimed: boolean;
  }[];
}

export interface VerifyClaimData {
  planId: string | number;
  claimCode: string;
  beneficiaryName: string;
  beneficiaryEmail: string;
  beneficiaryRelationship: string;
}

export interface VerifyClaimResponse {
  verified: boolean;
  planId: string;
  globalPlanId: number;
  beneficiaryIndex: number;
  allocatedAmount: string;
  assetType: string;
  contractCallData: {
    planId: number;
    beneficiaryIndex: number;
  };
}

export interface CompleteClaimData {
  planId: string;
  beneficiaryIndex: number;
  claimerAddress: string;
  txHash: string;
  claimedAmount: string;
}

export interface ClaimInfo {
  beneficiaryId: string;
  beneficiaryIndex: number;
  name: string;
  relationship: string;
  allocatedPercentage: number;
  allocatedAmount: string;
  hasClaimed: boolean;
  claimedAt: string | null;
  plan: Plan;
  isClaimable: boolean;
}

export interface AdminStats {
  users: { total: number };
  kyc: { pending: number; approved: number; rejected: number; total: number };
  plans: { total: number; active: number };
  claims: { total: number };
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  userId: string;
  planId: string | null;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  user?: { walletAddress: string; name: string | null };
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default api;
