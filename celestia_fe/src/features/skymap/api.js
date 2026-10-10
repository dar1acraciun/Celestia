import { request } from '../../services/apiClient'

export const chatWithSky = (messages, latitude, longitude, time) =>
  request('/skymap/chat', { messages, latitude, longitude, time })
