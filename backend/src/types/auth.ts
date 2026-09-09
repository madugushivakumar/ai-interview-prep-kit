export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}
