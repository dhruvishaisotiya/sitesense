import api from './axios';

/**
 * Every tab of the Settings page in one request: profile, preferences,
 * organization defaults, the choice lists and whether this user may edit
 * organization settings.
 */
export const getSettingsOverview = async () => {
  const response = await api.get('/settings/overview/');
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/settings/profile/');
  return response.data;
};

export const updateProfile = async (payload) => {
  const response = await api.patch('/settings/profile/', payload);
  return response.data;
};

export const getPreferences = async () => {
  const response = await api.get('/settings/preferences/');
  return response.data;
};

export const updatePreferences = async (payload) => {
  const response = await api.patch('/settings/preferences/', payload);
  return response.data;
};

export const getOrganizationSettings = async () => {
  const response = await api.get('/settings/organization/');
  return response.data;
};

export const updateOrganizationSettings = async (payload) => {
  const response = await api.patch('/settings/organization/', payload);
  return response.data;
};

export const changePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
  const response = await api.post('/settings/change-password/', {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
  return response.data;
};

/**
 * Turns a DRF error body into a single readable line.
 * DRF returns {field: [msg, ...]} for validation errors and {detail: msg}
 * for permission errors, so both shapes are flattened here.
 */
export const extractApiError = (err, fallback = 'Something went wrong. Please try again.') => {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;

  const messages = Object.entries(data).map(([field, value]) => {
    const text = Array.isArray(value) ? value.join(' ') : String(value);
    return field === 'non_field_errors' ? text : `${field.replace(/_/g, ' ')}: ${text}`;
  });

  return messages.length ? messages.join(' · ') : fallback;
};
