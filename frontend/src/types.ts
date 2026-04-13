export interface User {
  id: number;
  username: string;
  is_admin: boolean;
  must_change_password: boolean;
  created_at: string;
}

export interface Conversion {
  id: number;
  original_filename: string;
  stored_filename: string;
  file_size: number | null;
  created_at: string;
}
