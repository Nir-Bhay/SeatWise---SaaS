const XLSX = require('xlsx');
const Student = require('../models/Student');

class ExcelProcessor {
    // Process uploaded Excel file
    async processStudentExcel(filePath, universityId, mapping = {}) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                throw new Error('Excel file is empty');
            }

            // Process and validate data
            const processedStudents = this.processStudentData(jsonData, universityId, mapping);

            return {
                totalRows: jsonData.length,
                validStudents: processedStudents.length,
                students: processedStudents
            };
        } catch (error) {
            throw new Error(`Excel processing failed: ${error.message}`);
        }
    }

    // Process and validate student data
    processStudentData(rawData, universityId, mapping) {
        const students = [];
        const errors = [];

        rawData.forEach((row, index) => {
            try {
                const student = this.mapRowToStudent(row, universityId, mapping);
                if (this.validateStudent(student)) {
                    students.push(student);
                }
            } catch (error) {
                errors.push({
                    row: index + 1,
                    error: error.message
                });
            }
        });

        if (errors.length > 0) {
            console.warn('Student data validation errors:', errors);
        }

        return students;
    }

    // Map Excel row to student object
    mapRowToStudent(row, universityId, mapping) {
        // Default mapping (can be customized)
        const defaultMapping = {
            enrollmentNo: ['Enrollment No', 'enrollment_no', 'enrollmentNo', 'roll_no'],
            name: ['Name', 'name', 'student_name', 'studentName'],
            program: ['Program', 'program', 'course'],
            branch: ['Branch', 'branch', 'department'],
            semester: ['Semester', 'semester', 'sem'],
            year: ['Year', 'year', 'academic_year'],
            section: ['Section', 'section'],
            status: ['Status', 'status'],
            attendancePercent: ['Attendance', 'attendance', 'attendance_percent']
        };

        const finalMapping = { ...defaultMapping, ...mapping };
        const student = { universityId };

        // Map each field
        Object.keys(finalMapping).forEach(field => {
            const possibleKeys = finalMapping[field];
            const value = this.findValueInRow(row, possibleKeys);

            if (value !== null && value !== undefined) {
                student[field] = this.formatValue(field, value);
            }
        });

        return student;
    }

    // Find value in row using possible key names
    findValueInRow(row, possibleKeys) {
        for (const key of possibleKeys) {
            if (row.hasOwnProperty(key) && row[key] !== null && row[key] !== undefined) {
                return row[key];
            }
        }
        return null;
    }

    // Format value based on field type
    formatValue(field, value) {
        switch (field) {
            case 'enrollmentNo':
                return String(value).trim().toUpperCase();
            case 'name':
                return String(value).trim();
            case 'program':
            case 'branch':
                return String(value).trim().toUpperCase();
            case 'semester':
                return String(value).trim().toUpperCase();
            case 'year':
                return String(value).trim();
            case 'attendancePercent':
                const percent = parseFloat(value);
                return isNaN(percent) ? 100 : Math.min(100, Math.max(0, percent));
            case 'status':
                return String(value).trim() || 'Regular';
            case 'section':
                return String(value).trim().toUpperCase() || 'A';
            default:
                return value;
        }
    }

    // Validate student data
    validateStudent(student) {
        const required = ['enrollmentNo', 'name', 'program', 'branch', 'semester'];

        for (const field of required) {
            if (!student[field] || student[field].toString().trim() === '') {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate enrollment number format (basic)
        if (student.enrollmentNo.length < 5) {
            throw new Error('Invalid enrollment number format');
        }

        return true;
    }

    // Bulk save students to database
    async saveStudentsToDatabase(students) {
        try {
            const results = {
                inserted: 0,
                updated: 0,
                errors: []
            };

            for (const studentData of students) {
                try {
                    const existingStudent = await Student.findOne({
                        universityId: studentData.universityId,
                        enrollmentNo: studentData.enrollmentNo
                    });

                    if (existingStudent) {
                        // Update existing student
                        Object.assign(existingStudent, studentData);
                        await existingStudent.save();
                        results.updated++;
                    } else {
                        // Create new student
                        const newStudent = new Student(studentData);
                        await newStudent.save();
                        results.inserted++;
                    }
                } catch (error) {
                    results.errors.push({
                        enrollmentNo: studentData.enrollmentNo,
                        error: error.message
                    });
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Database save failed: ${error.message}`);
        }
    }

    // Generate sample Excel template
    generateSampleTemplate() {
        const sampleData = [
            {
                'Enrollment No': '21BTE3CSE10001',
                'Name': 'John Doe',
                'Program': 'B.Tech',
                'Branch': 'CSE',
                'Semester': 'V',
                'Year': '2021',
                'Section': 'A',
                'Status': 'Regular',
                'Attendance': 85
            },
            {
                'Enrollment No': '21BTE3CSE10002',
                'Name': 'Jane Smith',
                'Program': 'B.Tech',
                'Branch': 'CSE',
                'Semester': 'V',
                'Year': '2021',
                'Section': 'A',
                'Status': 'Regular',
                'Attendance': 92
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
}

module.exports = ExcelProcessor;