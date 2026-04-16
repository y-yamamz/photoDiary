// ============================================================
// 共通型定義
// ============================================================

export interface User {
  userId: number;
  username: string;
  createdAt: string;
}

export interface Group {
  groupId: number;
  userId: number;
  groupName: string;
  comment?: string;
  sortOrder?: number;
  createdAt: string;
}

export interface Photo {
  photoId: number;
  userId: number;
  groupId?: number;
  filePath: string;
  fileName?: string;
  takenAt?: string;
  location?: string;
  description?: string;
  sortOrder?: number;
  createdAt: string;
  tags?: Tag[];
}

export interface Tag {
  tagId: number;
  tagName: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserResponse {
  userId: number;
  username: string;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface PhotoFilter {
  year?: number;
  month?: number;
  day?: number;
  groupId?: number;
  keyword?: string;
}

export interface PhotoUploadRequest {
  file: File;
  groupId?: number;
  takenAt?: string;
  location?: string;
  description?: string;
}

export interface GroupRequest {
  groupName: string;
  comment?: string;
}

export interface StorageInfo {
  usedBytes: number;
  limitMb: number;
  limitBytes: number;
  usagePercent: number;
}

// ツリー構造
export interface DateTreeNode {
  year: number;
  months: {
    month: number;
    days: number[];
  }[];
}
