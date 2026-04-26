/* ===========================
   PLANNER PAGE FUNCTIONALITY
   =========================== */

const HOURS = ['6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    renderTimetable();
});

function renderTimetable() {
    const grid = document.getElementById('timetableGrid');
    const events = KairosStorage.getCalendarEvents();
    
    let html = '';
    
    // Header row with days
    html += '<div class="timetable-header"></div>'; // Empty corner
    for (let i = 0; i < 7; i++) {
        const today = new Date();
        const date = new Date(today);
        date.setDate(today.getDate() - today.getDay() + i);
        html += `<div class="timetable-day-header">
                    <span class="timetable-day-name">${DAYS[i]}</span>
                    <span class="timetable-day-date">${date.getDate()}</span>
                 </div>`;
    }
    
    // Time slots — clicking an empty cell pre-fills time & day
    HOURS.forEach((hour, hourIdx) => {
        html += `<div class="timetable-time-slot">${hour}</div>`;
        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
            const hasEvent = events.some(e => e.hourIndex === hourIdx && e.dayIndex === dayIdx);
            html += `<div class="timetable-cell ${hasEvent ? 'has-event' : ''}" ondrop="dropEvent(event)" ondragover="allowDrop(event)" onclick="openAddEventModalAt(${dayIdx},${hourIdx})"></div>`;
        }
    });
    
    grid.innerHTML = html;
    
    // Add events to grid with delete capability
    events.forEach((event, index) => {
        const cells = grid.querySelectorAll('.timetable-cell');
        const cellIndex = (event.hourIndex * 7) + event.dayIndex + 7; // +7 for header row
        if (cells[cellIndex]) {
            const eventEl = document.createElement('div');
            eventEl.className = `timetable-event ${event.type}`;
            const timeLbl = event.startTime ? `<small style="font-size:0.6em;display:block;opacity:0.85;margin-top:1px">${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}</small>` : '';
            eventEl.innerHTML = `<span>${(event.title || '').substring(0, 14)}</span>${timeLbl}<button class="event-delete-btn" onclick="deleteEvent(${index}, event)"><i class="fas fa-trash-alt"></i></button>`;
            eventEl.style.cursor = 'pointer';
            cells[cellIndex].appendChild(eventEl);
        }
    });
}

function allowDrop(ev) {
    ev.preventDefault();
}

function dropEvent(ev) {
    ev.preventDefault();
}

/* ===========================
   EVENT MANAGEMENT FUNCTIONS
   =========================== */

function openAddEventModal() {
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventType').value = 'study';
    document.getElementById('eventDay').value = '1';
    document.getElementById('eventStartTime').value = '09:00';
    document.getElementById('eventEndTime').value = '10:00';
    openDrawer('addEventDrawer');
}

function openAddEventModalAt(dayIdx, hourIdx) {
    const actualHour = hourIdx + 6;
    const pad = n => String(n).padStart(2, '0');
    const startTime = pad(actualHour) + ':00';
    const endTime   = pad(Math.min(23, actualHour + 1)) + ':00';
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventType').value = 'study';
    document.getElementById('eventDay').value = String(dayIdx);
    document.getElementById('eventStartTime').value = startTime;
    document.getElementById('eventEndTime').value = endTime;
    openDrawer('addEventDrawer');
}

function handleAddEvent(e) {
    e.preventDefault();

    const title = document.getElementById('eventTitle').value.trim();
    const type = document.getElementById('eventType').value;
    const dayIndex = parseInt(document.getElementById('eventDay').value);
    const startTime = document.getElementById('eventStartTime').value || '09:00';
    const endTime = document.getElementById('eventEndTime').value || '';
    const startHour = parseInt(startTime.split(':')[0]);
    const hourIndex = Math.max(0, Math.min(16, startHour - 6));

    if (!title) {
        showToast('Please enter an event title', 'warning');
        return;
    }

    const event = {
        title: title,
        type: type,
        dayIndex: dayIndex,
        hourIndex: hourIndex,
        startTime: startTime,
        endTime: endTime,
        id: 'event_' + Date.now()
    };
    
    KairosStorage.addCalendarEvent(event);
    showToast(`"${title}" added to your schedule!`, 'success');
    closeDrawer('addEventDrawer');
    renderTimetable();
}

function deleteEvent(index, e) {
    if (e) {
        e.stopPropagation();
    }

    const events = KairosStorage.getCalendarEvents();
    if (events[index]) {
        const eventTitle = events[index].title;
        KairosStorage.deleteCalendarEvent(events[index].id);
        showToast(`"${eventTitle}" removed from schedule`, 'info');
        renderTimetable();
    }
}

function clearWeeklyPlanner() {
    if (confirm('Are you sure you want to clear all events from this week?')) {
        localStorage.setItem('kairos_events', JSON.stringify([]));
        showToast('Weekly schedule cleared!', 'info');
        renderTimetable();
    }
}

/* ===========================
   SCHEDULE MANAGEMENT FUNCTIONS
   =========================== */

function openManageSchedules() {
    loadSavedSchedules();
    openDrawer('manageSchedulesDrawer');
}

function saveCurrentSchedule() {
    const scheduleName = prompt('Enter a name for this schedule:', `Schedule ${new Date().toLocaleDateString()}`);
    
    if (!scheduleName || scheduleName.trim() === '') {
        return;
    }
    
    const events = KairosStorage.getCalendarEvents();
    const schedule = {
        id: 'schedule_' + Date.now(),
        name: scheduleName.trim(),
        events: JSON.parse(JSON.stringify(events)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    let schedules = JSON.parse(localStorage.getItem('kairos_schedules') || '[]');
    schedules.push(schedule);
    localStorage.setItem('kairos_schedules', JSON.stringify(schedules));
    
    showToast(`Schedule "${scheduleName}" saved!`, 'success');
    loadSavedSchedules();
}

function loadSavedSchedules() {
    const schedules = JSON.parse(localStorage.getItem('kairos_schedules') || '[]');
    const schedulesList = document.getElementById('savedSchedulesList');
    
    if (schedules.length === 0) {
        schedulesList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No saved schedules yet. Create one to get started!</div>';
    } else {
        schedulesList.innerHTML = schedules.map((schedule, idx) => `
            <div class="schedule-item">
                <div class="schedule-item-info">
                    <h4 class="schedule-item-name">${schedule.name}</h4>
                    <small class="schedule-item-meta">${schedule.events ? schedule.events.length : 0} events • ${new Date(schedule.createdAt).toLocaleDateString()}</small>
                </div>
                <div class="schedule-item-actions">
                    <button class="btn btn-small btn-primary" onclick="loadSchedule('${schedule.id}')"><i class="fas fa-download"></i> Load</button>
                    <button class="btn btn-small btn-secondary" onclick="deleteSchedule('${schedule.id}')"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `).join('');
    }
}

function loadSchedule(scheduleId) {
    const schedules = JSON.parse(localStorage.getItem('kairos_schedules') || '[]');
    const schedule = schedules.find(s => s.id === scheduleId);
    
    if (!schedule) {
        showToast('Schedule not found', 'error');
        return;
    }
    
    localStorage.setItem('kairos_events', JSON.stringify(schedule.events || []));
    showToast(`Loaded "${schedule.name}"!`, 'success');
    closeDrawer('manageSchedulesDrawer');
    renderTimetable();
}

function deleteSchedule(scheduleId) {
    if (confirm('Delete this saved schedule?')) {
        let schedules = JSON.parse(localStorage.getItem('kairos_schedules') || '[]');
        const schedule = schedules.find(s => s.id === scheduleId);
        schedules = schedules.filter(s => s.id !== scheduleId);
        localStorage.setItem('kairos_schedules', JSON.stringify(schedules));
        showToast(`"${schedule?.name}" deleted!`, 'info');
        loadSavedSchedules();
    }
}

