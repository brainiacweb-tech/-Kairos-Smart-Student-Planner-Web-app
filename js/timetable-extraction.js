/**
 * Timetable Extraction UI Manager
 * Handles display and editing of extracted schedule data
 */

class TimetableExtractionUI {
    constructor() {
        this.currentTimetableId = null;
        this.extractedCourses = [];
        this.previewHtml = '';
    }

    /**
     * Display extraction preview after upload
     */
    async showExtractionPreview(timetableId, extractedCourses, previewHtml) {
        this.currentTimetableId = timetableId;
        this.extractedCourses = extractedCourses;
        this.previewHtml = previewHtml;

        // Create modal for editing
        const modal = document.createElement('div');
        modal.id = 'extractionModal';
        modal.className = 'extraction-modal';
        modal.innerHTML = `
            <div class="extraction-modal-content">
                <div class="extraction-header">
                    <h2>📅 Timetable Extraction Preview</h2>
                    <button class="close-btn" onclick="timetableExtractionUI.closeModal()">✕</button>
                </div>

                <div class="extraction-body">
                    <div class="extraction-tabs">
                        <button class="tab-btn active" onclick="timetableExtractionUI.switchTab('preview')">Preview</button>
                        <button class="tab-btn" onclick="timetableExtractionUI.switchTab('edit')">Edit Courses</button>
                        <button class="tab-btn" onclick="timetableExtractionUI.switchTab('customize')">Customize</button>
                    </div>

                    <div id="previewTab" class="tab-content active">
                        <h3>Visual Timetable</h3>
                        <div class="timetable-preview">
                            ${previewHtml}
                        </div>
                    </div>

                    <div id="editTab" class="tab-content">
                        <h3>Edit Extracted Courses (${extractedCourses.length} courses found)</h3>
                        <div class="courses-list">
                            ${this.renderCoursesList(extractedCourses)}
                        </div>
                    </div>

                    <div id="customizeTab" class="tab-content">
                        <h3>Customize Your Timetable</h3>
                        <p>Use the form below to add or modify courses</p>
                        ${this.renderCustomizeForm()}
                    </div>
                </div>

                <div class="extraction-footer">
                    <button class="btn-cancel" onclick="timetableExtractionUI.closeModal()">Cancel</button>
                    <button class="btn-primary" onclick="timetableExtractionUI.confirmAndSave()">✓ Save to Timetable</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.addExtractionStyles();
    }

    /**
     * Render list of extracted courses for editing
     */
    renderCoursesList(courses) {
        return courses.map((course, index) => `
            <div class="course-item" id="course-${index}">
                <div class="course-header">
                    <input type="checkbox" class="course-checkbox" data-index="${index}" checked>
                    <div class="course-title">
                        <strong>${course.course_name || `Course ${index + 1}`}</strong>
                        <small>${course.start_time || ''} - ${course.end_time || ''}</small>
                    </div>
                </div>
                <div class="course-details">
                    <div class="detail-row">
                        <label>Course Name:</label>
                        <input type="text" class="course-name-input" data-index="${index}" value="${course.course_name || ''}" placeholder="e.g., Mathematics 101">
                    </div>
                    <div class="detail-row">
                        <label>Instructor:</label>
                        <input type="text" class="course-instructor-input" data-index="${index}" value="${course.instructor || ''}" placeholder="e.g., Prof. Smith">
                    </div>
                    <div class="detail-row">
                        <label>Room:</label>
                        <input type="text" class="course-room-input" data-index="${index}" value="${course.room || ''}" placeholder="e.g., Room 101">
                    </div>
                    <div class="detail-row">
                        <label>Start Time:</label>
                        <input type="time" class="course-start-input" data-index="${index}" value="${course.start_time || ''}" >
                    </div>
                    <div class="detail-row">
                        <label>End Time:</label>
                        <input type="time" class="course-end-input" data-index="${index}" value="${course.end_time || ''}" >
                    </div>
                    <div class="detail-row">
                        <label>Days:</label>
                        <div class="days-selector">
                            ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => `
                                <label class="day-label">
                                    <input type="checkbox" class="day-checkbox" data-index="${index}" data-day="${day}" 
                                        ${(course.days_of_week || []).includes(day) ? 'checked' : ''}>
                                    ${day}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render form to customize/add courses
     */
    renderCustomizeForm() {
        return `
            <form id="customizeForm" class="customize-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Course Name *</label>
                        <input type="text" id="customCourseName" placeholder="e.g., Physics 201" required>
                    </div>
                    <div class="form-group">
                        <label>Instructor</label>
                        <input type="text" id="customInstructor" placeholder="e.g., Dr. Johnson">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Room</label>
                        <input type="text" id="customRoom" placeholder="e.g., Lab A">
                    </div>
                    <div class="form-group">
                        <label>Start Time *</label>
                        <input type="time" id="customStartTime" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>End Time</label>
                        <input type="time" id="customEndTime">
                    </div>
                </div>

                <div class="form-group">
                    <label>Days of Week</label>
                    <div class="days-selector">
                        ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => `
                            <label class="day-label">
                                <input type="checkbox" class="custom-day" value="${day}">
                                ${day}
                            </label>
                        `).join('')}
                    </div>
                </div>

                <button type="button" class="btn-secondary" onclick="timetableExtractionUI.addCustomCourse()">
                    + Add Course
                </button>
            </form>

            <div id="addedCourses" class="added-courses-list" style="margin-top: 20px;"></div>
        `;
    }

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Deactivate all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabName + 'Tab').classList.add('active');
        event.target.classList.add('active');
    }

    /**
     * Add custom course to the list
     */
    addCustomCourse() {
        const name = document.getElementById('customCourseName').value;
        const instructor = document.getElementById('customInstructor').value;
        const room = document.getElementById('customRoom').value;
        const startTime = document.getElementById('customStartTime').value;
        const endTime = document.getElementById('customEndTime').value;

        const days = Array.from(document.querySelectorAll('.custom-day:checked'))
            .map(cb => cb.value);

        if (!name || !startTime || days.length === 0) {
            alert('Please fill in course name, start time, and select at least one day');
            return;
        }

        const course = {
            course_name: name,
            instructor: instructor,
            room: room,
            start_time: startTime,
            end_time: endTime,
            days_of_week: days,
            custom: true
        };

        this.extractedCourses.push(course);

        // Add to UI
        const container = document.getElementById('addedCourses');
        const item = document.createElement('div');
        item.className = 'added-course-item';
        item.innerHTML = `
            <div class="course-badge">
                ${name} - ${startTime} (${days.join(', ')})
                <button type="button" class="remove-btn" onclick="timetableExtractionUI.removeCustomCourse(event)">✕</button>
            </div>
        `;
        container.appendChild(item);

        // Clear form
        document.getElementById('customizeForm').reset();
    }

    /**
     * Remove custom course
     */
    removeCustomCourse(event) {
        event.preventDefault();
        event.target.closest('.added-course-item').remove();
        // Also remove from extractedCourses array
        const index = this.extractedCourses.findIndex(c => c.custom);
        if (index >= 0) {
            this.extractedCourses.splice(index, 1);
        }
    }

    /**
     * Gather updated course data from form
     */
    gatherUpdatedCourses() {
        const updated = [];

        // Get checkbox states and form values
        document.querySelectorAll('.course-item').forEach((item, index) => {
            const checkbox = item.querySelector('.course-checkbox');
            if (!checkbox.checked) return;

            const course = {
                course_name: item.querySelector('.course-name-input').value,
                instructor: item.querySelector('.course-instructor-input').value,
                room: item.querySelector('.course-room-input').value,
                start_time: item.querySelector('.course-start-input').value,
                end_time: item.querySelector('.course-end-input').value,
                days_of_week: Array.from(item.querySelectorAll('.day-checkbox:checked'))
                    .map(cb => cb.dataset.day),
                enabled: true
            };

            updated.push(course);
        });

        return updated;
    }

    /**
     * Confirm extraction and save to database
     */
    async confirmAndSave() {
        const updated = this.gatherUpdatedCourses();

        if (updated.length === 0) {
            alert('Please select at least one course to save');
            return;
        }

        console.log('Saving courses:', updated);

        try {
            // Show loading state on button
            const saveBtn = event.target;
            const originalText = saveBtn.textContent;
            saveBtn.disabled = true;
            saveBtn.textContent = '⏳ Saving...';

            const result = await storage.confirmExtraction(this.currentTimetableId, updated);

            if (result.error) {
                alert('Error confirming extraction: ' + result.error);
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            } else {
                // Success!
                alert(`✅ Successfully saved ${updated.length} courses to your timetable!`);
                this.closeModal();
                
                // Refresh timetable display
                if (window.timetableManager) {
                    await window.timetableManager.loadClassesFromAPI();
                    window.timetableManager.renderUI();
                }
            }
        } catch (error) {
            console.error('Error saving timetable:', error);
            alert('Error saving timetable: ' + error.message);
        }
    }

    /**
     * Close extraction modal
     */
    closeModal() {
        const modal = document.getElementById('extractionModal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Add CSS styles for extraction UI
     */
    addExtractionStyles() {
        if (document.getElementById('extractionStyles')) return;

        const style = document.createElement('style');
        style.id = 'extractionStyles';
        style.textContent = `
            .extraction-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }

            .extraction-modal-content {
                background: white;
                border-radius: 10px;
                max-width: 900px;
                width: 90vh;
                max-height: 90vh;
                overflow: auto;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                display: flex;
                flex-direction: column;
            }

            .extraction-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #eee;
            }

            .extraction-header h2 {
                margin: 0;
                font-size: 1.5em;
                color: #333;
            }

            .close-btn {
                background: none;
                border: none;
                font-size: 1.5em;
                cursor: pointer;
                color: #999;
            }

            .extraction-body {
                flex: 1;
                overflow: auto;
                padding: 20px;
            }

            .extraction-tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                border-bottom: 2px solid #eee;
            }

            .tab-btn {
                padding: 10px 20px;
                background: none;
                border: none;
                cursor: pointer;
                font-size: 0.95em;
                color: #666;
                border-bottom: 3px solid transparent;
                transition: all 0.3s;
            }

            .tab-btn.active {
                color: #2196F3;
                border-bottom-color: #2196F3;
            }

            .tab-content {
                display: none;
            }

            .tab-content.active {
                display: block;
            }

            .timetable-preview {
                background: #f9f9f9;
                padding: 15px;
                border-radius: 8px;
            }

            .courses-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .course-item {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                background: #fafafa;
            }

            .course-header {
                display: flex;
                gap: 15px;
                align-items: center;
                margin-bottom: 15px;
                cursor: pointer;
            }

            .course-checkbox {
                width: 20px;
                height: 20px;
            }

            .course-title strong {
                display: block;
                margin-bottom: 3px;
            }

            .course-title small {
                color: #888;
            }

            .course-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-top: 10px;
            }

            .detail-row {
                display: flex;
                flex-direction: column;
            }

            .detail-row label {
                font-weight: 500;
                margin-bottom: 5px;
                font-size: 0.9em;
            }

            .detail-row input {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 0.9em;
            }

            .days-selector {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .day-label {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 0.9em;
            }

            .day-checkbox {
                width: 16px;
                height: 16px;
            }

            .customize-form {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 8px;
            }

            .form-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 15px;
            }

            .form-group {
                display: flex;
                flex-direction: column;
            }

            .form-group label {
                font-weight: 500;
                margin-bottom: 8px;
            }

            .form-group input {
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }

            .btn-secondary {
                background: #2196F3;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
            }

            .btn-secondary:hover {
                background: #1976D2;
            }

            .added-courses-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .added-course-item {
                background: #e3f2fd;
                padding: 10px;
                border-radius: 4px;
                border-left: 4px solid #2196F3;
            }

            .course-badge {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .remove-btn {
                background: none;
                border: none;
                color: #d32f2f;
                cursor: pointer;
                font-size: 0.9em;
            }

            .extraction-footer {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                padding: 20px;
                border-top: 1px solid #eee;
            }

            .btn-cancel, .btn-primary {
                padding: 10px 20px;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
            }

            .btn-cancel {
                background: white;
                color: #333;
            }

            .btn-cancel:hover {
                background: #f0f0f0;
            }

            .btn-primary {
                background: #4CAF50;
                color: white;
                border-color: #4CAF50;
            }

            .btn-primary:hover {
                background: #45a049;
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize global extraction UI manager
const timetableExtractionUI = new TimetableExtractionUI();
