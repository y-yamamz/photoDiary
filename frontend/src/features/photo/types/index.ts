export interface UploadFormValues {
  files: File[];
  groupId: number | '';
  takenAt: string;
  location: string;
  description: string;
}

export interface UploadState {
  previews: string[];
  uploading: boolean;
  converting: boolean;
  progress: number;
  success: boolean;
  error: string | null;
}
