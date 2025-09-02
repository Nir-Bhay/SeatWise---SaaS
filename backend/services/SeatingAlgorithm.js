class SeatingAlgorithm {
    constructor() {
        this.arrangements = {
            horizontal: this.arrangeHorizontal.bind(this),
            vertical: this.arrangeVertical.bind(this)
        };
    }

    // Main seating generation method
    generateSeating(students, room, rules = {}) {
        // Apply filters and sorting
        const filteredStudents = this.applyFilters(students, rules);
        const sortedStudents = this.applySorting(filteredStudents, rules);

        // Generate arrangement based on type
        const arrangement = rules.arrangement || 'vertical';
        const grid = this.arrangements[arrangement](sortedStudents, room, rules);

        return {
            grid,
            totalStudents: sortedStudents.length,
            roomCapacity: room.capacity,
            utilization: ((sortedStudents.length / room.capacity) * 100).toFixed(1)
        };
    }

    // Horizontal arrangement (row-wise filling)
    arrangeHorizontal(students, room, rules) {
        const grid = this.createEmptyGrid(room.rows, room.columns);
        let studentIndex = 0;

        for (let row = 0; row < room.rows; row++) {
            // Skip rows if specified in rules
            if (rules.skipRows && (row + 1) % (rules.skipRows + 1) === 0) {
                continue;
            }

            for (let col = 0; col < room.columns; col++) {
                if (studentIndex < students.length) {
                    // Check for double columns
                    const isDoubleColumn = rules.doubleColumns && rules.doubleColumns.includes(col + 1);

                    if (isDoubleColumn && studentIndex + 1 < students.length) {
                        grid[row][col] = [students[studentIndex], students[studentIndex + 1]];
                        studentIndex += 2;
                    } else {
                        grid[row][col] = students[studentIndex];
                        studentIndex++;
                    }
                }
            }
        }

        return grid;
    }

    // Vertical arrangement (column-wise filling)
    arrangeVertical(students, room, rules) {
        const grid = this.createEmptyGrid(room.rows, room.columns);
        let studentIndex = 0;

        for (let col = 0; col < room.columns; col++) {
            for (let row = 0; row < room.rows; row++) {
                // Skip rows if specified in rules
                if (rules.skipRows && (row + 1) % (rules.skipRows + 1) === 0) {
                    continue;
                }

                if (studentIndex < students.length) {
                    // Check for double columns
                    const isDoubleColumn = rules.doubleColumns && rules.doubleColumns.includes(col + 1);

                    if (isDoubleColumn && studentIndex + 1 < students.length) {
                        grid[row][col] = [students[studentIndex], students[studentIndex + 1]];
                        studentIndex += 2;
                    } else {
                        grid[row][col] = students[studentIndex];
                        studentIndex++;
                    }
                }
            }
        }

        return grid;
    }

    // Create empty grid
    createEmptyGrid(rows, columns) {
        return Array(rows).fill().map(() => Array(columns).fill(null));
    }

    // Apply filters (attendance, status, etc.)
    applyFilters(students, rules) {
        return students.filter(student => {
            // Attendance filter
            if (rules.minAttendance && student.attendancePercent < rules.minAttendance) {
                return false;
            }

            // Status filter
            if (rules.allowedStatus && !rules.allowedStatus.includes(student.status)) {
                return false;
            }

            // Fee status filter
            if (rules.allowedFeeStatus && !rules.allowedFeeStatus.includes(student.feeStatus)) {
                return false;
            }

            return true;
        });
    }

    // Apply sorting for branch mixing and anti-cheating
    applySorting(students, rules) {
        if (rules.branchMixing) {
            return this.mixBranches(students);
        } else {
            return this.sortByBranch(students);
        }
    }

    // Mix different branches to prevent cheating
    mixBranches(students) {
        const branchGroups = {};

        // Group students by branch
        students.forEach(student => {
            if (!branchGroups[student.branch]) {
                branchGroups[student.branch] = [];
            }
            branchGroups[student.branch].push(student);
        });

        // Shuffle each branch group
        Object.keys(branchGroups).forEach(branch => {
            branchGroups[branch] = this.shuffleArray(branchGroups[branch]);
        });

        // Interleave branches
        const branches = Object.keys(branchGroups);
        const result = [];
        let maxLength = Math.max(...Object.values(branchGroups).map(arr => arr.length));

        for (let i = 0; i < maxLength; i++) {
            branches.forEach(branch => {
                if (branchGroups[branch][i]) {
                    result.push(branchGroups[branch][i]);
                }
            });
        }

        return result;
    }

    // Sort students by branch (for single branch exams)
    sortByBranch(students) {
        return students.sort((a, b) => {
            if (a.branch !== b.branch) {
                return a.branch.localeCompare(b.branch);
            }
            return a.enrollmentNo.localeCompare(b.enrollmentNo);
        });
    }

    // Shuffle array utility
    // Shuffle array utility
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Multi-room allocation
    allocateMultipleRooms(students, rooms, rules) {
        const allocations = [];
        let remainingStudents = [...students];

        rooms.forEach(room => {
            if (remainingStudents.length === 0) return;

            const roomStudents = remainingStudents.splice(0, room.capacity);
            const seating = this.generateSeating(roomStudents, room, rules);

            allocations.push({
                room,
                seating,
                students: roomStudents
            });
        });

        return {
            allocations,
            unallocatedStudents: remainingStudents
        };
    }
}

module.exports = SeatingAlgorithm;