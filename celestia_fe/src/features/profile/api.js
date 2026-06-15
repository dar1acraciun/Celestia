import { get } from "../../services/apiClient";

export const getHistory = (page = 0, limit = 10) =>
  get(`/history?page=${page}&limit=${limit}`);

export const getUser = () => get("/users/me");

export const getChatSessions = () => get("/history/chats");
