import type { Group } from '../../../shared/types';

export type { Group };

export interface GroupFormValues {
  groupName: string;
  comment: string;
}

export interface GroupState {
  groups: Group[];
  editingId: number | null;
  loading: boolean;
  error: string | null;
}
