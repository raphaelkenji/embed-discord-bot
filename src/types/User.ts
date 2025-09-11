export interface User {
  id: string;
  activated: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateUserData {
  id: string;
  activated: boolean;
}

export interface UpdateUserData {
  activated?: boolean;
}