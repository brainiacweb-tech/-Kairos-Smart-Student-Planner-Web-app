/* ===========================
   ANALYTICS PAGE FUNCTIONALITY
   =========================== */

let charts = {};

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    updateStats();
    renderCharts();
    renderHeatmap();
    renderGantt();
});

function updateStats() {
    const stats = KairosStorage.getStats();
    const assignments = KairosStorage.getAssignments();
    
    document.getElementById('totalCompleted').textContent = stats.completed;
    document.getElementById('completionRate').textContent = assignments.length > 0 ? 
        Math.round((stats.completed / assignments.length) * 100) + '%' : '0%';
    document.getElementById('onTimeRate').textContent = '92%';
    document.getElementById('avgHours').textContent = Math.round(assignments.reduce((sum, a) => sum + a.estimatedHours, 0) / 4) + 'h';
}

function renderCharts() {
    const stats = KairosStorage.getStats();
    const courses = KairosStorage.getCourses();
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#E0E0E0' : '#1A1A2E';
    const gridColor = isDark ? '#2A2A3E' : '#E5E7EB';
    
    // Status Distribution (Doughnut)
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        charts.status = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'In Progress', 'Pending'],
                datasets: [{
                    data: [stats.completed, stats.inProgress, stats.pending],
                    backgroundColor: ['#2ED573', '#6C63FF', '#FFA502'],
                    borderColor: isDark ? '#1A1A2E' : '#FFFFFF',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: textColor }
                    }
                }
            }
        });
    }
    
    // Workload by Course (Bar)
    const workloadCtx = document.getElementById('workloadChart');
    if (workloadCtx) {
        charts.workload = new Chart(workloadCtx, {
            type: 'bar',
            data: {
                labels: courses.map(c => c.code),
                datasets: [{
                    label: 'Assignments',
                    data: courses.map(c => c.total),
                    backgroundColor: '#6C63FF',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: textColor } }
                },
                scales: {
                    y: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { display: false }
                    }
                }
            }
        });
    }
    
    // Weekly Trend (Line)
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        const weekData = [2, 4, 3, 5, 6, 7, 8];
        charts.trend = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Completed',
                    data: weekData,
                    borderColor: '#6C63FF',
                    backgroundColor: 'rgba(108, 99, 255, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#6C63FF',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: textColor } }
                },
                scales: {
                    y: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }
}

function renderHeatmap() {
    const heatmap = document.getElementById('heatmapGrid');
    const assignments = KairosStorage.getAssignments();
    
    // Create 30-day heatmap
    for (let i = 1; i <= 30; i++) {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        
        const today = new Date();
        const date = new Date(today.getFullYear(), today.getMonth(), i);
        
        if (i <= new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()) {
            const assignCount = assignments.filter(a => {
                const dueDate = new Date(a.dueDate);
                return dueDate.getDate() === i && dueDate.getMonth() === today.getMonth();
            }).length;
            
            if (assignCount === 0) {
                cell.classList.add('light');
            } else if (assignCount === 1) {
                cell.classList.add('medium');
            } else if (assignCount === 2) {
                cell.classList.add('heavy');
            } else {
                cell.classList.add('very-heavy');
            }
            
            cell.textContent = i;
            if (i <= new Date(today).getDate()) {
                cell.style.opacity = '0.7';
            }
        }
        
        heatmap.appendChild(cell);
    }
}

function renderGantt() {
    const assignments = KairosStorage.getAssignments()
        .filter(a => a.status !== 'completed')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);
    
    const timeline = document.getElementById('ganttTimeline');
    timeline.innerHTML = assignments.map((a, idx) => {
        const now = new Date();
        const dueDate = new Date(a.dueDate);
        const daysDiff = Math.max(1, Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)));
        const width = Math.min(100, daysDiff * 5);
        
        return `
            <div class="gantt-bar">
                <div class="gantt-bar-label">${a.course}</div>
                <div class="gantt-bar-container">
                    <div class="gantt-bar-fill" style="width: ${width}%">${a.title.substring(0, 15)}</div>
                </div>
                <div class="gantt-bar-date">${formatDate(a.dueDate)}</div>
            </div>
        `;
    }).join('');
}

function exportPDF() {
    showToast('PDF export feature coming soon!', 'info');
}

function exportCSV() {
    const assignments = KairosStorage.getAssignments();
    let csv = 'Title,Course,Due Date,Priority,Status,Completed\n';
    
    assignments.forEach(a => {
        csv += `"${a.title}","${a.course}","${formatDate(a.dueDate)}","${a.priority}","${a.status}",${a.completed}%\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kairos-assignments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showToast('CSV exported successfully!', 'success');
}
