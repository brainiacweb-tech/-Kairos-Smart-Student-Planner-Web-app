/* ===========================
   ASSIGNMENTS PAGE FUNCTIONALITY
   =========================== */

let currentView = 'list';
let filteredAssignments = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    populateFilters();
    applyFilters();
});

function openAddModal() {
    openDrawer('addAssignmentDrawer');
    document.getElementById('assignmentForm').reset();
    document.getElementById('assignPriority').value = 'low';
}

function setPriority(level) {
    document.getElementById('assignPriority').value = level;
    document.querySelectorAll('.priority-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function updateHoursDisplay() {
    const hours = document.getElementById('assignHours').value;
    document.getElementById('hoursValue').textContent = hours;
    document.getElementById('hoursDisplay').textContent = hours + 'h';
}

function handleAddAssignment(e) {
    e.preventDefault();
    
    const assignment = {
        title: document.getElementById('assignTitle').value,
        course: document.getElementById('assignCourse').value,
        dueDate: document.getElementById('assignDueDate').value,
        priority: document.getElementById('assignPriority').value,
        status: document.getElementById('assignStatus').value,
        estimatedHours: parseFloat(document.getElementById('assignHours').value),
        notes: document.getElementById('assignNotes').value,
        completed: document.getElementById('assignStatus').value === 'completed' ? 100 : 0
    };
    
    KairosStorage.addAssignment(assignment);
    showToast('Assignment added successfully!', 'success');
    closeDrawer('addAssignmentDrawer');
    applyFilters();
    populateFilters();
}

function populateFilters() {
    const courses = KairosStorage.getCourses();
    const courseFilter = document.getElementById('courseFilter');
    
    courseFilter.innerHTML = '<option value="">All Courses</option>';
    courses.forEach(course => {
        courseFilter.innerHTML += `<option value="${course.code}">${KairosStorage.getCourseDisplay(course.code)}</option>`;
    });
}

function applyFilters() {
    const search = document.getElementById('searchInput').value;
    const course = document.getElementById('courseFilter').value;
    const priority = document.getElementById('priorityFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    filteredAssignments = KairosStorage.getAssignments({
        search: search,
        course: course,
        priority: priority,
        status: status
    });
    
    renderAssignments();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('courseFilter').value = '';
    document.getElementById('priorityFilter').value = '';
    document.getElementById('statusFilter').value = '';
    applyFilters();
}

function setView(view) {
    currentView = view;
    document.querySelectorAll('.view-toggle button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderAssignments();
}

function renderAssignments() {
    const container = document.getElementById('assignmentsContainer');
    
    if (filteredAssignments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3 class="empty-title">No assignments found</h3>
                <p class="empty-message">Try adjusting your filters or add a new assignment to get started.</p>
                <button class="btn btn-primary" onclick="openAddModal()">
                    <i class="fas fa-plus"></i> Add Assignment
                </button>
            </div>
        `;
        return;
    }
    
    if (currentView === 'list') {
        container.className = 'assignments-list';
        container.innerHTML = filteredAssignments.map(a => renderListCard(a)).join('');
    } else {
        container.className = 'assignments-grid';
        container.innerHTML = filteredAssignments.map(a => renderGridCard(a)).join('');
    }
}

function renderListCard(assignment) {
    const daysUntil = getDaysUntil(assignment.dueDate);
    const statusColor = assignment.status === 'completed' ? 'completed' : 
                       assignment.status === 'in-progress' ? 'in-progress' : 'pending';
    
    return `
        <div class="assignment-card">
            <div class="assignment-card-header">
                <div class="assignment-card-info">
                    <div class="assignment-card-title">${assignment.title}</div>
                    <div class="assignment-meta">
                        <span><i class="fas fa-book"></i> ${KairosStorage.getCourseDisplay(assignment.course)}</span>
                        <span><i class="fas fa-clock"></i> ${formatDate(assignment.dueDate)}</span>
                        <span><i class="fas fa-hourglass-half"></i> ${assignment.estimatedHours}h</span>
                    </div>
                    <div class="assignment-badges">
                        <span class="badge ${assignment.priority}">${assignment.priority}</span>
                        <span class="status-badge ${statusColor}"><i class="fas fa-${getStatusIcon(assignment.status)}"></i> ${capitalizeFirst(assignment.status)}</span>
                    </div>
                </div>
            </div>
            <div class="assignment-card-body">
                <div class="assignment-detail">
                    <div class="detail-label">Progress</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${assignment.completed}%"></div>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: var(--spacing-xs);">${assignment.completed}% Complete</div>
                </div>
                ${assignment.notes ? `<div class="assignment-notes">${assignment.notes}</div>` : ''}
            </div>
            <div class="assignment-card-footer">
                <div class="assignment-status">
                    <input type="checkbox" class="assignment-checkbox" ${assignment.status === 'completed' ? 'checked' : ''} onchange="toggleComplete(${assignment.id})">
                    <span>Mark as done</span>
                </div>
                <div class="assignment-actions">
                    <button class="btn-icon" onclick="editAssignmentItem(${assignment.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteAssignmentItem(${assignment.id})" title="Delete" style="color: var(--danger);">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderGridCard(assignment) {
    const statusColor = assignment.status === 'completed' ? 'completed' : 
                       assignment.status === 'in-progress' ? 'in-progress' : 'pending';
    
    return `
        <div class="assignment-grid-card">
            <div class="grid-card-header">
                <div class="grid-card-title">${assignment.title}</div>
                <div class="grid-card-actions">
                    <button class="btn-icon" onclick="editAssignmentItem(${assignment.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" onclick="deleteAssignmentItem(${assignment.id})" style="color: var(--danger);"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">${KairosStorage.getCourseDisplay(assignment.course)}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);"><i class="fas fa-calendar"></i> ${formatDate(assignment.dueDate)}</div>
            <div style="margin: var(--spacing-md) 0;">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${assignment.completed}%"></div>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: var(--spacing-xs);">${assignment.completed}%</div>
            </div>
            <div style="display: flex; gap: var(--spacing-sm);">
                <span class="badge ${assignment.priority}">${assignment.priority}</span>
                <span class="status-badge ${statusColor}">${capitalizeFirst(assignment.status)}</span>
            </div>
        </div>
    `;
}

function toggleComplete(id) {
    const assignment = KairosStorage.getAssignmentById(id);
    const newStatus = assignment.status === 'completed' ? 'pending' : 'completed';
    const newCompleted = newStatus === 'completed' ? 100 : 0;
    
    KairosStorage.updateAssignment(id, {
        status: newStatus,
        completed: newCompleted
    });
    
    showToast(`Assignment ${newStatus === 'completed' ? 'completed' : 'marked as pending'}!`, 'success');
    applyFilters();
}

function deleteAssignmentItem(id) {
    createConfirmDialog(
        'Delete Assignment',
        'Are you sure you want to delete this assignment? This cannot be undone.',
        () => {
            KairosStorage.deleteAssignment(id);
            showToast('Assignment deleted!', 'success');
            applyFilters();
            populateFilters();
        }
    );
}

function editAssignmentItem(id) {
    showToast('Edit feature coming soon! For now, delete and re-add with new details.', 'info');
}

function getStatusIcon(status) {
    const icons = {
        'pending': 'clock',
        'in-progress': 'hourglass-half',
        'completed': 'check-circle'
    };
    return icons[status] || 'circle';
}
