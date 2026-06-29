import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "./config";

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
  department: { name: string } | null;
  position: { title: string } | null;
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
};

export const expensesApi = {
  list: async () => {
    const res = await api.get("/expenses");
    return res.data;
  },
};

export const projectsApi = {
  list: async () => {
    const res = await api.get("/projects");
    return res.data;
  },
};

export const tasksApi = {
  list: async () => {
    const res = await api.get("/tasks");
    return res.data;
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
