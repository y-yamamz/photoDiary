import { formatFileSize } from '../../../shared/utils';

export { formatFileSize };

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const getExtension = (name: string) =>
  name.slice(name.lastIndexOf('.')).toLowerCase();

export const validateImageFile = (file: File): string | null => {
  const byType = ACCEPTED_TYPES.includes(file.type);
  const byExt  = ACCEPTED_EXTENSIONS.includes(getExtension(file.name));
  if (!byType && !byExt) {
    return 'JPEG / PNG / WebP / HEIC 形式のみ対応しています';
  }
  if (file.size > MAX_FILE_SIZE) {
    return `ファイルサイズは ${formatFileSize(MAX_FILE_SIZE)} 以下にしてください（現在: ${formatFileSize(file.size)}）`;
  }
  return null;
};

export const createPreviewUrl = (file: File): string =>
  URL.createObjectURL(file);

export const revokePreviewUrl = (url: string) =>
  URL.revokeObjectURL(url);

// ─── HEIC 変換 ─────────────────────────────────────────────────

import type { ConvertFormat } from '../types';

// 一括変換の上限
export const MAX_CONVERT_FILES = 50;
export const MAX_CONVERT_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB

type ConvertableFormat = Exclude<ConvertFormat, 'none'>;

const FORMAT_MIME: Record<ConvertableFormat, string> = {
  jpeg: 'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
};
const FORMAT_EXT: Record<ConvertableFormat, string> = {
  jpeg: '.jpg',
  png:  '.png',
  webp: '.webp',
};

type Heic2AnyFn = (opts: { blob: Blob; toType: string; quality: number }) => Promise<Blob | Blob[]>;

// heic2any モジュールを一度だけロードしてキャッシュする
let _heic2any: Heic2AnyFn | null = null;
const loadHeic2any = async (): Promise<Heic2AnyFn> => {
  if (!_heic2any) _heic2any = (await import('heic2any')).default as unknown as Heic2AnyFn;
  return _heic2any;
};

/**
 * HEIC ファイルを指定形式の File オブジェクトに変換する。
 * format が 'none' または HEIC 以外のファイルはそのまま返す。
 * 変換後のファイル名は拡張子のみ変更し、ベース名は保持する。
 */
export const convertHeic = async (file: File, format: ConvertFormat = 'none'): Promise<File> => {
  if (format === 'none') return file;
  if (!getExtension(file.name).match(/^\.heic$/i)) return file;
  const fmt = format as ConvertableFormat;
  const heic2any = await loadHeic2any();
  const converted = await heic2any({ blob: file, toType: FORMAT_MIME[fmt], quality: 0.9 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  const baseName = file.name.slice(0, file.name.lastIndexOf('.'));
  const newName = baseName + FORMAT_EXT[fmt];
  return new File([blob], newName, { type: FORMAT_MIME[fmt] });
};

import type { OutputFormat } from '../types';

const OUTPUT_MIME: Record<OutputFormat, string> = {
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};
const OUTPUT_EXT: Record<OutputFormat, string> = {
  jpeg: '.jpg',
  webp: '.webp',
};
const OUTPUT_QUALITY: Record<OutputFormat, number> = {
  jpeg: 0.85,
  webp: 0.80,
};

/** 指定ファイルが保存フォーマットと一致しているか判定する */
export const matchesOutputFormat = (file: File, outputFormat: OutputFormat): boolean => {
  if (outputFormat === 'jpeg') {
    return file.type === 'image/jpeg' || /\.(jpg|jpeg)$/i.test(file.name);
  }
  return file.type === 'image/webp' || /\.webp$/i.test(file.name);
};

/**
 * ファイルを保存フォーマットに変換して返す。
 * すでに一致しているファイルはそのまま返す（変換コストなし）。
 * - HEIC: heic2any を使用
 * - PNG / WebP 他: Canvas API を使用
 */
export const convertToOutputFormat = async (file: File, outputFormat: OutputFormat): Promise<File> => {
  // すでに正しいフォーマット → そのまま返す
  if (matchesOutputFormat(file, outputFormat)) return file;

  const mime    = OUTPUT_MIME[outputFormat];
  const ext     = OUTPUT_EXT[outputFormat];
  const quality = OUTPUT_QUALITY[outputFormat];
  const baseName = file.name.replace(/\.[^.]+$/, '');

  // HEIC → heic2any で変換
  if (/\.heic$/i.test(file.name) || file.type === 'image/heic') {
    const heic2any = await loadHeic2any();
    const converted = await heic2any({ blob: file, toType: mime, quality });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    return new File([blob], baseName + ext, { type: mime });
  }

  // PNG / WebP 他 → Canvas API で変換
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width  = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d')!;

  // JPEG はアルファ非対応のため白背景に合成する
  if (outputFormat === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error(`${file.name} の変換に失敗しました`)); return; }
        resolve(new File([blob], baseName + ext, { type: mime }));
      },
      mime,
      quality,
    );
  });
};

// ─── ファイル日時 ──────────────────────────────────────────────

/**
 * File の最終更新日時を datetime-local 形式（"YYYY-MM-DDTHH:MM"）で返す。
 * EXIF がない場合のフォールバックとして使用する。
 */
export const fileLastModified = (file: File): string => {
  const d = new Date(file.lastModified);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// ─── EXIF 撮影日時読み取り ──────────────────────────────────────

/**
 * JPEG ファイルの EXIF から撮影日時を取得する。
 * 戻り値: datetime-local 形式 "YYYY-MM-DDTHH:MM"、取得不可なら null
 */
export const readExifDate = async (file: File): Promise<string | null> => {
  const ext = getExtension(file.name);
  if (ext !== '.jpg' && ext !== '.jpeg') return null;
  try {
    const buf = await file.slice(0, 65536).arrayBuffer();
    const view = new DataView(buf);
    if (view.getUint16(0) !== 0xFFD8) return null; // JPEG SOI チェック

    let pos = 2;
    while (pos + 4 <= view.byteLength) {
      if (view.getUint8(pos) !== 0xFF) break;
      const marker = view.getUint16(pos);
      if (marker === 0xFFD9 || marker === 0xFFDA) break; // EOI / SOS
      const segLen = view.getUint16(pos + 2);
      if (marker === 0xFFE1) {                           // APP1
        const result = _parseExifDate(view, pos + 4);
        if (result) return result;
      }
      pos += 2 + segLen;
    }
  } catch { /* ignore */ }
  return null;
};

const _parseExifDate = (view: DataView, start: number): string | null => {
  const header = String.fromCharCode(
    view.getUint8(start), view.getUint8(start + 1),
    view.getUint8(start + 2), view.getUint8(start + 3),
  );
  if (header !== 'Exif') return null;

  const tiff = start + 6; // "Exif\0\0" の後
  const le   = view.getUint16(tiff) === 0x4949; // II = little-endian
  const ifd0 = tiff + view.getUint32(tiff + 4, le);
  return _searchDate(view, tiff, ifd0, le);
};

const _searchDate = (view: DataView, tiff: number, ifdPos: number, le: boolean): string | null => {
  if (ifdPos + 2 > view.byteLength) return null;
  const count = view.getUint16(ifdPos, le);
  let fallback: string | null = null;

  for (let i = 0; i < count; i++) {
    const entry = ifdPos + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;
    const tag = view.getUint16(entry, le);

    if (tag === 0x9003 || tag === 0x0132) { // DateTimeOriginal / DateTime
      const valOff = view.getUint32(entry + 8, le);
      const dt = _exifToIso(_readAscii(view, tiff + valOff, 19));
      if (dt) {
        if (tag === 0x9003) return dt;   // DateTimeOriginal を最優先
        fallback = dt;
      }
    }
    if (tag === 0x8769) {                // Exif SubIFD ポインタ
      const subIfd = tiff + view.getUint32(entry + 8, le);
      const sub = _searchDate(view, tiff, subIfd, le);
      if (sub) return sub;
    }
  }
  return fallback;
};

const _readAscii = (view: DataView, start: number, maxLen: number): string => {
  let s = '';
  for (let i = 0; i < maxLen && start + i < view.byteLength; i++) {
    const c = view.getUint8(start + i);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
};

/** "YYYY:MM:DD HH:MM:SS" → "YYYY-MM-DDTHH:MM" */
const _exifToIso = (s: string): string | null => {
  if (!/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}/.test(s)) return null;
  return s.slice(0, 10).replace(/:/g, '-') + 'T' + s.slice(11, 16);
};
