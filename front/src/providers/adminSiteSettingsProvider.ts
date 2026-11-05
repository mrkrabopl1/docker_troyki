// providers/adminSiteSettingsProvider.ts
import axios from 'axios';

const adminApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export interface SiteSettings {
  logo_url: string;
  logo_alt: string;
  logo_version: number;
  font_body_id: number | null;
  font_display_id: number | null;
}
export const getSiteSettings = async (
  callback: (data: SiteSettings) => void
): Promise<void> => {
  try {
    const res = await adminApi.get('/site-settings');
    callback(res.data);
  } catch (e) {
    console.error('Error fetching site settings:', e);
    throw e;
  }
};

export const uploadSiteLogo = async (
  file: File,
  logoAlt: string,
  callback: (data: SiteSettings) => void
): Promise<void> => {
  const fd = new FormData();
  fd.append('image', file);
  if (logoAlt) fd.append('logo_alt', logoAlt);

  try {
    const res = await adminApi.post('/admin/site-settings/logo', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    callback(res.data);
  } catch (e) {
    console.error('Error uploading logo:', e);
    throw e;
  }
};

export const updateLogoAlt = async (
  logoAlt: string,
  callback: (data: SiteSettings) => void
): Promise<void> => {
  try {
    const res = await adminApi.patch('/admin/site-settings/logo-alt', {
      logo_alt: logoAlt,
    });
    callback(res.data);
  } catch (e) {
    console.error('Error updating logo alt:', e);
    throw e;
  }
};

// providers/adminSiteSettingsProvider.ts

export interface FontItem {
  id: number;
  family: string;
  slug: string;
  url: string;
  weight: number;
  style: 'normal' | 'italic';
  is_active: boolean;
  version: number;
}

// список всех шрифтов
export const getFonts = async (
  callback: (data: FontItem[]) => void
): Promise<void> => {
  const res = await adminApi.get('/admin/fonts');
  callback(res.data);
};

// создание шрифта (multipart: family, slug, weight, style, file)
export const createFont = async (
  data: { family: string; slug: string; weight: number; style: string; file: File },
  callback: (font: FontItem) => void
): Promise<void> => {
  const fd = new FormData();
  fd.append('family', data.family);
  fd.append('slug', data.slug);
  fd.append('weight', String(data.weight));
  fd.append('style', data.style);
  fd.append('file', data.file);

  const res = await adminApi.post('/admin/fonts', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  callback(res.data);
};

// заменить файл у существующего шрифта
export const updateFontFile = async (
  id: number,
  file: File,
  callback: (font: FontItem) => void
): Promise<void> => {
  const fd = new FormData();
  fd.append('file', file);
  const res = await adminApi.post(`/admin/fonts/${id}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  callback(res.data);
};

// удалить шрифт
export const deleteFont = async (id: number): Promise<void> => {
  await adminApi.delete(`/admin/fonts/${id}`);
};

// привязать роли (body / display) — какие шрифты использовать
export const setFontRoles = async (
  bodyId: number | null,
  displayId: number | null,
  callback: (data: SiteSettings) => void
): Promise<void> => {
  const res = await adminApi.patch('/admin/site-settings/fonts', {
    font_body_id: bodyId,
    font_display_id: displayId,
  });
  callback(res.data);
};