export interface UploadFormValues {
  file: File | null;
  groupId: number | '';
  takenAt: string;
  location: string;
  description: string;
}

export interface UploadState {
  preview: string | null;
  uploading: boolean;
  progress: number;
  success: boolean;
  error: string | null;
}
