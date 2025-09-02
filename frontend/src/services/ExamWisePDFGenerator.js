// frontend/src/services/pdfGenerator.js
class ExamWisePDFGenerator {
    constructor() {
        // Initialize jsPDF - will be available via CDN
        this.jsPDF = window.jspdf?.jsPDF;
        if (!this.jsPDF) {
            throw new Error('jsPDF library not loaded. Please include jsPDF CDN in your HTML.');
        }
    }

    // Generate seating arrangement PDF
    generateSeatingPDF(examData, roomData, universityData = {}) {
        const pdf = new this.jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: 'A4'
        });

        // Page dimensions
        const pageWidth = pdf.internal.pageSize.getWidth(); // ~842pt
        const pageHeight = pdf.internal.pageSize.getHeight(); // ~595pt
        const margin = 40;

        // University header
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        const universityName = universityData.name || 'SAGE UNIVERSITY, BHOPAL';
        pdf.text(universityName, pageWidth / 2, margin + 20, { align: 'center' });

        // Exam type and details
        pdf.setFontSize(16);
        const examTitle = `${examData.examType} ${examData.semester} ${examData.year}`;
        pdf.text(examTitle, pageWidth / 2, margin + 50, { align: 'center' });

        // Room and timing details
        pdf.setFontSize(14);
        pdf.text(`Room No - ${roomData.roomNumber}`, pageWidth / 2, margin + 80, { align: 'center' });

        const timeString = `TIME: ${examData.time.start} - ${examData.time.end}`;
        const dateString = `DATE: ${new Date(examData.date).toLocaleDateString('en-GB')}`;

        pdf.text(timeString, pageWidth - margin, margin + 100, { align: 'right' });
        pdf.text(dateString, pageWidth - margin, margin + 120, { align: 'right' });

        // Generate seating grid
        this.drawSeatingGrid(pdf, roomData, margin, margin + 150);

        // Footer information
        this.drawSeatingFooter(pdf, examData, roomData, universityData, pageHeight - 120);

        return pdf;
    }

    // Generate attendance sheet PDF
    generateAttendancePDF(examData, roomData, universityData = {}) {
        const pdf = new this.jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'A4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth(); // ~595pt
        const pageHeight = pdf.internal.pageSize.getHeight(); // ~842pt
        const margin = 40;

        // Header
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        const universityName = universityData.name || 'SAGE UNIVERSITY, BHOPAL';
        pdf.text(universityName, pageWidth / 2, margin + 20, { align: 'center' });

        pdf.setFontSize(14);
        pdf.text('ATTENDANCE SHEET', pageWidth / 2, margin + 50, { align: 'center' });

        // Exam details
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');

        const examDetails = [
            `Exam: ${examData.title}`,
            `Date: ${new Date(examData.date).toLocaleDateString('en-GB')}`,
            `Time: ${examData.time.start} - ${examData.time.end}`,
            `Room: ${roomData.roomNumber}`,
            `Program/Branch: ${examData.programs?.join(', ')} - ${examData.branches?.join(', ')}`
        ];

        let yPos = margin + 80;
        examDetails.forEach(detail => {
            pdf.text(detail, margin, yPos);
            yPos += 20;
        });

        // Student attendance table
        this.drawAttendanceTable(pdf, roomData.allocatedStudents || [], margin, yPos + 20);

        return pdf;
    }

    // Generate master seating plan PDF
    generateMasterPDF(examData, universityData = {}) {
        const pdf = new this.jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: 'A3'
        });

        const pageWidth = pdf.internal.pageSize.getWidth(); // ~1191pt
        const pageHeight = pdf.internal.pageSize.getHeight(); // ~842pt
        const margin = 40;

        // Header
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        const universityName = universityData.name || 'SAGE UNIVERSITY, BHOPAL';
        pdf.text(universityName, pageWidth / 2, margin + 30, { align: 'center' });

        pdf.setFontSize(18);
        pdf.text('MASTER SEATING PLAN', pageWidth / 2, margin + 70, { align: 'center' });

        // Exam details
        pdf.setFontSize(14);
        pdf.text(`${examData.title} - ${examData.examType}`, pageWidth / 2, margin + 100, { align: 'center' });
        pdf.text(`Date: ${new Date(examData.date).toLocaleDateString('en-GB')} | Time: ${examData.time.start} - ${examData.time.end}`,
            pageWidth / 2, margin + 125, { align: 'center' });

        // Room allocation table
        this.drawMasterTable(pdf, examData.roomAllocation || [], margin, margin + 160);

        return pdf;
    }

    // Draw seating grid for room layout
    drawSeatingGrid(pdf, roomData, startX, startY) {
        const students = roomData.allocatedStudents || [];
        const seating = roomData.seating;

        if (!seating || !seating.grid) {
            pdf.setFontSize(12);
            pdf.text('No seating arrangement generated', startX, startY + 50);
            return;
        }

        const grid = seating.grid;
        const cellWidth = 120;
        const cellHeight = 50;
        const headerHeight = 30;

        // Draw column headers (ROW-I, ROW-II, etc.)
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');

        for (let col = 0; col < grid[0]?.length || 0; col++) {
            const headerText = `ROW-${this.numberToRoman(col + 1)}`;
            const x = startX + col * cellWidth + cellWidth / 2;
            const y = startY;

            pdf.text(headerText, x, y, { align: 'center' });

            // Draw header border
            pdf.rect(startX + col * cellWidth, startY - headerHeight + 5, cellWidth, headerHeight);
        }

        // Draw student grid
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);

        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const seat = grid[row][col];
                const x = startX + col * cellWidth;
                const y = startY + headerHeight + row * cellHeight;

                // Draw cell border
                pdf.rect(x, y, cellWidth, cellHeight);

                // Draw student info if seat is occupied
                if (seat.occupied && seat.student) {
                    const student = seat.student;
                    const rollNumber = student.rollNumber || student.enrollmentNumber || '';
                    const studentName = student.name || '';

                    // Split long roll numbers or names if needed
                    pdf.text(rollNumber, x + cellWidth / 2, y + cellHeight / 2 - 5, { align: 'center' });

                    if (studentName.length > 15) {
                        const nameParts = studentName.split(' ');
                        pdf.text(nameParts[0], x + cellWidth / 2, y + cellHeight / 2 + 8, { align: 'center' });
                        if (nameParts.length > 1) {
                            pdf.text(nameParts.slice(1).join(' '), x + cellWidth / 2, y + cellHeight / 2 + 18, { align: 'center' });
                        }
                    } else {
                        pdf.text(studentName, x + cellWidth / 2, y + cellHeight / 2 + 10, { align: 'center' });
                    }
                }
            }
        }
    }

    // Draw footer information for seating arrangement
    drawSeatingFooter(pdf, examData, roomData, universityData, startY) {
        const margin = 40;
        const pageWidth = pdf.internal.pageSize.getWidth();

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');

        // Student count and program info
        const studentCount = roomData.allocatedStudents?.length || 0;
        const programs = examData.programs?.join(', ') || '';
        const branches = examData.branches?.join(', ') || '';

        pdf.text(`Prog./Branch:`, margin, startY);
        pdf.text(`${programs} - ${branches}`, margin + 100, startY);

        pdf.text(`Sem:`, margin + 300, startY);
        pdf.text(`${examData.semesters?.join(', ') || 'All'}`, margin + 330, startY);

        pdf.text(`Status:`, margin + 450, startY);
        pdf.text('REGULAR / ATKT', margin + 500, startY);

        pdf.text(`No. of Candidate`, pageWidth - margin - 100, startY);
        pdf.text(studentCount.toString(), pageWidth - margin - 30, startY);

        // Attendance tracking
        pdf.text('PRESENT:', margin, startY + 30);
        pdf.text('ABSENT:', margin + 150, startY + 30);
        pdf.text('TOTAL:', margin + 300, startY + 30);
        pdf.text(studentCount.toString(), margin + 350, startY + 30);

        pdf.text('Centre Supdt.', pageWidth - margin - 80, startY + 15);
        pdf.text('SUB EXAMINATION', pageWidth - margin - 80, startY + 30);

        // Signature boxes
        pdf.text('DESIGN.', margin, startY + 60);
        pdf.text('BRANCH', margin + 150, startY + 60);
        pdf.text('SIGNATURE WITH DATE', margin + 400, startY + 60);

        // Draw signature lines
        pdf.line(margin, startY + 80, margin + 120, startY + 80);
        pdf.line(margin + 150, startY + 80, margin + 270, startY + 80);
        pdf.line(margin + 400, startY + 80, margin + 600, startY + 80);
    }

    // Draw attendance table
    drawAttendanceTable(pdf, students, startX, startY) {
        const rowHeight = 25;
        const colWidths = [40, 200, 120, 120, 60]; // S.No, Name, Roll No, Signature, Present
        let currentY = startY;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');

        // Table headers
        const headers = ['S.No', 'Student Name', 'Roll Number', 'Signature', 'Present'];
        let currentX = startX;

        headers.forEach((header, index) => {
            pdf.rect(currentX, currentY, colWidths[index], rowHeight);
            pdf.text(header, currentX + colWidths[index] / 2, currentY + rowHeight / 2 + 3, { align: 'center' });
            currentX += colWidths[index];
        });

        currentY += rowHeight;
        pdf.setFont('helvetica', 'normal');

        // Student rows
        students.forEach((student, index) => {
            if (currentY > pdf.internal.pageSize.getHeight() - 100) {
                pdf.addPage();
                currentY = 40;
            }

            currentX = startX;
            const rowData = [
                (index + 1).toString(),
                student.name || '',
                student.rollNumber || student.enrollmentNumber || '',
                '', // Signature column - empty
                ''  // Present column - empty
            ];

            rowData.forEach((data, colIndex) => {
                pdf.rect(currentX, currentY, colWidths[colIndex], rowHeight);
                if (data) {
                    pdf.text(data, currentX + 5, currentY + rowHeight / 2 + 3);
                }
                currentX += colWidths[colIndex];
            });

            currentY += rowHeight;
        });
    }

    // Draw master plan table
    drawMasterTable(pdf, roomAllocation, startX, startY) {
        const rowHeight = 30;
        const colWidths = [80, 120, 80, 80, 200, 120];
        let currentY = startY;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');

        // Table headers
        const headers = ['Room No', 'Building', 'Floor', 'Students', 'Programs', 'Branches'];
        let currentX = startX;

        headers.forEach((header, index) => {
            pdf.rect(currentX, currentY, colWidths[index], rowHeight);
            pdf.text(header, currentX + colWidths[index] / 2, currentY + rowHeight / 2 + 4, { align: 'center' });
            currentX += colWidths[index];
        });

        currentY += rowHeight;
        pdf.setFont('helvetica', 'normal');

        // Room rows
        roomAllocation.forEach((room, index) => {
            currentX = startX;
            const studentCount = room.allocatedStudents?.length || 0;
            const rowData = [
                room.roomNumber || '',
                room.buildingName || '',
                room.floorName || '',
                studentCount.toString(),
                room.programs?.join(', ') || '',
                room.branches?.join(', ') || ''
            ];

            rowData.forEach((data, colIndex) => {
                pdf.rect(currentX, currentY, colWidths[colIndex], rowHeight);
                if (data) {
                    // Handle text wrapping for long content
                    const text = data.length > 20 ? data.substring(0, 17) + '...' : data;
                    pdf.text(text, currentX + 5, currentY + rowHeight / 2 + 4);
                }
                currentX += colWidths[colIndex];
            });

            currentY += rowHeight;
        });

        // Summary row
        const totalStudents = roomAllocation.reduce((sum, room) => sum + (room.allocatedStudents?.length || 0), 0);
        currentX = startX;
        pdf.setFont('helvetica', 'bold');

        pdf.rect(currentX, currentY, colWidths[0], rowHeight);
        pdf.text('TOTAL', currentX + colWidths[0] / 2, currentY + rowHeight / 2 + 4, { align: 'center' });
        currentX += colWidths[0];

        pdf.rect(currentX, currentY, colWidths[1] + colWidths[2], rowHeight);
        pdf.text(`${roomAllocation.length} Rooms`, currentX + (colWidths[1] + colWidths[2]) / 2, currentY + rowHeight / 2 + 4, { align: 'center' });
        currentX += colWidths[1] + colWidths[2];

        pdf.rect(currentX, currentY, colWidths[3], rowHeight);
        pdf.text(totalStudents.toString(), currentX + colWidths[3] / 2, currentY + rowHeight / 2 + 4, { align: 'center' });
    }

    // Helper function to convert numbers to Roman numerals
    numberToRoman(num) {
        const romanNumerals = [
            { value: 10, symbol: 'X' },
            { value: 9, symbol: 'IX' },
            { value: 5, symbol: 'V' },
            { value: 4, symbol: 'IV' },
            { value: 1, symbol: 'I' }
        ];

        let result = '';
        for (const { value, symbol } of romanNumerals) {
            while (num >= value) {
                result += symbol;
                num -= value;
            }
        }
        return result;
    }

    // Download PDF helper
    downloadPDF(pdf, filename) {
        pdf.save(filename);
    }
}

export default ExamWisePDFGenerator;