import api from './axios';

export const getAttendance = async (params = {}) => {
  const response = await api.get('/attendance/', { params });
  return response.data;
};

export const bulkSubmitAttendance = async (data) => {
  const response = await api.post('/attendance/bulk/', data);
  return response.data;
};

export const getAttendanceSummary = async (params = {}) => {
  const response = await api.get('/attendance/summary/', { params });
  return response.data;
};

export const exportAttendanceCSV = async (params = {}) => {
  const response = await api.get('/attendance/export-csv/', {
    params,
    responseType: 'blob',
  });
  
  // Trigger file download in browser
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `SiteSense_Attendance_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
