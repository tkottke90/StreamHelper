export type AuthentikUserInfo = {
  sub: string;
  sid: string;
  ak_proxy: {
    user_attributes: Record<string, any>;
    is_superuser: boolean;
  };
  email: string;
  email_verified: string;
  name: string;
  given_name: string;
  preferred_username: string;
  nickname: string;
  groups: string[];
  tokenExpiration?: Date;
  token?: string;
};
