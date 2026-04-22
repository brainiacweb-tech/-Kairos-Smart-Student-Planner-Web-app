// API Client - Handles all communication with Flask backend
class APIClient {
    constructor(baseURL = null) {
        const host = window.location.hostname;
        const isLocal = host === 'localhost' || host === '127.0.0.1';
        this.baseURL = baseURL || (typeof KAIROS_API_BASE !== 'undefined'
            ? KAIROS_API_BASE
            : (isLocal ? 'http://localhost:5000/api' : '/api'));
        this.token = localStorage.getItem('accessToken');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('accessToken', token);
    }

    getHeaders(isFormData = false) {
        const headers = {
            ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        };
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        return headers;
    }

    async request(endpoint, options = {}, isFormData = false) {
        const url = `${this.baseURL}${endpoint}`;
        try {
            const response = await fetch(url, {
                ...options,
                headers: this.getHeaders(isFormData)
            });

            // Handle 401 - Token expired
            if (response.status === 401) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
                return null;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API Error');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async register(email, username, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, username, password })
        });
    }

    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async getMe() {
        return this.request('/auth/me', { method: 'GET' });
    }

    // Assignment endpoints
    async getAssignments() {
        return this.request('/assignments', { method: 'GET' });
    }

    async createAssignment(assignment) {
        return this.request('/assignments', {
            method: 'POST',
            body: JSON.stringify(assignment)
        });
    }

    async getAssignment(id) {
        return this.request(`/assignments/${id}`, { method: 'GET' });
    }

    async updateAssignment(id, assignment) {
        return this.request(`/assignments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(assignment)
        });
    }

    async deleteAssignment(id) {
        return this.request(`/assignments/${id}`, { method: 'DELETE' });
    }

    // Lecture endpoints
    async getLectures() {
        return this.request('/lectures', { method: 'GET' });
    }

    async createLecture(lecture) {
        return this.request('/lectures', {
            method: 'POST',
            body: JSON.stringify(lecture)
        });
    }

    async updateLecture(id, lecture) {
        return this.request(`/lectures/${id}`, {
            method: 'PUT',
            body: JSON.stringify(lecture)
        });
    }

    async deleteLecture(id) {
        return this.request(`/lectures/${id}`, { method: 'DELETE' });
    }

    // Lecture Tools - Export endpoints
    async exportLecturesICS() {
        return this.request('/lectures/export/ics', { method: 'GET' });
    }

    async exportLecturesCSV() {
        return this.request('/lectures/export/csv', { method: 'GET' });
    }

    async exportLecturesPDF() {
        return this.request('/lectures/export/pdf', { method: 'GET' });
    }

    async exportLecturesJSON() {
        return this.request('/lectures/export/json', { method: 'GET' });
    }

    // Lecture Tools - Analysis endpoints
    async analyzeConflicts() {
        return this.request('/lectures/analyze/conflicts', { method: 'GET' });
    }

    async analyzeStatistics() {
        return this.request('/lectures/analyze/statistics', { method: 'GET' });
    }

    async analyzeAvailableSlots(duration = 60) {
        return this.request(`/lectures/analyze/available-slots?duration=${duration}`, { method: 'GET' });
    }

    // Lecture Tools - Import endpoint
    async importLecturesCSV(formData) {
        return this.request('/lectures/import/csv', {
            method: 'POST',
            body: formData
        }, true); // true = isFormData
    }

    // GPA endpoints
    async getGPARecords() {
        return this.request('/gpa/records', { method: 'GET' });
    }

    async createGPARecord(record) {
        return this.request('/gpa/records', {
            method: 'POST',
            body: JSON.stringify(record)
        });
    }

    async calculateGPA() {
        return this.request('/gpa/calculate', { method: 'GET' });
    }

    async deleteGPARecord(id) {
        return this.request(`/gpa/records/${id}`, { method: 'DELETE' });
    }

    // Study session endpoints
    async getStudySessions() {
        return this.request('/study-sessions', { method: 'GET' });
    }

    async createStudySession(session) {
        return this.request('/study-sessions', {
            method: 'POST',
            body: JSON.stringify(session)
        });
    }

    async getStudyStreak() {
        return this.request('/study-sessions/streak', { method: 'GET' });
    }

    // Settings endpoints
    async getSettings() {
        return this.request('/settings', { method: 'GET' });
    }

    async updateSettings(settings) {
        return this.request('/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    // Analytics endpoints
    async getStats() {
        return this.request('/analytics/stats', { method: 'GET' });
    }

    async getUpcomingAssignments() {
        return this.request('/analytics/upcoming', { method: 'GET' });
    }

    // PDF endpoints
    async mergePDFs(formData) {
        return this.request('/pdf/merge', {
            method: 'POST',
            body: formData
        }, true);
    }

    async splitPDF(formData) {
        return this.request('/pdf/split', {
            method: 'POST',
            body: formData
        }, true);
    }

    async compressPDF(formData) {
        return this.request('/pdf/compress', {
            method: 'POST',
            body: formData
        }, true);
    }

    async addWatermark(formData) {
        return this.request('/pdf/watermark', {
            method: 'POST',
            body: formData
        }, true);
    }

    async convertPDFToImages(formData) {
        return this.request('/pdf/convert-to-image', {
            method: 'POST',
            body: formData
        }, true);
    }

    async rotatePDF(formData) {
        return this.request('/pdf/rotate', {
            method: 'POST',
            body: formData
        }, true);
    }

    async unlockPDF(formData) {
        return this.request('/pdf/unlock', {
            method: 'POST',
            body: formData
        }, true);
    }

    async extractPages(formData) {
        return this.request('/pdf/extract-pages', {
            method: 'POST',
            body: formData
        }, true);
    }

    async wordToPDF(formData) {
        return this.request('/pdf/word-to-pdf', {
            method: 'POST',
            body: formData
        }, true);
    }

    async powerpointToPDF(formData) {
        return this.request('/pdf/ppt-to-pdf', {
            method: 'POST',
            body: formData
        }, true);
    }

    async getPDFInfo(formData) {
        return this.request('/pdf/info', {
            method: 'POST',
            body: formData
        }, true);
    }

    async getPDFHistory(limit = 20) {
        return this.request(`/pdf/history?limit=${limit}`, { method: 'GET' });
    }

    // Timetable endpoints
    async getTimetables() {
        return this.request('/timetables', { method: 'GET' });
    }

    async getTimetable(id) {
        return this.request(`/timetables/${id}`, { method: 'GET' });
    }

    async uploadTimetable(formData) {
        return this.request('/timetables/upload', {
            method: 'POST',
            body: formData
        }, true);
    }

    async deleteTimetable(id) {
        return this.request(`/timetables/${id}`, { method: 'DELETE' });
    }

    async activateTimetable(id) {
        return this.request(`/timetables/${id}/activate`, { method: 'PUT' });
    }

    async getExtractionPreview(id) {
        return this.request(`/timetables/${id}/extract-preview`, { method: 'GET' });
    }

    async confirmExtraction(id, coursesData) {
        return this.request(`/timetables/${id}/confirm-extraction`, {
            method: 'POST',
            body: JSON.stringify({ courses: coursesData })
        });
    }

    async bulkCreateClasses(classesData) {
        return this.request('/scheduled-classes/bulk-create', {
            method: 'POST',
            body: JSON.stringify({ classes: classesData })
        });
    }

    // Scheduled class endpoints
    async getScheduledClasses() {
        return this.request('/scheduled-classes', { method: 'GET' });
    }

    async createScheduledClass(classData) {
        return this.request('/scheduled-classes', {
            method: 'POST',
            body: JSON.stringify(classData)
        });
    }

    async getScheduledClass(id) {
        return this.request(`/scheduled-classes/${id}`, { method: 'GET' });
    }

    async updateScheduledClass(id, classData) {
        return this.request(`/scheduled-classes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(classData)
        });
    }

    async deleteScheduledClass(id) {
        return this.request(`/scheduled-classes/${id}`, { method: 'DELETE' });
    }

    async getClassesByDay(day) {
        return this.request(`/scheduled-classes/by-day/${day}`, { method: 'GET' });
    }

    async getTimetableAnalytics() {
        return this.request('/timetables/analytics', { method: 'GET' });
    }
}

// Initialize global API client
const api = new APIClient();
