import { User } from '../../prisma/generated/prisma/client.js';

export interface AuthenticatedUser extends User {
  email: string;
  email_verified: boolean;
  preferred_username: string;
  given_name: string;
  token: string;
}
