/* ===========================
   KAIROS STORAGE - LOCALSTORAGE CRUD
   =========================== */

class KairosStorage {
    // ASSIGNMENTS
    static getAssignments(filter = {}) {
        let assignments = JSON.parse(localStorage.getItem('kairos_assignments') || '[]');
        
        if (filter.status) {
            assignments = assignments.filter(a => a.status === filter.status);
        }
        if (filter.priority) {
            assignments = assignments.filter(a => a.priority === filter.priority);
        }
        if (filter.course) {
            assignments = assignments.filter(a => a.course === filter.course);
        }
        if (filter.search) {
            const term = filter.search.toLowerCase();
            assignments = assignments.filter(a => 
                a.title.toLowerCase().includes(term) ||
                a.course.toLowerCase().includes(term)
            );
        }
        
        return assignments;
    }

    static getAssignmentById(id) {
        const assignments = JSON.parse(localStorage.getItem('kairos_assignments') || '[]');
        return assignments.find(a => a.id === parseInt(id));
    }

    static addAssignment(assignment) {
        const assignments = JSON.parse(localStorage.getItem('kairos_assignments') || '[]');
        
        const newAssignment = {
            id: assignments.length > 0 ? Math.max(...assignments.map(a => a.id)) + 1 : 1,
            createdAt: new Date().toISOString(),
            ...assignment
        };
        
        assignments.push(newAssignment);
        localStorage.setItem('kairos_assignments', JSON.stringify(assignments));
        
        return newAssignment;
    }

    static updateAssignment(id, updates) {
        const assignments = JSON.parse(localStorage.getItem('kairos_assignments') || '[]');
        const index = assignments.findIndex(a => a.id === parseInt(id));
        
        if (index !== -1) {
            assignments[index] = {
                ...assignments[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('kairos_assignments', JSON.stringify(assignments));
            return assignments[index];
        }
        
        return null;
    }

    static deleteAssignment(id) {
        const assignments = JSON.parse(localStorage.getItem('kairos_assignments') || '[]');
        const filtered = assignments.filter(a => a.id !== parseInt(id));
        localStorage.setItem('kairos_assignments', JSON.stringify(filtered));
    }

    // STATISTICS
    static getStats() {
        const assignments = this.getAssignments();
        const now = new Date();
        
        const stats = {
            total: assignments.length,
            completed: assignments.filter(a => a.status === 'completed').length,
            pending: assignments.filter(a => a.status === 'pending').length,
            inProgress: assignments.filter(a => a.status === 'in-progress').length,
            dueToday: 0,
            overdue: 0,
            dueThisWeek: 0
        };
        
        assignments.forEach(a => {
            const dueDate = new Date(a.dueDate);
            const daysUntil = getDaysUntil(dueDate);
            
            if (daysUntil < 0) {
                stats.overdue++;
            } else if (daysUntil === 0) {
                stats.dueToday++;
            } else if (daysUntil <= 7) {
                stats.dueThisWeek++;
            }
        });
        
        return stats;
    }

    // CALENDAR EVENTS (for planner)
    static getCalendarEvents() {
        return JSON.parse(localStorage.getItem('kairos_events') || '[]');
    }

    static addCalendarEvent(event) {
        const events = this.getCalendarEvents();
        
        const newEvent = {
            id: events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1,
            createdAt: new Date().toISOString(),
            ...event
        };
        
        events.push(newEvent);
        localStorage.setItem('kairos_events', JSON.stringify(events));
        
        return newEvent;
    }

    static updateCalendarEvent(id, updates) {
        const events = this.getCalendarEvents();
        const index = events.findIndex(e => e.id === parseInt(id));
        
        if (index !== -1) {
            events[index] = {
                ...events[index],
                ...updates
            };
            localStorage.setItem('kairos_events', JSON.stringify(events));
            return events[index];
        }
        
        return null;
    }

    static deleteCalendarEvent(id) {
        const events = this.getCalendarEvents();
        const filtered = events.filter(e => e.id !== parseInt(id));
        localStorage.setItem('kairos_events', JSON.stringify(filtered));
    }

    static getEventsForDate(date) {
        const events = this.getCalendarEvents();
        const dateStr = new Date(date).toISOString().split('T')[0];
        
        return events.filter(e => {
            const eventDate = new Date(e.date).toISOString().split('T')[0];
            return eventDate === dateStr;
        });
    }

    // NOTIFICATIONS
    static getNotifications() {
        return JSON.parse(localStorage.getItem('kairos_notifications') || '[]');
    }

    static addNotification(notification) {
        const notifications = this.getNotifications();
        
        const newNotification = {
            id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
            read: false,
            createdAt: new Date().toISOString(),
            ...notification
        };
        
        notifications.push(newNotification);
        localStorage.setItem('kairos_notifications', JSON.stringify(notifications));
        
        return newNotification;
    }

    static markNotificationAsRead(id) {
        const notifications = this.getNotifications();
        const notification = notifications.find(n => n.id === parseInt(id));
        
        if (notification) {
            notification.read = true;
            localStorage.setItem('kairos_notifications', JSON.stringify(notifications));
        }
    }

    static clearNotifications() {
        localStorage.setItem('kairos_notifications', JSON.stringify([]));
    }

    // SEMESTERS
    static getSemesters() {
        return JSON.parse(localStorage.getItem('kairos_semesters') || '[]');
    }

    static addSemester(semester) {
        const semesters = this.getSemesters();
        
        const newSemester = {
            id: semesters.length > 0 ? Math.max(...semesters.map(s => s.id)) + 1 : 1,
            createdAt: new Date().toISOString(),
            active: true,
            ...semester
        };
        
        // Deactivate previous semesters
        semesters.forEach(s => s.active = false);
        semesters.push(newSemester);
        
        localStorage.setItem('kairos_semesters', JSON.stringify(semesters));
        
        return newSemester;
    }

    static archiveSemester(id) {
        const semesters = this.getSemesters();
        const semester = semesters.find(s => s.id === parseInt(id));
        
        if (semester) {
            semester.archived = true;
            semester.active = false;
            localStorage.setItem('kairos_semesters', JSON.stringify(semesters));
        }
    }

    // SETTINGS
    static getSettings() {
        return JSON.parse(localStorage.getItem('kairos_settings') || {
            theme: 'dark',
            accentColor: '#6C63FF',
            notifications: {
                enabled48h: true,
                enabled24h: true,
                enabled12h: true,
                enabled3h: true,
                enabled1h: true
            },
            emailNotifications: true
        });
    }

    static updateSettings(updates) {
        const settings = this.getSettings();
        const updated = { ...settings, ...updates };
        localStorage.setItem('kairos_settings', JSON.stringify(updated));
        return updated;
    }

    // COURSES - Get courses from assignments (for filters) or from full curriculum database
    static getCourses(filter = {}) {
        // First priority: Get courses from existing assignments
        const assignments = this.getAssignments();
        const assignmentCourses = {};
        
        assignments.forEach(a => {
            if (!assignmentCourses[a.course]) {
                assignmentCourses[a.course] = {
                    code: a.course,
                    total: 0,
                    completed: 0
                };
            }
            assignmentCourses[a.course].total++;
            if (a.status === 'completed') {
                assignmentCourses[a.course].completed++;
            }
        });
        
        // If we have assignments with courses, return those
        if (Object.keys(assignmentCourses).length > 0) {
            return Object.values(assignmentCourses);
        }
        
        // Otherwise fall back to full curriculum
        const allCourses = this.getAllCourses();
        
        if (filter.year) {
            return allCourses.filter(c => c.year === filter.year);
        }
        if (filter.semester) {
            return allCourses.filter(c => c.semester === filter.semester);
        }
        if (filter.year && filter.semester) {
            return allCourses.filter(c => c.year === filter.year && c.semester === filter.semester);
        }
        
        return allCourses;
    

    static getAllCourses() {
        return [
            // YEAR 1 - SEMESTER 1
            { code: 'ENGL157', title: 'Communication Skills I', year: 1, semester: 1, credits: 3 },
            { code: 'ISD151', title: 'Business Mathematics', year: 1, semester: 1, credits: 3 },
            { code: 'ISD155', title: 'ICT in Business', year: 1, semester: 1, credits: 3 },
            { code: 'SOC151', title: 'Introduction to Sociology', year: 1, semester: 1, credits: 3 },
            { code: 'FC181', title: 'French for Communication I', year: 1, semester: 1, credits: 2 },
            { code: 'AFS161', title: 'Ethics in Traditional African Society', year: 1, semester: 1, credits: 3 },
            { code: 'MAS151', title: 'Business in Ghana', year: 1, semester: 1, credits: 3 },
            
            // YEAR 1 - SEMESTER 2
            { code: 'ENGL158', title: 'Communication Skills II', year: 1, semester: 2, credits: 3 },
            { code: 'FC182', title: 'French for Communication II', year: 1, semester: 2, credits: 2 },
            { code: 'AFS162', title: 'Traditional System of Conflict Resolution in Africa', year: 1, semester: 2, credits: 3 },
            { code: 'ISD152', title: 'Business Statistics', year: 1, semester: 2, credits: 3 },
            { code: 'LCT162', title: 'Logic and Critical Thinking', year: 1, semester: 2, credits: 3 },
            { code: 'MAS152', title: 'Business Communication', year: 1, semester: 2, credits: 3 },
            { code: 'PSY152', title: 'Intro to Psychology', year: 1, semester: 2, credits: 3 },
            
            // YEAR 2 - SEMESTER 1
            { code: 'ACF255', title: 'Financial Accounting I', year: 2, semester: 1, credits: 3 },
            { code: 'MAS263', title: 'Introduction to HRM', year: 2, semester: 1, credits: 3 },
            { code: 'ACF265', title: 'Microeconomics I', year: 2, semester: 1, credits: 3 },
            { code: 'MCS267', title: 'Introduction to International Business', year: 2, semester: 1, credits: 3 },
            { code: 'MAS261', title: 'Principles of Management', year: 2, semester: 1, credits: 3 },
            { code: 'ISD251', title: 'Quantitative Methods', year: 2, semester: 1, credits: 3 },
            { code: 'ACF261', title: 'Business Finance', year: 2, semester: 1, credits: 3 },
            
            // YEAR 2 - SEMESTER 2
            { code: 'MAS262', title: 'Corporate Social Responsibility', year: 2, semester: 2, credits: 3 },
            { code: 'MAS264', title: 'Organizational Behavior', year: 2, semester: 2, credits: 3 },
            { code: 'ACF256', title: 'Financial Accounting II', year: 2, semester: 2, credits: 3 },
            { code: 'ISD256', title: 'Management Information Systems', year: 2, semester: 2, credits: 3 },
            { code: 'ACF266', title: 'Macroeconomics II', year: 2, semester: 2, credits: 3 },
            { code: 'MCS272', title: 'Principles of Marketing', year: 2, semester: 2, credits: 3 },
            { code: 'ISD252', title: 'Introduction to Logistics & Supply Chain', year: 2, semester: 2, credits: 3 },
            
            // YEAR 3 - SEMESTER 1
            { code: 'MAS353', title: 'Business Law', year: 3, semester: 1, credits: 3 },
            { code: 'ISD353', title: 'Business Research Methods', year: 3, semester: 1, credits: 3 },
            { code: 'ISD357', title: 'Operations Management', year: 3, semester: 1, credits: 3 },
            { code: 'ISD331', title: 'Introduction to Business Analytics', year: 3, semester: 1, credits: 3 },
            { code: 'ISD356', title: 'Computer Operating System', year: 3, semester: 1, credits: 3 },
            { code: 'ISD355', title: 'Data Management for Business I', year: 3, semester: 1, credits: 3 },
            { code: 'ISD359', title: 'Introduction to Programming', year: 3, semester: 1, credits: 3 },
            
            // YEAR 3 - SEMESTER 2
            { code: 'MAS354', title: 'Company Law', year: 3, semester: 2, credits: 3 },
            { code: 'ISD354', title: 'Database Management For Business', year: 3, semester: 2, credits: 3 },
            { code: 'ISD358', title: 'Networking and Security', year: 3, semester: 2, credits: 3 },
            { code: 'ISD366', title: 'Visual Basic For Business', year: 3, semester: 2, credits: 3 },
            { code: 'ISD368', title: 'Mobile Applications Design', year: 3, semester: 2, credits: 3 },
            { code: 'ISD378', title: 'Information Technology for Business', year: 3, semester: 2, credits: 3 },
            
            // YEAR 4 - SEMESTER 1
            { code: 'MCS451', title: 'Strategic Management & Policy', year: 4, semester: 1, credits: 3 },
            { code: 'ISD477', title: 'Web Application for Business I', year: 4, semester: 1, credits: 3 },
            { code: 'ISD453', title: 'Decision Support Systems', year: 4, semester: 1, credits: 3 },
            { code: 'ISD459', title: 'Information Systems Strategy', year: 4, semester: 1, credits: 3 },
            { code: 'ISD463', title: 'Systems Analysis and Design', year: 4, semester: 1, credits: 3 },
            
            // YEAR 4 - SEMESTER 2
            { code: 'MCS498', title: 'Research Project', year: 4, semester: 2, credits: 6 },
            { code: 'MCS472', title: 'Fundamentals of Entrepreneurship', year: 4, semester: 2, credits: 3 },
            { code: 'ISD455', title: 'Information Technology Innovation In The Digital Age', year: 4, semester: 2, credits: 3 },
            { code: 'ISD470', title: 'E-Business', year: 4, semester: 2, credits: 3 },
            { code: 'ISD472', title: 'Information Systems Ethics', year: 4, semester: 2, credits: 3 }
        ];
    }

    // BULK OPERATIONS
    static clearAllData() {
        localStorage.removeItem('kairos_assignments');
        localStorage.removeItem('kairos_events');
        localStorage.removeItem('kairos_notifications');
        localStorage.removeItem('kairos_semesters');
    }

    static initializeMockData() {
        const mockAssignments = [
            {
                id: 1,
                title: 'Financial Statements Analysis',
                course: 'ACC301',
                dueDate: new Date(Date.now() + 2*24*60*60*1000).toISOString(),
                priority: 'high',
                status: 'in-progress',
                estimatedHours: 5,
                completed: 40,
                notes: 'Focus on IFRS standards and audit procedures'
            },
            {
                id: 2,
                title: 'Strategic Management Project',
                course: 'BUS401',
                dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
                priority: 'medium',
                status: 'pending',
                estimatedHours: 8,
                completed: 0,
                notes: 'Study competitive analysis frameworks'
            },
            {
                id: 3,
                title: 'Marketing Campaign Presentation',
                course: 'MKT201',
                dueDate: new Date(Date.now() + 4*24*60*60*1000).toISOString(),
                priority: 'high',
                status: 'pending',
                estimatedHours: 4,
                completed: 0,
                notes: 'Develop integrated marketing strategy'
            },
            {
                id: 4,
                title: 'Human Resource Policies Case Study',
                course: 'HRM301',
                dueDate: new Date(Date.now() - 1*24*60*60*1000).toISOString(),
                priority: 'high',
                status: 'pending',
                estimatedHours: 3,
                completed: 0,
                notes: 'Analyze HR case study and propose solutions'
            }
        ];

        const mockEvents = [
            {
                id: 1,
                title: 'ACF255 - Financial Accounting Lecture',
                type: 'class',
                date: new Date().toISOString(),
                startTime: '09:00',
                endTime: '10:30'
            },
            {
                id: 2,
                title: 'Study Session - Business Research Methods',
                type: 'study',
                date: new Date(Date.now() + 1*24*60*60*1000).toISOString(),
                startTime: '14:00',
                endTime: '16:00'
            }
        ];

        localStorage.setItem('kairos_assignments', JSON.stringify(mockAssignments));
        localStorage.setItem('kairos_events', JSON.stringify(mockEvents));
    }
}

// Initialize mock data on first visit
window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('kairos_assignments')) {
        KairosStorage.initializeMockData();
    }
});
