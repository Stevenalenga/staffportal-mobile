import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "./config";

const portalApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/mobile`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach token on every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("auth_token");
      await SecureStore.deleteItemAsync("auth_user");
    }
    return Promise.reject(error);
  }
);

export type ApiUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  employeeId: string | null;
  employmentStatus?: string;
  department: { id: string; name: string; code?: string } | null;
  position: { title: string } | null;
};

export type StaffRoleDetail = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  employmentStatus: string;
  employeeId: string | null;
  departmentId: string | null;
  department: { id: string; name: string; code: string } | null;
};

export type Department = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  head: { id: string; name: string | null; email: string } | null;
  staff: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  }[];
  _count: { staff: number; positions: number };
};

export type ExpenseListItem = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
  expenseDate: string;
  claimType?: string;
  projectName?: string | null;
  user: { name: string | null };
  category: { name: string };
  _count?: { attachments: number };
};

export type ExpenseLineItem = {
  id?: string;
  specification: string;
  quantity: number;
  unitCost: number;
  cost?: number;
  itemDate?: string | null;
  sortOrder?: number;
};

export type ExpenseAttachment = {
  id: string;
  kind: string;
  fileName: string;
  mimeType?: string | null;
};

export type ExpenseDetail = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
  expenseDate: string;
  claimType?: string;
  projectName?: string | null;
  purpose?: string | null;
  notes?: string | null;
  rejectionReason?: string | null;
  user: { id: string; name: string | null; email?: string };
  category: { name: string };
  lineItems?: ExpenseLineItem[];
  attachments?: ExpenseAttachment[];
};

export type ExpenseWorkflowAction =
  | "finance_approve"
  | "ceo_approve"
  | "reject"
  | "disburse";

export type PendingUpload = {
  uri: string;
  name: string;
  mimeType: string;
  kind: "IRF_FORM" | "RECEIPT" | "SUPPORTING";
};

export type CreateExpensePayload = {
  claimType: "EXPENSE" | "REFUND";
  projectName: string;
  purpose: string;
  expenseDate: string;
  notes?: string;
  lineItems: {
    specification: string;
    quantity: number;
    unitCost: number;
    itemDate?: string;
  }[];
};

export type ProjectListItem = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  funder: string | null;
  updatedAt: string;
  myRole: string | null;
  unreadUpdates: number;
  _count: { members: number; updates: number };
  creator?: { name: string | null; email: string };
};

export type ProjectMember = {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
};

export type ProjectComment = {
  id: string;
  body: string;
  kind: string;
  createdAt: string;
  author: { id: string; name: string | null; email: string };
};

export type ProjectUpdate = {
  id: string;
  title: string | null;
  body: string;
  createdAt: string;
  author: { id: string; name: string | null; email: string };
  attachments: unknown[];
  comments: ProjectComment[];
};

export type ProjectDetail = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  funder: string | null;
  objectives: string | null;
  isAdmin: boolean;
  members: ProjectMember[];
  updates: ProjectUpdate[];
};

export type CreateProjectPayload = {
  name: string;
  company: string;
  description?: string;
  status: "PLANNING" | "ACTIVE" | "ON_HOLD";
  startDate?: string;
  endDate?: string;
  funder?: string;
  objectives?: string;
};

export type PersonalTask = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type CreateTaskPayload = {
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  startDate?: string;
  dueDate?: string;
};

export type UpdateTaskPayload = Partial<CreateTaskPayload> & {
  status?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED";
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type DashboardStats = {
  totalStaff: number;
  activeStaff: number;
  totalAssets: number;
  assignedAssets: number;
  pendingExpenses: number;
  activeProjects: number;
  pendingLeave: number;
  openTasks: number;
};

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: ApiUser }>("/auth/login", {
      email,
      password,
    });
    return res.data;
  },
  me: async () => {
    const res = await api.get<ApiUser>("/auth/me");
    return res.data;
  },
  registerDomains: async () => {
    const res = await api.get<{ domains: string[] }>("/auth/register-domains");
    return res.data.domains;
  },
  register: async (payload: RegisterPayload) => {
    const res = await portalApi.post<{ message: string }>(
      "/api/auth/register",
      payload
    );
    return res.data;
  },
};

export const dashboardApi = {
  stats: async () => {
    const res = await api.get<DashboardStats>("/dashboard");
    return res.data;
  },
};

export const staffApi = {
  list: async () => {
    const res = await api.get<ApiUser[]>("/staff");
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get<StaffRoleDetail>(`/staff/${id}`);
    return res.data;
  },
  updateRole: async (
    id: string,
    payload: {
      role: string;
      departmentId?: string;
      employmentStatus?: string;
    }
  ) => {
    const res = await api.patch<StaffRoleDetail>(`/staff/${id}`, payload);
    return res.data;
  },
};

export const departmentsApi = {
  list: async () => {
    const res = await api.get<Department[]>("/departments");
    return res.data;
  },
};

export const expensesApi = {
  list: async () => {
    const res = await api.get<ExpenseListItem[]>("/expenses");
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get<ExpenseDetail>(`/expenses/${id}`);
    return res.data;
  },
  create: async (payload: CreateExpensePayload) => {
    const res = await api.post<ExpenseDetail>("/expenses", payload);
    return res.data;
  },
  submit: async (id: string) => {
    const res = await api.post<ExpenseDetail>(`/expenses/${id}/submit`);
    return res.data;
  },
  workflow: async (
    id: string,
    action: ExpenseWorkflowAction,
    reason?: string
  ) => {
    const res = await api.patch<ExpenseDetail>(`/expenses/${id}/workflow`, {
      action,
      reason,
    });
    return res.data;
  },
  uploadAttachments: async (expenseId: string, files: PendingUpload[]) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append(
        "files",
        {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        } as unknown as Blob
      );
      formData.append("kinds", file.kind);
    }
    const res = await api.post<ExpenseAttachment[]>(
      `/expenses/${expenseId}/attachments`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      }
    );
    return res.data;
  },
};

export const projectsApi = {
  list: async () => {
    const res = await api.get<ProjectListItem[]>("/projects");
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get<ProjectDetail>(`/projects/${id}`);
    return res.data;
  },
  create: async (payload: CreateProjectPayload) => {
    const res = await api.post<{ id: string }>("/projects", payload);
    return res.data;
  },
  nextCode: async (company: string) => {
    const res = await api.get<{ code: string }>(
      `/projects/next-code?company=${encodeURIComponent(company)}`
    );
    return res.data.code;
  },
  addMember: async (projectId: string, email: string) => {
    const res = await api.post(`/projects/${projectId}/members`, { email });
    return res.data;
  },
  postUpdate: async (
    projectId: string,
    payload: { title?: string; body: string }
  ) => {
    const res = await api.post(`/projects/${projectId}/updates`, payload);
    return res.data;
  },
  addComment: async (
    projectId: string,
    updateId: string,
    payload: { body: string; kind?: "COMMENT" | "SUGGESTION" }
  ) => {
    const res = await api.post(
      `/projects/${projectId}/updates/${updateId}/comments`,
      payload
    );
    return res.data;
  },
};

export const tasksApi = {
  list: async (filter: "open" | "completed" | "all" = "open") => {
    const res = await api.get<PersonalTask[]>(`/tasks?filter=${filter}`);
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get<PersonalTask>(`/tasks/${id}`);
    return res.data;
  },
  create: async (payload: CreateTaskPayload) => {
    const res = await api.post<PersonalTask>("/tasks", payload);
    return res.data;
  },
  update: async (id: string, payload: UpdateTaskPayload) => {
    const res = await api.patch<PersonalTask>(`/tasks/${id}`, payload);
    return res.data;
  },
  remove: async (id: string) => {
    await api.delete(`/tasks/${id}`);
  },
};

export const assetsApi = {
  list: async () => {
    const res = await api.get<Asset[]>("/assets");
    return res.data;
  },
};

export type Asset = {
  id: string;
  assetTag: string;
  classification: string | null;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchasePrice: string | number | null;
  supplier: string | null;
  location: string | null;
  staffInCharge: string | null;
  status: string;
  notes: string | null;
  assignments: { assignedAt: string; notes: string | null }[];
};

export type AssignmentAsset = {
  id: string;
  assetTag: string;
  name: string;
  brand: string | null;
  model: string | null;
  location: string | null;
  staffInCharge: string | null;
  status: string;
  assignments: { assignedAt: string; notes: string | null }[];
};

export type AssignmentsResponse = {
  assets: AssignmentAsset[];
  summary: { total: number; assigned: number; available: number };
};

export type MaintenanceRecord = {
  id: string;
  assetId: string;
  type: string;
  description: string;
  date: string;
  cost: string | number | null;
  vendor: string | null;
  completedAt: string | null;
  asset: {
    id: string;
    assetTag: string;
    name: string;
    brand: string | null;
    status: string;
  };
};

export type MaintenanceResponse = {
  records: MaintenanceRecord[];
  assets: { id: string; assetTag: string; name: string; brand: string | null; status: string }[];
  summary: { total: number; open: number; completed: number };
};

export const assetAssignmentsApi = {
  list: async () => {
    const res = await api.get<AssignmentsResponse>("/assets/assignments");
    return res.data;
  },
  action: async (payload: {
    assetId: string;
    action: "assign" | "transfer" | "return";
    staffName?: string;
    notes?: string;
  }) => {
    const res = await api.post("/assets/assignments", payload);
    return res.data;
  },
};

export const assetMaintenanceApi = {
  list: async () => {
    const res = await api.get<MaintenanceResponse>("/assets/maintenance");
    return res.data;
  },
  report: async (payload: {
    assetId: string;
    type: string;
    description: string;
    date: string;
    cost?: number;
    vendor?: string;
    markAsInMaintenance?: boolean;
  }) => {
    const res = await api.post("/assets/maintenance", payload);
    return res.data;
  },
  resolve: async (id: string) => {
    const res = await api.patch("/assets/maintenance", { id, markCompleted: true });
    return res.data;
  },
};
