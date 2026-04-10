export type ConvertFormat = 'none' | 'jpeg' | 'png' | 'webp';

export interface UploadFormValues {
  files: File[];
  groupId: number | '';
  takenAt: string;
  overrideTakenAt: boolean;  // true: 入力日付で全ファイルを処理 / false: 各ファイルのEXIF日付を使用
  location: string;
  description: string;
  convertFormat: ConvertFormat;
}

export interface UploadState {
  previews: string[];
  exifDates: string[];        // 各ファイルのEXIF日付（'' の場合はEXIFなし）
  uploading: boolean;
  converting: boolean;
  convertDone: number;
  convertTotal: number;
  convertProgress: number;
  progress: number;
  success: boolean;
  error: string | null;
}
