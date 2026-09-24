import api from './axios';

export const getDashboardSummary = async (params = {}) => {
  const response = await api.get('/reports/dashboard-summary/', { params });
  return response.data;
};

export const getProjectReports = async (params = {}) => {
  const response = await api.get('/reports/projects/', { params });
  return response.data;
};

export const getWorkerReports = async (params = {}) => {
  const response = await api.get('/reports/workers/', { params });
  return response.data;
};

export const getAttendanceReports = async (params = {}) => {
  const response = await api.get('/reports/attendance/', { params });
  return response.data;
};

export const getTaskReports = async (params = {}) => {
  const response = await api.get('/reports/tasks/', { params });
  return response.data;
};

export const getBudgetReports = async (params = {}) => {
  const response = await api.get('/reports/budget/', { params });
  return response.data;
};

export const getDailyProgressReports = async (params = {}) => {
  const response = await api.get('/reports/daily-progress/', { params });
  return response.data;
};

export const getAiReports = async (params = {}) => {
  const response = await api.get('/reports/ai-prediction/', { params });
  return response.data;
};

export const exportReports = async (format = 'pdf', reportType = 'projects', projectId = '') => {
  const params = { export_format: format, report_type: reportType };
  if (projectId) params.project_id = projectId;

  try {
    const response = await api.get('/reports/export/', {
      params,
      responseType: 'blob',
    });

    const extMap = { pdf: 'pdf', excel: 'xlsx', xlsx: 'xlsx', csv: 'csv' };
    const ext = extMap[format] || 'csv';

    const mimeMap = {
      pdf: 'application/pdf',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv'
    };

    // Construct clean blob from binary response
    const blob = response.data instanceof Blob 
      ? new Blob([response.data], { type: mimeMap[format] || 'application/octet-stream' })
      : new Blob([response.data], { type: mimeMap[format] || 'application/octet-stream' });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SiteSense_${reportType}_Report.${ext}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  } catch (err) {
    if (err.response && err.response.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        if (json.error) throw new Error(json.error);
        if (json.detail) throw new Error(json.detail);
      } catch (e) {
        if (e.message && !e.message.includes('JSON')) {
          throw e;
        }
      }
    }
    throw err;
  }
};
