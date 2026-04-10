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
