const Template = require('../models/Template');

const createDefaultTemplates = async (universityId) => {
    try {
        // Seating Arrangement Template
        const seatingTemplate = new Template({
            universityId,
            name: 'Default Seating Arrangement',
            type: 'seating',
            isDefault: true,
            layout: {
                header: {
                    universityName: { show: true, text: '{{university.name}}', style: { fontSize: '18px', fontWeight: 'bold' } },
                    roomNo: { show: true, text: 'Room No - {{room.number}}', style: { fontSize: '14px' } },
                    time: { show: true, text: 'Time: {{exam.time}}', style: { fontSize: '12px' } },
                    date: { show: true, text: 'Date: {{exam.date}}', style: { fontSize: '12px' } }
                },
                body: {
                    grid: {
                        arrangement: 'vertical',
                        cellStyle: { padding: '6px', fontSize: '10px', textAlign: 'center' },
                        showBorders: true
                    }
                },
                footer: {
                    program: { show: true, text: 'Program/Branch: {{exam.programs}} - {{exam.branches}}' },
                    semester: { show: true, text: 'Semester: {{exam.semester}}' },
                    totalCandidates: { show: true, text: 'No. of Candidates: {{students.length}}' },
                    signatures: {
                        show: true,
                        labels: ['DESIGN.', 'BRANCH', 'SIGNATURE WITH DATE'],
                        style: { marginTop: '20px' }
                    }
                }
            },
            customization: {
                colors: {
                    primary: '#000000',
                    secondary: '#666666',
                    background: '#ffffff'
                },
                fonts: {
                    header: 'Arial',
                    body: 'Arial',
                    size: 12
                }
            }
        });

        // Attendance Sheet Template
        const attendanceTemplate = new Template({
            universityId,
            name: 'Default Attendance Sheet',
            type: 'attendance',
            isDefault: true,
            layout: {
                header: {
                    universityName: { show: true, text: '{{university.name}}', style: { fontSize: '16px', fontWeight: 'bold' } },
                    examTitle: { show: true, text: 'DAILY ATTENDANCE RECORD', style: { fontSize: '12px' } }
                },
                body: {
                    table: {
                        columns: ['S.N', 'Enrollment No.', 'Name of Examinee', 'Main Ans. Booklet No.', 'Suppl. AB No.', 'Sign of Candidate'],
                        rowHeight: 30,
                        cellStyle: { padding: '8px', border: '1px solid #000' }
                    }
                },
                footer: {
                    signatures: {
                        show: true,
                        labels: ['Name & Sign. of Invigilator with date', 'Sign. of Center Supdt. with Date'],
                        style: { marginTop: '30px' }
                    }
                }
            }
        });

        // Master Seating Plan Template
        const masterTemplate = new Template({
            universityId,
            name: 'Default Master Seating Plan',
            type: 'master',
            isDefault: true,
            layout: {
                header: {
                    universityName: { show: true, text: '{{university.name}}', style: { fontSize: '16px', fontWeight: 'bold' } },
                    examTitle: { show: true, text: 'MASTER SEATING PLAN ({{exam.title}})', style: { fontSize: '14px', fontWeight: 'bold' } }
                },
                body: {
                    table: {
                        columns: ['S. No.', 'Floor', 'Room No.', 'Program with Course Code', 'Enrollment No.', 'No. of Students', 'Total'],
                        rowHeight: 25,
                        cellStyle: { padding: '6px', border: '1px solid #000', fontSize: '9px' }
                    }
                }
            }
        });

        await seatingTemplate.save();
        await attendanceTemplate.save();
        await masterTemplate.save();

        return {
            seating: seatingTemplate._id,
            attendance: attendanceTemplate._id,
            master: masterTemplate._id
        };
    } catch (error) {
        console.error('Error creating default templates:', error);
        throw error;
    }
};

module.exports = { createDefaultTemplates };