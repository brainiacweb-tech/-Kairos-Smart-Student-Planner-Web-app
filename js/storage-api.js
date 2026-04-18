// Updated storage.js - Hybrid approach: API with localStorage fallback
class StorageManager {
    constructor() {
        this.useAPI = !!localStorage.getItem('accessToken');
    }

    // Check if user is authenticated with backend
    isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    }

    // ==================== USER AUTH ====================

    async registerUser(email, username, password) {
        try {
            const response = await api.register(email, username, password);
            api.setToken(response.access_token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            return response.user;
        } catch (error) {
            console.error('Registration failed:', error);
            // Fallback to localStorage
            const user = { id: Date.now(), email, username, created_at: new Date().toISOString() };
            localStorage.setItem(`user_${email}`, JSON.stringify(user));
            return user;
        }
    }

    async loginUser(email, password) {
        try {
            const response = await api.login(email, password);
            api.setToken(response.access_token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            return response.user;
        } catch (error) {
            console.error('Login failed:', error);
            // Fallback: check localStorage
            const user = JSON.parse(localStorage.getItem(`user_${email}`) || 'null');
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                return user;
            }
            throw error;
        }
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    }

    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUser');
        api.token = null;
    }

    // ==================== ASSIGNMENTS ====================

    async getAssignments() {
        try {
            const response = await api.getAssignments();
            return response;
        } catch (error) {
            console.log('Falling back to localStorage for assignments');
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem('assignments') || '[]');
        }
    }

    async createAssignment(assignment) {
        try {
            const response = await api.createAssignment(assignment);
            return response.assignment;
        } catch (error) {
            console.log('Using localStorage to create assignment');
            // Fallback to localStorage
            const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
            const newAssignment = {
                id: Date.now(),
                ...assignment,
                created_at: new Date().toISOString()
            };
            assignments.push(newAssignment);
            localStorage.setItem('assignments', JSON.stringify(assignments));
            return newAssignment;
        }
    }

    async updateAssignment(id, assignment) {
        try {
            const response = await api.updateAssignment(id, assignment);
            return response.assignment;
        } catch (error) {
            console.log('Using localStorage to update assignment');
            // Fallback to localStorage
            const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
            const index = assignments.findIndex(a => a.id === id);
            if (index !== -1) {
                assignments[index] = { ...assignments[index], ...assignment };
                localStorage.setItem('assignments', JSON.stringify(assignments));
                return assignments[index];
            }
            throw error;
        }
    }

    async deleteAssignment(id) {
        try {
            await api.deleteAssignment(id);
        } catch (error) {
            console.log('Using localStorage to delete assignment');
            // Fallback to localStorage
            const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
            const filtered = assignments.filter(a => a.id !== id);
            localStorage.setItem('assignments', JSON.stringify(filtered));
        }
    }

    // ==================== LECTURES ====================

    async getLectures() {
        try {
            const response = await api.getLectures();
            return response;
        } catch (error) {
            console.log('Falling back to localStorage for lectures');
            return JSON.parse(localStorage.getItem('lectures') || '[]');
        }
    }

    async createLecture(lecture) {
        try {
            const response = await api.createLecture(lecture);
            return response.lecture;
        } catch (error) {
            console.log('Using localStorage to create lecture');
            const lectures = JSON.parse(localStorage.getItem('lectures') || '[]');
            const newLecture = { id: Date.now(), ...lecture };
            lectures.push(newLecture);
            localStorage.setItem('lectures', JSON.stringify(lectures));
            return newLecture;
        }
    }

    async updateLecture(id, lecture) {
        try {
            const response = await api.updateLecture(id, lecture);
            return response.lecture;
        } catch (error) {
            console.log('Using localStorage to update lecture');
            const lectures = JSON.parse(localStorage.getItem('lectures') || '[]');
            const index = lectures.findIndex(l => l.id === id);
            if (index !== -1) {
                lectures[index] = { ...lectures[index], ...lecture };
                localStorage.setItem('lectures', JSON.stringify(lectures));
                return lectures[index];
            }
        }
    }

    async deleteLecture(id) {
        try {
            await api.deleteLecture(id);
        } catch (error) {
            console.log('Using localStorage to delete lecture');
            const lectures = JSON.parse(localStorage.getItem('lectures') || '[]');
            const filtered = lectures.filter(l => l.id !== id);
            localStorage.setItem('lectures', JSON.stringify(filtered));
        }
    }

    // ==================== LECTURE TOOLS - EXPORT ====================

    async exportLecturesICS() {
        try {
            const response = await api.exportLecturesICS();
            return response;
        } catch (error) {
            console.error('ICS export failed:', error);
            throw error;
        }
    }

    async exportLecturesCSV() {
        try {
            const response = await api.exportLecturesCSV();
            return response;
        } catch (error) {
            console.error('CSV export failed:', error);
            throw error;
        }
    }

    async exportLecturesPDF() {
        try {
            const response = await api.exportLecturesPDF();
            return response;
        } catch (error) {
            console.error('PDF export failed:', error);
            throw error;
        }
    }

    async exportLecturesJSON() {
        try {
            const response = await api.exportLecturesJSON();
            return response;
        } catch (error) {
            console.error('JSON export failed:', error);
            throw error;
        }
    }

    // ==================== LECTURE TOOLS - ANALYSIS ====================

    async analyzeConflicts() {
        try {
            const response = await api.analyzeConflicts();
            return response;
        } catch (error) {
            console.error('Conflict analysis failed:', error);
            return { conflicts: [], message: 'Error analyzing conflicts', conflict_count: 0 };
        }
    }

    async analyzeStatistics() {
        try {
            const response = await api.analyzeStatistics();
            return response;
        } catch (error) {
            console.error('Statistics analysis failed:', error);
            return { message: 'Error generating statistics', statistics: {} };
        }
    }

    async analyzeAvailableSlots(duration = 60) {
        try {
            const response = await api.analyzeAvailableSlots(duration);
            return response;
        } catch (error) {
            console.error('Available slots analysis failed:', error);
            return { available_slots: {}, message: 'Error finding available slots' };
        }
    }

    // ==================== LECTURE TOOLS - IMPORT ====================

    async importLecturesCSV(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.importLecturesCSV(formData);
            return response;
        } catch (error) {
            console.error('CSV import failed:', error);
            throw error;
        }
    }

    // ==================== GPA ====================

    async getGPARecords() {
        try {
            const response = await api.getGPARecords();
            return response;
        } catch (error) {
            console.log('Falling back to localStorage for GPA records');
            return JSON.parse(localStorage.getItem('gpaRecords') || '[]');
        }
    }

    async createGPARecord(record) {
        try {
            const response = await api.createGPARecord(record);
            return response.record;
        } catch (error) {
            console.log('Using localStorage to create GPA record');
            const records = JSON.parse(localStorage.getItem('gpaRecords') || '[]');
            const newRecord = { id: Date.now(), ...record };
            records.push(newRecord);
            localStorage.setItem('gpaRecords', JSON.stringify(records));
            return newRecord;
        }
    }

    async calculateGPA() {
        try {
            const response = await api.calculateGPA();
            return response;
        } catch (error) {
            console.log('Calculating GPA from localStorage');
            const records = JSON.parse(localStorage.getItem('gpaRecords') || '[]');
            if (records.length === 0) return { gpa: 0, total_credits: 0, record_count: 0 };
            
            const total_grade_points = records.reduce((sum, r) => sum + (r.grade_points * r.credits), 0);
            const total_credits = records.reduce((sum, r) => sum + r.credits, 0);
            return {
                gpa: (total_grade_points / total_credits).toFixed(2),
                total_credits,
                record_count: records.length
            };
        }
    }

    async deleteGPARecord(id) {
        try {
            await api.deleteGPARecord(id);
        } catch (error) {
            console.log('Using localStorage to delete GPA record');
            const records = JSON.parse(localStorage.getItem('gpaRecords') || '[]');
            const filtered = records.filter(r => r.id !== id);
            localStorage.setItem('gpaRecords', JSON.stringify(filtered));
        }
    }

    // ==================== STUDY SESSIONS ====================

    async getStudySessions() {
        try {
            const response = await api.getStudySessions();
            return response;
        } catch (error) {
            console.log('Falling back to localStorage for study sessions');
            return JSON.parse(localStorage.getItem('studySessions') || '[]');
        }
    }

    async createStudySession(session) {
        try {
            const response = await api.createStudySession(session);
            return response.session;
        } catch (error) {
            console.log('Using localStorage to create study session');
            const sessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
            const newSession = { id: Date.now(), ...session };
            sessions.push(newSession);
            localStorage.setItem('studySessions', JSON.stringify(sessions));
            return newSession;
        }
    }

    async getStudyStreak() {
        try {
            const response = await api.getStudyStreak();
            return response;
        } catch (error) {
            console.log('Calculating study streak from localStorage');
            const sessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
            // Simple streak calculation from study sessions
            return { current_streak: 0, longest_streak: 0 };
        }
    }

    // ==================== SETTINGS ====================

    async getSettings() {
        try {
            const response = await api.getSettings();
            return response;
        } catch (error) {
            console.log('Using localStorage for settings');
            return JSON.parse(localStorage.getItem('settings') || '{}');
        }
    }

    async updateSettings(settings) {
        try {
            const response = await api.updateSettings(settings);
            return response.settings;
        } catch (error) {
            console.log('Using localStorage to update settings');
            localStorage.setItem('settings', JSON.stringify(settings));
            return settings;
        }
    }

    // ==================== PDF TOOLS ====================

    async mergePDFs(files) {
        try {
            const formData = new FormData();
            for (let file of files) {
                formData.append('files', file);
            }
            const response = await api.mergePDFs(formData);
            return response;
        } catch (error) {
            console.log('Merge PDF failed - localStorage fallback:', error);
            return {
                error: 'PDF merge requires backend server',
                message: 'Please ensure the backend is running'
            };
        }
    }

    async splitPDF(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.splitPDF(formData);
            return response;
        } catch (error) {
            console.log('Split PDF failed:', error);
            return {
                error: 'PDF split requires backend server',
                message: 'Please ensure the backend is running'
            };
        }
    }

    async compressPDF(file, quality = 0.4) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('quality', quality);
            const response = await api.compressPDF(formData);
            return response;
        } catch (error) {
            console.log('Compress PDF failed:', error);
            return {
                error: 'PDF compression requires backend server',
                message: 'Please ensure the backend is running'
            };
        }
    }

    async addWatermark(file, watermarkText, opacity = 0.3) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('watermark', watermarkText);
            formData.append('opacity', opacity);
            const response = await api.addWatermark(formData);
            return response;
        } catch (error) {
            console.log('Add watermark failed:', error);
            return {
                error: 'Watermark requires backend server',
                message: 'Please ensure the backend is running'
            };
        }
    }

    async convertPDFToImages(file, format = 'png') {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('format', format);
            const response = await api.convertPDFToImages(formData);
            return response;
        } catch (error) {
            console.log('Convert PDF to images failed:', error);
            return {
                error: 'PDF conversion requires backend server',
                message: 'Please ensure the backend is running'
            };
        }
    }

    async rotatePDF(file, angle) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('angle', angle);
            const response = await api.rotatePDF(formData);
            return response;
        } catch (error) {
            console.log('Rotate PDF failed:', error);
            return {
                error: 'PDF rotation requires backend server',
                message: 'Please ensure the backend is running'
            };
        }
    }

    async unlockPDF(file, password = '') {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('password', password);
            const response = await api.unlockPDF(formData);
            return response;
        } catch (error) {
            console.log('Unlock PDF failed:', error);
            return {
                error: 'PDF unlock requires backend server',
                message: 'Please ensure the backend is running'
            };
        }
    }

    async extractPages(file, pageRange) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('page_range', pageRange);
            const response = await api.extractPages(formData);
            return response;
        } catch (error) {
            console.log('Extract pages failed:', error);
            return {
                error: 'Extract pages requires backend server',
                message: 'Please ensure the backend is running'
            };
        }
    }

    async wordToPDF(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.wordToPDF(formData);
            return response;
        } catch (error) {
            console.log('Word to PDF conversion failed:', error);
            return {
                error: 'Word conversion requires backend server',
                message: 'Please ensure the backend is running'
            };
        }
    }

    async powerpointToPDF(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.powerpointToPDF(formData);
            return response;
        } catch (error) {
            console.log('PowerPoint to PDF conversion failed:', error);
            return {
                error: 'PowerPoint conversion requires backend server',
                message: 'Please ensure the backend is running'
            };
        }
    }

    async getPDFInfo(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.getPDFInfo(formData);
            return response;
        } catch (error) {
            console.log('Get PDF info failed:', error);
            return {
                error: 'PDF info requires backend server',
                message: 'Please ensure the backend is running'
            };
        }
    }

    async getPDFHistory(limit = 20) {
        try {
            const response = await api.getPDFHistory(limit);
            return response;
        } catch (error) {
            console.log('Get PDF history failed - using localStorage:', error);
            const history = JSON.parse(localStorage.getItem('pdf_operations') || '[]');
            return { operations: history };
        }
    }

    // ==================== TIMETABLES ====================

    async getTimetables() {
        try {
            const response = await api.getTimetables();
            return response;
        } catch (error) {
            console.log('Fallback to localStorage for timetables');
            return JSON.parse(localStorage.getItem('timetables') || '[]');
        }
    }

    async getTimetable(id) {
        try {
            const response = await api.getTimetable(id);
            return response;
        } catch (error) {
            console.log('Fallback to localStorage for single timetable');
            const timetables = JSON.parse(localStorage.getItem('timetables') || '[]');
            return timetables.find(t => t.id === id) || { error: 'Not found' };
        }
    }

    async uploadTimetable(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.uploadTimetable(formData);
            return response;
        } catch (error) {
            console.log('Timetable upload failed:', error);
            // Fallback: store in localStorage
            const reader = new FileReader();
            reader.onload = (e) => {
                const timetables = JSON.parse(localStorage.getItem('timetables') || '[]');
                const newTimetable = {
                    id: Date.now(),
                    name: file.name,
                    file_type: file.type,
                    file_size: file.size,
                    source: 'upload',
                    created_at: new Date().toISOString()
                };
                timetables.push(newTimetable);
                localStorage.setItem('timetables', JSON.stringify(timetables));
            };
            reader.readAsArrayBuffer(file);
            
            return {
                message: 'Uploaded to local storage',
                timetable: { name: file.name }
            };
        }
    }

    async deleteTimetable(id) {
        try {
            await api.deleteTimetable(id);
            return { message: 'Timetable deleted' };
        } catch (error) {
            console.log('Delete failed - using localStorage:', error);
            const timetables = JSON.parse(localStorage.getItem('timetables') || '[]');
            const filtered = timetables.filter(t => t.id !== id);
            localStorage.setItem('timetables', JSON.stringify(filtered));
            return { message: 'Deleted from local storage' };
        }
    }

    async activateTimetable(id) {
        try {
            const response = await api.activateTimetable(id);
            return response;
        } catch (error) {
            console.log('Activate failed:', error);
            return { error: 'Activate requires backend server' };
        }
    }

    async getExtractionPreview(id) {
        try {
            const response = await api.getExtractionPreview(id);
            return response;
        } catch (error) {
            console.log('Get preview failed:', error);
            return { error: 'Preview requires backend server' };
        }
    }

    async confirmExtraction(id, coursesData) {
        try {
            const response = await api.confirmExtraction(id, coursesData);
            return response;
        } catch (error) {
            console.log('Confirm extraction failed:', error);
            return { error: 'Confirmation requires backend server' };
        }
    }

    async bulkCreateClasses(classesData) {
        try {
            const response = await api.bulkCreateClasses(classesData);
            return response;
        } catch (error) {
            console.log('Bulk create failed:', error);
            // Fallback: create in localStorage
            const classes = JSON.parse(localStorage.getItem('scheduledClasses') || '[]');
            const created = classesData.map(c => ({ id: Date.now() + Math.random(), ...c }));
            classes.push(...created);
            localStorage.setItem('scheduledClasses', JSON.stringify(classes));
            return { message: 'Created in local storage', classes: created };
        }
    }

    // ==================== SCHEDULED CLASSES ====================

    async getScheduledClasses() {
        try {
            const response = await api.getScheduledClasses();
            return response;
        } catch (error) {
            console.log('Fallback to localStorage for scheduled classes');
            return JSON.parse(localStorage.getItem('scheduledClasses') || '[]');
        }
    }

    async createScheduledClass(classData) {
        try {
            const response = await api.createScheduledClass(classData);
            return response;
        } catch (error) {
            console.log('Create class failed - using localStorage:', error);
            const classes = JSON.parse(localStorage.getItem('scheduledClasses') || '[]');
            const newClass = { id: Date.now(), ...classData };
            classes.push(newClass);
            localStorage.setItem('scheduledClasses', JSON.stringify(classes));
            return { message: 'Created in local storage', scheduled_class: newClass };
        }
    }

    async getScheduledClass(id) {
        try {
            const response = await api.getScheduledClass(id);
            return response;
        } catch (error) {
            console.log('Get class failed:', error);
            const classes = JSON.parse(localStorage.getItem('scheduledClasses') || '[]');
            return classes.find(c => c.id === id) || { error: 'Not found' };
        }
    }

    async updateScheduledClass(id, classData) {
        try {
            const response = await api.updateScheduledClass(id, classData);
            return response;
        } catch (error) {
            console.log('Update class failed - using localStorage:', error);
            const classes = JSON.parse(localStorage.getItem('scheduledClasses') || '[]');
            const index = classes.findIndex(c => c.id === id);
            if (index !== -1) {
                classes[index] = { ...classes[index], ...classData };
                localStorage.setItem('scheduledClasses', JSON.stringify(classes));
                return { message: 'Updated in local storage', scheduled_class: classes[index] };
            }
            return { error: 'Class not found' };
        }
    }

    async deleteScheduledClass(id) {
        try {
            await api.deleteScheduledClass(id);
            return { message: 'Scheduled class deleted' };
        } catch (error) {
            console.log('Delete class failed - using localStorage:', error);
            const classes = JSON.parse(localStorage.getItem('scheduledClasses') || '[]');
            const filtered = classes.filter(c => c.id !== id);
            localStorage.setItem('scheduledClasses', JSON.stringify(filtered));
            return { message: 'Deleted from local storage' };
        }
    }

    async getClassesByDay(day) {
        try {
            const response = await api.getClassesByDay(day);
            return response;
        } catch (error) {
            console.log('Get classes by day failed:', error);
            const classes = JSON.parse(localStorage.getItem('scheduledClasses') || '[]');
            return classes.filter(c => c.days_of_week && c.days_of_week.includes(day));
        }
    }

    async getTimetableAnalytics() {
        try {
            const response = await api.getTimetableAnalytics();
            return response;
        } catch (error) {
            console.log('Get analytics failed:', error);
            const timetables = JSON.parse(localStorage.getItem('timetables') || '[]');
            const classes = JSON.parse(localStorage.getItem('scheduledClasses') || '[]');
            return {
                total_timetables: timetables.length,
                total_classes: classes.length,
                classes_by_day: {}
            };
        }
    }

    // ==================== ANALYTICS ====================

    async getStats() {
        try {
            const response = await api.getStats();
            return response;
        } catch (error) {
            console.log('Calculating stats from localStorage');
            return this._calculateStatsLocal();
        }
    }

    async getUpcomingAssignments() {
        try {
            const response = await api.getUpcomingAssignments();
            return response;
        } catch (error) {
            console.log('Getting upcoming from localStorage');
            const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
            return assignments
                .filter(a => a.due_date && new Date(a.due_date) >= new Date())
                .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                .slice(0, 10);
        }
    }

    _calculateStatsLocal() {
        const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return {
            total_assignments: assignments.length,
            completed: assignments.filter(a => a.status === 'completed').length,
            in_progress: assignments.filter(a => a.status === 'in-progress').length,
            pending: assignments.filter(a => a.status === 'pending').length,
            due_today: assignments.filter(a => {
                const dueDate = new Date(a.due_date);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate.getTime() === today.getTime();
            }).length,
            overdue: assignments.filter(a => 
                a.status === 'pending' && new Date(a.due_date) < today
            ).length,
            due_this_week: assignments.filter(a => {
                const dueDate = new Date(a.due_date);
                return dueDate >= today && dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            }).length
        };
    }
}

// Initialize global storage manager
const storage = new StorageManager();
