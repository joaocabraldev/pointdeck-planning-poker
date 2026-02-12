export interface User {
  id: string;
  name: string;
  createdAt: Date;
}

export interface CreateUserInput {
  name: string;
}

export interface UserResponse {
  id: string;
  name: string;
}

export interface SessionResponse {
  user: UserResponse;
  token: string;
}
