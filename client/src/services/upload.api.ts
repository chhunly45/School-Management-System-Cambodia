import api from './api';

export const uploadImages = async (files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.data;
};

export const uploadBannerImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/banners/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.data;
};
