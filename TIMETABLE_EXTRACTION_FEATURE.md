# Timetable Auto-Extraction Feature Guide

## Overview

The Timetable Auto-Extraction feature automatically extracts schedule information from uploaded timetable files (PDF, images, or CSV) and builds a digital timetable for you to review and customize before saving.

## Features

### 1. **Automatic Data Extraction**
- **PDF Support**: Extracts text and tables from PDF files using advanced PDF parsing
- **Image/Scanned Documents**: Uses OCR (Optical Character Recognition) to read text from images and scanned timetables
- **CSV Files**: Parses structured CSV data directly
- **Smart Parsing**: Intelligently identifies course names, times, days, rooms, and instructors

### 2. **Visual Preview**
- Displays extracted data in an easy-to-read visual grid format
- Shows the day-to-day layout of your timetable
- Helps you verify the extraction was accurate

### 3. **Data Customization**
- **Edit Extracted Courses**: Modify course names, times, rooms, days, and instructors
- **Enable/Disable Courses**: Toggle courses on/off to choose which ones to save
- **Add Custom Courses**: Add courses that weren't automatically detected
- **Remove Courses**: Delete courses you don't want to include

### 4. **Confirmation Workflow**
- Review all extracted data before committing to database
- No automatic saving - you have full control
- Save only when you're satisfied with the results

## How to Use

### Step 1: Upload Your Timetable
1. Go to the **Timetable** page in Kairos
2. Click the **Upload Timetable** section (or drag & drop)
3. Select a PDF, image, or CSV file containing your schedule
4. Supported formats:
   - `.pdf` - PDF documents
   - `.png`, `.jpg`, `.jpeg` - Image files
   - `.csv` - CSV spreadsheet files

### Step 2: Review Extraction Preview
Once uploaded, the system will automatically extract the data and show you:

1. **Preview Tab**: Visual representation of your extracted timetable
2. **Edit Courses Tab**: All extracted courses with details
3. **Customize Tab**: Form to add additional courses manually

### Step 3: Edit Extracted Courses

In the **Edit Courses** tab:
- Each course appears as an editable card
- **Enable/Disable**: Check/uncheck the box to include/exclude courses
- **Course Name**: Edit the course title
- **Instructor**: Edit or add instructor name
- **Room**: Change the room/location
- **Times**: Adjust start and end times
- **Days**: Select which days of the week the course occurs

### Step 4: Add Custom Courses (Optional)

If some courses weren't detected, use the **Customize** tab:
1. Fill in course details:
   - Course Name (required)
   - Instructor
   - Room
   - Start Time (required)
   - End Time
   - Days of Week (select at least one)
2. Click **+ Add Course**
3. The course will be added to your extraction

### Step 5: Save to Timetable
1. Click the **✓ Save to Timetable** button
2. All selected courses will be created in your digital timetable
3. You'll see a confirmation message with the number of courses saved

## Data Extraction Details

### How Extraction Works

**PDF Files:**
- Detects tables and extracts structured data
- Falls back to text parsing if no tables found
- Searches for common patterns: day names, times, room locations

**Images/Scanned Documents:**
- Uses OCR (Tesseract) to convert image text to machine-readable format
- Applies image preprocessing:
  - Grayscale conversion
  - Binary thresholding to improve contrast
  - Morphological operations to remove noise
- Extracts the same patterns as PDF text

**CSV Files:**
- Direct data import with column mapping
- Expects columns for: course name, time, days, room
- Handles various CSV formatting variations

### Recognition Patterns

The system looks for:
- **Days**: Monday, Tuesday, Wed, Thu, Fri, Sat, Sun (full and abbreviated names)
- **Times**: 09:00, 9:00, 9:00 AM, 09:00 PM, etc.
- **Rooms**: Room 101, Lab A, A-205, Building A, etc.
- **Courses**: Text at line beginning typically indicates course name

### What Gets Extracted

Each course extracts:
```
{
  course_name: "Mathematics 101",
  start_time: "09:00",
  end_time: "10:30",
  room: "Room 101",
  days_of_week: ["Mon", "Wed", "Fri"],
  instructor: "Prof. Smith" (if found)
}
```

## Tips & Best Practices

### For Best Results:

1. **Use Clear Documents**
   - Well-scanned PDFs with good contrast work best
   - High-resolution images of timetables
   - Properly formatted CSV files

2. **Verify All Details**
   - Check times are in correct format
   - Verify room numbers and building names
   - Ensure all days are selected correctly

3. **Complete Your Timetable**
   - Add any courses the system missed manually
   - Verify all course details before saving
   - Consider adding optional details like instructor names

4. **Save Regularly**
   - Once satisfied, save your extraction immediately
   - You can always edit courses individually afterward

### Handling Extraction Issues:

**If courses are missing:**
- Use the **Customize** tab to add them manually
- Check if course names are non-standard or in special format

**If times are incorrect:**
- Edit times in the **Edit Courses** tab
- Ensure time format is understood (24-hour or 12-hour)

**If days are wrong:**
- Verify day names are recognized (Mon, Tue, Wed, etc.)
- Check abbreviations match expected format
- Uncheck and re-check days as needed

**If rooms are incorrectly parsed:**
- Manually enter correct room numbers
- Include building/floor information if applicable

## Technical Details

### Requirements

**Backend:**
- Python 3.7+
- Flask web framework
- SQLite database
- Required libraries:
  - pytesseract (OCR engine - requires Tesseract installed on system)
  - pdfplumber (PDF extraction)
  - opencv-python (image preprocessing)

**Frontend:**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript ES6+
- LocalStorage support

### System Installation

**Windows:**
1. Download Tesseract OCR from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install to default location or note custom path
3. Install Python packages: `pip install pytesseract pdfplumber opencv-python`

**Linux:**
```bash
sudo apt-get install tesseract-ocr
pip install pytesseract pdfplumber opencv-python
```

**macOS:**
```bash
brew install tesseract
pip install pytesseract pdfplumber opencv-python
```

### API Endpoints

**Upload with Extraction:**
- `POST /api/timetables/upload`
- Uploads file and returns extracted courses

**Get Extraction Preview:**
- `GET /api/timetables/<id>/extract-preview`
- Returns stored extraction data

**Confirm Extraction:**
- `POST /api/timetables/<id>/confirm-extraction`
- Creates ScheduledClass entries from confirmed courses

**Bulk Create Classes:**
- `POST /api/scheduled-classes/bulk-create`
- Creates multiple classes in one request

## Troubleshooting

### No Courses Extracted
- Verify file format is PDF, image, or CSV
- Check image quality if using scanned document
- Try manual entry via Customize tab

### Extraction Takes Long Time
- Large PDF files with many pages may take longer
- High-resolution images require more processing
- This is normal - extraction typically completes in 5-30 seconds

### Changes Not Saved
- Click **✓ Save to Timetable** button when done editing
- Confirm button should explicitly save to database
- Changes show in "Edit Courses" but aren't permanent until saved

### Can't Find Course After Saving
- Refresh the page to reload from database
- Check if course was toggle off before saving
- Verify days of week match today's schedule

## FAQ

**Q: Can I upload multiple timetables?**
A: Yes! Each upload creates a new timetable you can manage independently.

**Q: What if OCR doesn't work well?**
A: Ensure Tesseract is properly installed. You can always manually enter courses using the Customize tab.

**Q: Can I edit courses after saving?**
A: Yes! Individual courses can be edited or deleted from your timetable after creation.

**Q: Is my data secure?**
A: Timetable data is stored in a local SQLite database (or localStorage if API unavailable). Data is not shared unless you explicitly export/share.

**Q: What file size limit exists?**
A: PDFs and images up to 50MB are supported. Very large files may take longer to process.

**Q: Can I import from Google Calendar or other services?**
A: Currently supports PDF, image, and CSV imports. Integration with Google Calendar is on the roadmap.

## Future Enhancements

Planned improvements to the extraction feature:
- [ ] Google Calendar integration
- [ ] Outlook calendar import
- [ ] Schedule conflict detection
- [ ] Automatic room lookup
- [ ] Building location mapping
- [ ] Multi-language support
- [ ] Real-time extraction preview
- [ ] Batch processing multiple files

## Getting Help

If you encounter issues:
1. Check this guide for solutions
2. Verify file format and content
3. Try re-uploading with a clearer document
4. Use manual entry as fallback
5. Check browser console for error messages

---

**Last Updated:** 2024
**Feature Status:** Production Ready
