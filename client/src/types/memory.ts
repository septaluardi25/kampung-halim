export interface MemoryItem {
  id: number;
  title: string;
  event_date: string;
  story: string;
  created_at: string;
}

export interface MemoryTaggedEmployee {
  id: number;
  full_name: string;
  photo_url: string | null;
  initials: string;
}

export interface MemoryDetail {
  id: number;
  title: string;
  event_date: string;
  story: string;
  employees: MemoryTaggedEmployee[];
}

