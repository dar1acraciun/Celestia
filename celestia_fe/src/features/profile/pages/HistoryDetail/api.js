import { get } from "../../../../services/apiClient"

export const getHistoryById = (id) =>
  get(`/history/${id}`)