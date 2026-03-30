/* ===========================
   CWA CALCULATOR FUNCTIONALITY (KNUST)
   =========================== */

let courses = JSON.parse(localStorage.getItem('kairos_courses') || '[]');
let targetCWA = parseFloat(localStorage.getItem('kairos_target_cwa') || '70.0');

// Function to convert score (0-100) to grade letter
function scoreToGrade(score) {
    if (score >= 70) return 'A';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    if (score >= 45) return 'D';
    if (score >= 40) return 'D';
    return 'F';
}

// Function to convert CWA percentage to GPA (4.0 scale)
function cwaToGPA(cwa) {
    if (cwa >= 70) return { gpa: 3.7 + ((cwa - 70) / 30) * 0.3, grade: 'A', range: '3.7 – 4.0' };
    if (cwa >= 60) return { gpa: 3.0 + ((cwa - 60) / 9) * 0.6, grade: 'B+/B', range: '3.0 – 3.6' };
    if (cwa >= 50) return { gpa: 2.5 + ((cwa - 50) / 9) * 0.4, grade: 'B-/C+', range: '2.5 – 2.9' };
    if (cwa >= 45) return { gpa: 2.0 + ((cwa - 45) / 4) * 0.4, grade: 'C/D', range: '2.0 – 2.4' };
    if (cwa >= 40) return { gpa: 1.0 + ((cwa - 40) / 4) * 0.9, grade: 'D', range: '1.0 – 1.9' };
    return { gpa: 0.0, grade: 'F', range: '0.0' };
}

// Function to get degree classification based on CWA
function getClassification(cwa) {
    if (cwa >= 70) return 'First Class';
    if (cwa >= 60) return 'Second Class (Upper)';
    if (cwa >= 50) return 'Second Class (Lower)';
    if (cwa >= 45) return 'Third Class';
    if (cwa >= 40) return 'Pass';
    return 'Fail';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    document.getElementById('targetGPA').value = targetCWA;
    renderCourses();
    calculateGPA();
    
    // Listen for target CWA changes
    document.getElementById('targetGPA').addEventListener('change', function() {
        targetCWA = parseFloat(this.value) || 70.0;
        localStorage.setItem('kairos_target_cwa', targetCWA);
        calculateGPA();
    });
});

// Add course
function addCourse() {
    const name = document.getElementById('courseName').value.trim();
    const score = parseFloat(document.getElementById('courseScore').value);
    const credits = parseInt(document.getElementById('courseCredits').value);
    
    if (!name || isNaN(score) || isNaN(credits) || credits < 1 || score < 0 || score > 100) {
        showToast('Please fill in all fields correctly (Score: 0-100)', 'error');
        return;
    }
    
    const course = {
        id: Date.now(),
        name: name,
        score: score,
        credits: credits
    };
    
    courses.push(course);
    localStorage.setItem('kairos_courses', JSON.stringify(courses));
    
    // Clear inputs
    document.getElementById('courseName').value = '';
    document.getElementById('courseScore').value = '';
    document.getElementById('courseCredits').value = '';
    
    renderCourses();
    calculateGPA();
    showToast(`Added "${name}" with score ${score}%`, 'success');
}

// Delete course
function deleteCourse(courseId) {
    courses = courses.filter(c => c.id !== courseId);
    localStorage.setItem('kairos_courses', JSON.stringify(courses));
    renderCourses();
    calculateGPA();
    showToast('Course removed', 'info');
}

// Render courses table
function renderCourses() {
    const tbody = document.getElementById('coursesList');
    const emptyState = document.getElementById('emptyState');
    
    if (courses.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    tbody.innerHTML = courses.map(course => {
        const grade = scoreToGrade(course.score);
        const points = (course.score * course.credits).toFixed(2);
        return `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: var(--spacing-md);">${course.name}</td>
                <td style="padding: var(--spacing-md); text-align: center; font-weight: 600;">${grade} (${course.score}%)</td>
                <td style="padding: var(--spacing-md); text-align: center;">${course.credits}</td>
                <td style="padding: var(--spacing-md); text-align: center; color: var(--primary); font-weight: 600;">${points}</td>
                <td style="padding: var(--spacing-md); text-align: center;">
                    <button class="btn-icon" onclick="deleteCourse(${course.id})" title="Delete">
                        <i class="fas fa-trash" style="color: var(--danger);"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Calculate CWA and GPA
function calculateGPA() {
    if (courses.length === 0) {
        document.getElementById('currentGPA').textContent = '0.00';
        document.getElementById('equivalentGPA').textContent = '0.00';
        document.getElementById('cwaClassification').textContent = 'No courses added';
        document.getElementById('gpaGradeLabel').textContent = '—';
        return;
    }
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    courses.forEach(course => {
        totalPoints += course.score * course.credits;
        totalCredits += course.credits;
    });
    
    const cwa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
    const classification = getClassification(cwa);
    const gpaConversion = cwaToGPA(cwa);
    
    document.getElementById('currentGPA').textContent = cwa.toFixed(2);
    document.getElementById('equivalentGPA').textContent = gpaConversion.gpa.toFixed(2);
    document.getElementById('cwaClassification').textContent = classification;
    document.getElementById('gpaGradeLabel').textContent = gpaConversion.grade;
}

// Clear all courses
function clearCalculator() {
    createConfirmDialog(
        'Clear All Courses?',
        'This will remove all courses from your CWA calculator. This action cannot be undone.',
        () => {
            courses = [];
            localStorage.removeItem('kairos_courses');
            renderCourses();
            calculateGPA();
            showToast('All courses cleared', 'info');
        }
    );
}

// Export CWA results
function exportCWA() {
    if (courses.length === 0) {
        showToast('Add courses first to export', 'warning');
        return;
    }
    
    const currentCWAElement = document.getElementById('currentGPA').textContent;
    const currentCWA = parseFloat(currentCWAElement);
    const equivalentGPA = parseFloat(document.getElementById('equivalentGPA').textContent);
    const classification = getClassification(currentCWA);
    const gpaConversion = cwaToGPA(currentCWA);
    
    // Create CSV
    let csv = 'Kairos CWA Calculator Report (KNUST)\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    csv += 'Course,Score,Grade,Credits,Grade Points\n';
    
    courses.forEach(course => {
        const points = (course.score * course.credits).toFixed(2);
        const grade = scoreToGrade(course.score);
        csv += `"${course.name}",${course.score}%,${grade},${course.credits},${points}\n`;
    });
    
    csv += `\nGrade Summary\n`;
    csv += `Current CWA,${currentCWA.toFixed(2)}%\n`;
    csv += `Equivalent GPA (4.0),${equivalentGPA.toFixed(2)}\n`;
    csv += `US Grade Equivalent,${gpaConversion.grade}\n`;
    csv += `Degree Classification,${classification}\n`;
    csv += `Target CWA,${targetCWA.toFixed(2)}%\n`;
    csv += `Remaining to Target,${Math.max(0, (targetCWA - currentCWA)).toFixed(2)}%\n`;
    
    // Download
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `cwa-report-${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    showToast('CWA report exported as CSV', 'success');
}
