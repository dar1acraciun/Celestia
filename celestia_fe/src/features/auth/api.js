import { request } from "../../services/apiClient";

export const loginUser = (email, password) =>
  request('/auth/login', { email, password })

export const registerUser = (email, password) =>
  request('/auth/register', { email, password })
 