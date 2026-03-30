/* ===========================
   CWA CALCULATOR FUNCTIONALITY (KNUST)
   =========================== */

let courses = JSON.parse(localStorage.getItem('kairos_courses') || '[]');
let targetCWA = parseFloat(localStorage.getItem('kairos_target_cwa') || '70.0');

// Function to convert score (0-100) to CWA grade letter
function scoreToCWAGrade(score) {
    if (score >= 70) return 'A';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}

// Function to get CWA grade description
function getCWADescription(score) {
    if (score >= 70) return 'Excellent';
    if (score >= 60) return 'Very Good';
    if (score >= 50) return 'Good';
    if (score >= 40) return 'Satisfactory/Pass';
    return 'Fail';
}

// Function to convert score to GPA (4.0 scale) with detailed mapping
function scoreToGPA(score) {
    if (score >= 80) return { gpa: 4.0, grade: 'A', description: 'Excellent' };
    if (score >= 75) return { gpa: 3.5, grade: 'B+', description: 'Very Good' };
    if (score >= 70) return { gpa: 3.0, grade: 'B', description: 'Good' };
    if (score >= 65) return { gpa: 2.5, grade: 'C+', description: 'Fairly Good' };
    if (score >= 60) return { gpa: 2.0, grade: 'C', description: 'Fair' };
    if (score >= 55) return { gpa: 1.5, grade: 'D+', description: 'Barely Satisfactory' };
    if (score >= 50) return { gpa: 1.0, grade: 'D', description: 'Weak Pass' };
    return { gpa: 0.0, grade: 'E/F', description: 'Fail' };
}

// Function to get degree classification based on FGPA
function getClassification(fgpa) {
    if (fgpa >= 3.60) return 'First Class';
    if (fgpa >= 3.00) return 'Second Class (Upper)';
    if (fgpa >= 2.50) return 'Second Class (Lower)';
    if (fgpa >= 2.00) return 'Third Class';
    if (fgpa >= 1.00) return 'Pass';
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
        const cwaGrade = scoreToCWAGrade(course.score);
        const gpaData = scoreToGPA(course.score);
        const points = (course.score * course.credits).toFixed(2);
        return `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: var(--spacing-md);">${course.name}</td>
                <td style="padding: var(--spacing-md); text-align: center; font-weight: 600;">${cwaGrade} (${course.score}%)</td>
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
        document.getElementById('cwaGrade').textContent = 'No courses added';
        document.getElementById('degreeClass').textContent = '—';
        return;
    }
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    courses.forEach(course => {
        totalPoints += course.score * course.credits;
        totalCredits += course.credits;
    });
    
    const cwa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
    const cwaGrade = scoreToCWAGrade(cwa);
    const cwaDescription = getCWADescription(cwa);
    const gpaData = scoreToGPA(cwa);
    const degreeClass = getClassification(gpaData.gpa);
    
    document.getElementById('currentGPA').textContent = cwa.toFixed(2);
    document.getElementById('equivalentGPA').textContent = gpaData.gpa.toFixed(2);
    document.getElementById('cwaGrade').textContent = `${cwaGrade} - ${cwaDescription}`;
    document.getElementById('degreeClass').textContent = degreeClass;
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
    const cwaGrade = document.getElementById('cwaGrade').textContent;
    const degreeClass = document.getElementById('degreeClass').textContent;
    
    // Create CSV
    let csv = 'Kairos CWA Calculator Report (KNUST)\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    csv += 'Course,Score,CWA Grade,Credits,Grade Points\n';
    
    courses.forEach(course => {
        const points = (course.score * course.credits).toFixed(2);
        const cwaGrade = scoreToCWAGrade(course.score);
        csv += `"${course.name}",${course.score}%,${cwaGrade},${course.credits},${points}\n`;
    });
    
    csv += `\nGrade Summary\n`;
    csv += `Current CWA,${currentCWA.toFixed(2)}%\n`;
    csv += `CWA Grade,${cwaGrade}\n`;
    csv += `FGPA (4.0 Scale),${equivalentGPA.toFixed(2)}\n`;
    csv += `Degree Class,${degreeClass}\n`;
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
