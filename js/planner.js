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
    
    // Time slots
    HOURS.forEach((hour, hourIdx) => {
        html += `<div class="timetable-time-slot">${hour}</div>`;
        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
            const hasEvent = events.some(e => e.hourIndex === hourIdx && e.dayIndex === dayIdx);
            html += `<div class="timetable-cell ${hasEvent ? 'has-event' : ''}" ondrop="dropEvent(event)" ondragover="allowDrop(event)"></div>`;
        }
    });
    
    grid.innerHTML = html;
    
    // Add events to grid
    events.forEach(event => {
        const cells = grid.querySelectorAll('.timetable-cell');
        const cellIndex = (event.hourIndex * 7) + event.dayIndex + 7; // +7 for header row
        if (cells[cellIndex]) {
            const eventEl = document.createElement('div');
            eventEl.className = `timetable-event ${event.type}`;
            eventEl.textContent = event.title.substring(0, 15);
            eventEl.draggable = true;
            eventEl.onclick = () => showEventDetails(event);
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

function generateStudyPlan() {
    const assignments = KairosStorage.getAssignments().filter(a => a.status !== 'completed');
    
    if (assignments.length === 0) {
        showToast('No pending assignments to schedule!', 'info');
        return;
    }
    
    assignments.slice(0, 3).forEach(assignment => {
        const event = {
            title: `Study: ${assignment.course}`,
            type: 'study',
            dayIndex: Math.floor(Math.random() * 7),
            hourIndex: Math.floor(Math.random() * (HOURS.length - 2)) + 9 // 9AM onwards
        };
        
        KairosStorage.addCalendarEvent(event);
    });
    
    showToast('Study plan generated! Check your calendar.', 'success');
    renderTimetable();
}

function addTimeSlot() {
    showToast('Click on a time slot to add an event', 'info');
}

function showEventDetails(event) {
    showToast(`${event.title} scheduled`, 'info');
}

/* ===========================
   PLANNER SAVE/LOAD FUNCTIONS
   =========================== */

function savePlannerModal() {
    document.getElementById('plannerName').value = '';
    document.getElementById('plannerDescription').value = '';
    openDrawer('savePlannerDrawer');
}

function handleSavePlanner(event) {
    event.preventDefault();
    
    const plannerName = document.getElementById('plannerName').value.trim();
    const plannerDescription = document.getElementById('plannerDescription').value.trim();
    
    if (!plannerName) {
        showToast('Please enter a planner name', 'warning');
        return;
    }
    
    const events = KairosStorage.getCalendarEvents();
    const planner = {
        id: 'planner_' + Date.now(),
        name: plannerName,
        description: plannerDescription,
        events: JSON.parse(JSON.stringify(events)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    let planners = JSON.parse(localStorage.getItem('kairos_planners') || '[]');
    planners.push(planner);
    localStorage.setItem('kairos_planners', JSON.stringify(planners));
    
    showToast(`Planner "${plannerName}" saved successfully!`, 'success');
    closeDrawer('savePlannerDrawer');
}

function openSavedPlanners() {
    const planners = JSON.parse(localStorage.getItem('kairos_planners') || '[]');
    const plannersList = document.getElementById('savedPlannersList');
    
    if (planners.length === 0) {
        plannersList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No saved planners yet. Create one to get started!</div>';
    } else {
        plannersList.innerHTML = '<div class="saved-planners-grid">' + 
            planners.map(planner => `
                <div class="planner-card">
                    <div class="planner-card-header">
                        <h3 class="planner-card-title">${planner.name}</h3>
                        <button class="btn-icon" onclick="deletePlanner('${planner.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="planner-card-description">${planner.description || 'No description'}</div>
                    <div class="planner-card-meta">
                        <small>${planner.events ? planner.events.length : 0} events</small>
                        <small>${new Date(planner.createdAt).toLocaleDateString()}</small>
                    </div>
                    <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="loadPlanner('${planner.id}')">
                        <i class="fas fa-download"></i> Load
                    </button>
                </div>
            `).join('') + 
            '</div>';
    }
    
    openDrawer('loadPlannerDrawer');
}

function loadPlanner(plannerId) {
    const planners = JSON.parse(localStorage.getItem('kairos_planners') || '[]');
    const planner = planners.find(p => p.id === plannerId);
    
    if (!planner) {
        showToast('Planner not found', 'error');
        return;
    }
    
    localStorage.setItem('kairos_calendar_events', JSON.stringify(planner.events || []));
    
    showToast(`Planner "${planner.name}" loaded!`, 'success');
    closeDrawer('loadPlannerDrawer');
    
    renderTimetable();
}

function deletePlanner(plannerId) {
    if (confirm('Are you sure you want to delete this planner?')) {
        let planners = JSON.parse(localStorage.getItem('kairos_planners') || '[]');
        planners = planners.filter(p => p.id !== plannerId);
        localStorage.setItem('kairos_planners', JSON.stringify(planners));
        
        showToast('Planner deleted', 'info');
        openSavedPlanners();
    }
}

function openDrawer(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (drawer) {
        drawer.classList.add('active');
    }
}

function closeDrawer(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (drawer) {
        drawer.classList.remove('active');
    }
}
