import type { Photo, Group, PhotoFilter, DateTreeNode } from '../../../shared/types';

export interface AlbumState {
  photos: Photo[];
  groups: Group[];
  filter: PhotoFilter;
  dateTree: DateTreeNode[];
  selectedDate: { year?: number; month?: number; day?: number };
  loading: boolean;
  error: string | null;
}

export type { Photo, Group, PhotoFilter, DateTreeNode };
