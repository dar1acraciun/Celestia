import {get,request} from "../../services/apiClient";

export const getConstellation = (name) =>
   get(`/constellations/${encodeURIComponent(name)}`)

export const chatWithConstellation = (name, messages) =>
  request(`/constellations/${encodeURIComponent(name)}/chat`, { messages })


export const saveChatSession = (constellationName, messages) =>
  request('/history/chats', { constellationName, messages })