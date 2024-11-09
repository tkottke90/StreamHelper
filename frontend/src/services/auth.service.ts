import { route } from "preact-router"
import { httpRequest, parseJsonResponse } from "../utils/http.utils";
import { UserDTO } from "../../../backend/src/dto/user.dto";

export function login() {
  window.location.replace("/api/v1/auth/login")
}

export function logout() {
  route('/logout');
}

export async function handleAuthCodeResponse() {
  await fetch(`/api/v1/auth/code${window.location.search}`)
}

export async function getCurrentUser(accessToken: string) {
  const headers = new Headers();
  headers.append('Authorization', `Bearer ${accessToken}`);

  return await httpRequest(
    fetch('/api/v1/auth/me'),
    parseJsonResponse
  )
}

export async function getAuthenticatedUserInfo() {
  return await httpRequest(
    fetch('/api/v1/auth/userInfo'),
    parseJsonResponse<UserDTO>
  )
}