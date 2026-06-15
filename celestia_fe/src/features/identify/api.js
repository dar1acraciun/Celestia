import { mlRequest, request, postForm } from "../../services/apiClient";

export const predictGNN = (imageFile) => mlRequest("/predict", imageFile);
export const predictAstrometry = (imageFile) =>
  mlRequest("/predict/astrometry", imageFile);
export const predictAll = (imageFile) => mlRequest("/predict/all", imageFile);

export const addHistory = (gnn, astrometry, imageName) =>
  request("/history", { gnn, astrometry, imageName });

export const uploadImage = (imageFile) => {
  const form = new FormData()
  form.append('file', imageFile)
  return postForm('/images/upload', form)
}
