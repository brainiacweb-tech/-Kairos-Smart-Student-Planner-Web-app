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

    static getCourses() {
        const assignments = this.getAssignments();
        const courses = {};
        
        assignments.forEach(a => {
            if (!courses[a.course]) {
                courses[a.course] = {
                    code: a.course,
                    total: 0,
                    completed: 0
                };
            }
            courses[a.course].total++;
            if (a.status === 'completed') {
                courses[a.course].completed++;
            }
        });
        
        return Object.values(courses);
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
                title: 'Business Administration (Accounting)',
                course: 'BUS101',
                dueDate: new Date(Date.now() + 2*24*60*60*1000).toISOString(),
                priority: 'high',
                status: 'in-progress',
                estimatedHours: 5,
                completed: 40,
                notes: 'BSc Business Administration (Accounting) - Financial reporting assignment'
            },
            {
                id: 2,
                title: 'Business Administration (Banking & Finance)',
                course: 'BUS102',
                dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
                priority: 'medium',
                status: 'pending',
                estimatedHours: 8,
                completed: 0,
                notes: 'BSc Business Administration (Banking & Finance) - Study chapters 5-8'
            },
            {
                id: 3,
                title: 'Business Administration (Marketing)',
                course: 'BUS103',
                dueDate: new Date(Date.now() + 4*24*60*60*1000).toISOString(),
                priority: 'high',
                status: 'pending',
                estimatedHours: 4,
                completed: 0,
                notes: 'BSc Business Administration (Marketing) - Analyze brand positioning'
            },
            {
                id: 4,
                title: 'Business Administration (International Business)',
                course: 'BUS104',
                dueDate: new Date(Date.now() - 1*24*60*60*1000).toISOString(),
                priority: 'high',
                status: 'pending',
                estimatedHours: 3,
                completed: 0,
                notes: 'BSc Business Administration (International Business) - Overdue project submission'
            },
            {
                id: 5,
                title: 'Business Administration (Human Resource Management)',
                course: 'BUS105',
                dueDate: new Date(Date.now() + 10*24*60*60*1000).toISOString(),
                priority: 'low',
                status: 'completed',
                estimatedHours: 2,
                completed: 100,
                notes: 'BSc Business Administration (Human Resource Management) - Submitted'
            }
        ];

        const mockEvents = [
            {
                id: 1,
                title: 'CS101 Lecture',
                type: 'class',
                date: new Date().toISOString(),
                startTime: '09:00',
                endTime: '10:30'
            },
            {
                id: 2,
                title: 'Study Session - Data Structures',
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
