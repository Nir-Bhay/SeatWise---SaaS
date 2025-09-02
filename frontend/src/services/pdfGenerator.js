import jsPDF from 'jspdf';
import 'jspdf-autotable';

class ClientPDFGenerator {
    constructor() {
        this.fontSize = 12;
        this.margin = 40;
    }

    // Generate Seating Arrangement PDF
    generateSeatingPDF(examData, roomData) {
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: 'A4'
        });

        this.addHeader(pdf, examData, roomData, 'SEATING ARRANGEMENT');
        this.addSeatingGrid(pdf, roomData);
        this.addFooter(pdf, examData, roomData);

        return pdf;
    }

    // Generate Attendance Sheet PDF
    generateAttendancePDF(examData, roomData) {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'A4'
        });

        this.addHeader(pdf, examData, roomData, 'ATTENDANCE SHEET');
        this.addAttendanceTable(pdf, roomData.students);
        this.addFooter(pdf, examData, roomData);

        return pdf;
    }

    // Generate Master Plan PDF
    generateMasterPDF(examData) {
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: 'A3'
        });

        this.addHeader(pdf, examData, null, 'MASTER SEATING PLAN');
        this.addMasterTable(pdf, examData.rooms);
        this.addFooter(pdf, examData, null);

        return pdf;
    }

    // Add Header
    addHeader(pdf, examData, roomData, title) {
        const pageWidth = pdf.internal.pageSize.getWidth();

        // University/College Name
        pdf.setFontSize(20);
        pdf.setFont("times", "bold");
        pdf.text(examData.university?.name?.toUpperCase() || 'UNIVERSITY NAME', pageWidth / 2, 60, { align: "center" });

        // Title
        pdf.setFontSize(16);
        pdf.text(title, pageWidth / 2, 90, { align: "center" });

        // Exam Details
        pdf.setFontSize(12);
        pdf.text(`Exam: ${examData.title} (${examData.examType})`, this.margin, 120);

        if (roomData) {
            pdf.text(`Room: ${roomData.roomNumber}`, pageWidth - this.margin, 120, { align: "right" });
        }

        pdf.text(`Date: ${new Date(examData.date).toLocaleDateString()}`, this.margin, 140);
        pdf.text(`Time: ${examData.time?.start} - ${examData.time?.end}`, pageWidth - this.margin, 140, { align: "right" });

        // Draw line
        pdf.line(this.margin, 160, pageWidth - this.margin, 160);
    }

    // Add Seating Grid
    addSeatingGrid(pdf, roomData) {
        const startY = 180;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const availableWidth = pageWidth - (this.margin * 2);

        if (!roomData.seating?.grid) {
            pdf.setFontSize(14);
            pdf.text('No seating arrangement available', pageWidth / 2, startY + 50, { align: "center" });
            return;
        }

        const grid = roomData.seating.grid;
        const rows = grid.length;
        const cols = grid[0]?.length || 0;

        const cellWidth = availableWidth / cols;
        const cellHeight = 30;

        // Draw grid
        pdf.setFontSize(10);
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = this.margin + (j * cellWidth);
                const y = startY + (i * cellHeight);

                // Draw cell border
                pdf.rect(x, y, cellWidth, cellHeight);

                // Add student info if available
                const student = grid[i][j];
                if (student && student.rollNumber) {
                    const textX = x + (cellWidth / 2);
                    const textY = y + (cellHeight / 2) - 5;

                    pdf.text(student.rollNumber, textX, textY, { align: "center" });
                    if (student.name) {
                        pdf.setFontSize(8);
                        pdf.text(student.name.substring(0, 15), textX, textY + 12, { align: "center" });
                        pdf.setFontSize(10);
                    }
                }
            }
        }
    }

    // Add Attendance Table
    addAttendanceTable(pdf, students) {
        if (!students || students.length === 0) {
            pdf.text('No students found', this.margin, 200);
            return;
        }

        const tableData = students.map((student, index) => [
            index + 1,
            student.rollNumber || '',
            student.name || '',
            student.branch || '',
            '', // Signature column
            ''  // Present/Absent column
        ]);

        pdf.autoTable({
            startY: 180,
            head: [['S.No.', 'Roll Number', 'Name', 'Branch', 'Signature', 'P/A']],
            body: tableData,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 5
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 80 },
                2: { cellWidth: 120 },
                3: { cellWidth: 60 },
                4: { cellWidth: 80 },
                5: { cellWidth: 40 }
            }
        });
    }

    // Add Master Table
    addMasterTable(pdf, rooms) {
        if (!rooms || rooms.length === 0) {
            pdf.text('No rooms found', this.margin, 200);
            return;
        }

        const tableData = rooms.map((room, index) => [
            index + 1,
            room.roomNumber || '',
            room.buildingName || '',
            room.allocatedStudents?.length || 0,
            room.capacity || 0,
            room.allocatedStudents?.map(s => s.branch).filter((v, i, a) => a.indexOf(v) === i).join(', ') || ''
        ]);

        // Add summary row
        const totalStudents = rooms.reduce((sum, room) => sum + (room.allocatedStudents?.length || 0), 0);
        const totalCapacity = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0);

        tableData.push(['', 'TOTAL', '', totalStudents, totalCapacity, '']);

        pdf.autoTable({
            startY: 180,
            head: [['S.No.', 'Room No.', 'Building', 'Students', 'Capacity', 'Branches']],
            body: tableData,
            theme: 'grid',
            styles: {
                fontSize: 11,
                cellPadding: 6
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 10
            },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 80 },
                2: { cellWidth: 100 },
                3: { cellWidth: 80 },
                4: { cellWidth: 80 },
                5: { cellWidth: 150 }
            }
        });
    }

    // Add Footer
    addFooter(pdf, examData, roomData) {
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const footerY = pageHeight - 100;

        // Draw line
        pdf.line(this.margin, footerY - 20, pageWidth - this.margin, footerY - 20);

        pdf.setFontSize(10);

        if (roomData) {
            // Room specific footer
            pdf.text(`Total Students: ${roomData.students?.length || 0}`, this.margin, footerY);
            pdf.text(`Present: _____`, this.margin + 150, footerY);
            pdf.text(`Absent: _____`, this.margin + 250, footerY);
        }

        // Signature fields
        pdf.text('Invigilator Signature: ___________________', this.margin, footerY + 30);
        pdf.text('Date: ___________', pageWidth - 150, footerY + 30);

        // Page number
        const pageNum = pdf.internal.getCurrentPageInfo().pageNumber;
        pdf.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 20, { align: "center" });
    }

    // Download PDF
    downloadPDF(pdf, filename) {
        pdf.save(filename);
    }

    // Preview PDF (returns blob URL)
    previewPDF(pdf) {
        const blob = pdf.output('blob');
        return URL.createObjectURL(blob);
    }
}

export default ClientPDFGenerator;