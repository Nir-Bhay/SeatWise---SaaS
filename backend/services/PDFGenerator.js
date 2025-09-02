const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class PDFGenerator {
    constructor() {
        this.templatePath = path.join(__dirname, '../templates');
        this.registerHandlebarsHelpers();
    }

    // Register custom Handlebars helpers
    registerHandlebarsHelpers() {
        // Helper for repeating empty rows
        handlebars.registerHelper('repeat', function (n, block) {
            let result = '';
            for (let i = 0; i < n; i++) {
                result += block.fn(i);
            }
            return result;
        });

        // Helper for converting numbers to Roman numerals
        handlebars.registerHelper('romanNumeral', function (number) {
            const romanNumerals = [
                { value: 1000, symbol: 'M' },
                { value: 900, symbol: 'CM' },
                { value: 500, symbol: 'D' },
                { value: 400, symbol: 'CD' },
                { value: 100, symbol: 'C' },
                { value: 90, symbol: 'XC' },
                { value: 50, symbol: 'L' },
                { value: 40, symbol: 'XL' },
                { value: 10, symbol: 'X' },
                { value: 9, symbol: 'IX' },
                { value: 5, symbol: 'V' },
                { value: 4, symbol: 'IV' },
                { value: 1, symbol: 'I' }
            ];

            let result = '';
            let num = number + 1; // Add 1 since array index starts from 0

            for (let i = 0; i < romanNumerals.length; i++) {
                while (num >= romanNumerals[i].value) {
                    result += romanNumerals[i].symbol;
                    num -= romanNumerals[i].value;
                }
            }

            return result;
        });

        // Helper for incrementing index (since handlebars @index starts from 0)
        handlebars.registerHelper('increment', function (value) {
            return parseInt(value) + 1;
        });

        // Helper for formatting dates
        handlebars.registerHelper('formatDate', function (date) {
            if (!date) return '';
            return new Date(date).toLocaleDateString('en-GB');
        });

        // Helper for calculating total students across all rooms
        handlebars.registerHelper('calculateTotal', function (rooms) {
            return rooms.reduce((total, room) => {
                return total + (room.allocatedStudents ? room.allocatedStudents.length : 0);
            }, 0);
        });

        console.log('✅ Handlebars helpers registered');
    }

    // Generate seating arrangement PDF
    async generateSeatingPDF(examData, template) {
        try {
            console.log('🪑 Generating seating arrangement PDF...');
            const templateHtml = await this.loadTemplate('seating.html');
            const compiledTemplate = handlebars.compile(templateHtml);

            const html = compiledTemplate({
                university: examData.university,
                room: examData.room,
                exam: examData.exam,
                grid: examData.seating ? examData.seating.grid : [],
                students: examData.students || [],
                template: template
            });

            return await this.convertToPDF(html, {
                format: 'A4',
                landscape: true,
                margin: { top: '20px', right: '15px', bottom: '20px', left: '15px' }
            });
        } catch (error) {
            console.error('❌ Seating PDF generation failed:', error);
            throw new Error(`Failed to generate seating PDF: ${error.message}`);
        }
    }

    // Generate attendance sheet PDF
    async generateAttendancePDF(examData, template) {
        try {
            console.log('📋 Generating attendance PDF...');
            const templateHtml = await this.loadTemplate('attendance.html');
            const compiledTemplate = handlebars.compile(templateHtml);

            const html = compiledTemplate({
                university: examData.university,
                room: examData.room,
                exam: examData.exam,
                students: examData.students || [],
                template: template
            });

            return await this.convertToPDF(html, {
                format: 'A4',
                portrait: true,
                margin: { top: '15px', right: '15px', bottom: '15px', left: '15px' }
            });
        } catch (error) {
            console.error('❌ Attendance PDF generation failed:', error);
            throw new Error(`Failed to generate attendance PDF: ${error.message}`);
        }
    }

    // Generate master seating plan PDF
    async generateMasterPDF(examData, template) {
        try {
            console.log('📊 Generating master PDF...');
            const templateHtml = await this.loadTemplate('master.html');
            const compiledTemplate = handlebars.compile(templateHtml);

            // Calculate total students across all rooms
            const totalStudents = examData.rooms ? examData.rooms.reduce((total, room) => {
                return total + (room.allocatedStudents ? room.allocatedStudents.length : 0);
            }, 0) : 0;

            const html = compiledTemplate({
                university: examData.university,
                exam: examData.exam,
                rooms: examData.rooms || [],
                totalStudents: totalStudents,
                template: template
            });

            return await this.convertToPDF(html, {
                format: 'A3',
                landscape: true,
                margin: { top: '20px', right: '15px', bottom: '20px', left: '15px' }
            });
        } catch (error) {
            console.error('❌ Master PDF generation failed:', error);
            throw new Error(`Failed to generate master PDF: ${error.message}`);
        }
    }

    // Load HTML template
    async loadTemplate(templateName) {
        const templatePath = path.join(this.templatePath, templateName);
        try {
            const template = await fs.readFile(templatePath, 'utf-8');
            console.log(`✅ Template loaded: ${templateName}`);
            return template;
        } catch (error) {
            console.error(`❌ Failed to load template: ${templateName}`, error);
            throw new Error(`Template not found: ${templateName}`);
        }
    }

    // Convert HTML to PDF using Puppeteer
    async convertToPDF(html, options) {
        let browser;
        try {
            console.log('🔄 Converting HTML to PDF...');

            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });

            const page = await browser.newPage();

            // Set viewport for consistent rendering
            await page.setViewport({ width: 1200, height: 800 });

            await page.setContent(html, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            const pdfBuffer = await page.pdf(options);

            console.log('✅ PDF conversion successful');
            return pdfBuffer;
        } catch (error) {
            console.error('❌ PDF conversion failed:', error);
            throw new Error(`PDF conversion failed: ${error.message}`);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    // Bulk PDF generation
    async generateBulkPDFs(examSession, templates) {
        const results = {
            seatingArrangements: [],
            attendanceSheets: [],
            masterPlan: null
        };

        try {
            console.log('📦 Starting bulk PDF generation...');

            // Generate room-wise documents
            for (const allocation of examSession.roomAllocation || []) {
                const examData = {
                    university: examSession.university,
                    exam: {
                        title: examSession.title,
                        type: examSession.examType,
                        date: examSession.date,
                        time: examSession.time,
                        programs: examSession.programs,
                        semester: examSession.semester,
                        courseCode: examSession.courseCode,
                        year: examSession.year
                    },
                    room: allocation,
                    students: allocation.allocatedStudents || [],
                    seating: allocation.seating
                };

                // Generate seating arrangement
                const seatingPDF = await this.generateSeatingPDF(examData, templates.seating);
                results.seatingArrangements.push({
                    roomNumber: allocation.roomNumber,
                    pdf: seatingPDF
                });

                // Generate attendance sheet
                const attendancePDF = await this.generateAttendancePDF(examData, templates.attendance);
                results.attendanceSheets.push({
                    roomNumber: allocation.roomNumber,
                    pdf: attendancePDF
                });
            }

            // Generate master plan
            const masterData = {
                university: examSession.university,
                exam: {
                    title: examSession.title,
                    type: examSession.examType,
                    date: examSession.date,
                    time: examSession.time,
                    year: examSession.year
                },
                rooms: examSession.roomAllocation || []
            };

            results.masterPlan = await this.generateMasterPDF(masterData, templates.master);

            console.log('✅ Bulk PDF generation completed successfully');
            return results;
        } catch (error) {
            console.error('❌ Bulk PDF generation failed:', error);
            throw new Error(`Bulk PDF generation failed: ${error.message}`);
        }
    }
}

module.exports = PDFGenerator;