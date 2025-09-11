export interface Url {
  id: number;
  original_url: string;
  regex: string;
  replacement_url: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateUrlData {
  original_url: string;
  regex: string;
  replacement_url: string;
}

export interface UpdateUrlData {
  original_url?: string;
  regex?: string;
  replacement_url?: string;
}