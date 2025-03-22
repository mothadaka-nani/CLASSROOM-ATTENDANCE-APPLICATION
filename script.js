// Global Variables
const students = JSON.parse(localStorage.getItem("students")) || ["John Doe", "Alice Smith", "Bob Johnson", "Emma Watson"];
const attendanceData = JSON.parse(localStorage.getItem("attendanceData")) || {};

// Check if the user is logged in
function checkLogin() {
    if (!localStorage.getItem("isLoggedIn")) {
        window.location.href = "login.html";
    }
    document.getElementById("attendanceDate").max = new Date().toISOString().split("T")[0];
    loadStudentSelect();
    updateTable();
    renderStudentList();
    renderAttendanceGraph(); // Render the graph on page load
}

// Logout Function
function logout() {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
}

// Add a new student to the class
function addNewStudent() {
    const newStudentName = document.getElementById("newStudentName").value.trim();

    if (newStudentName) {
        // Check if the student already exists
        if (students.includes(newStudentName)) {
            alert("Student already exists!");
            return;
        }

        // Add the new student to the list
        students.push(newStudentName);
        localStorage.setItem("students", JSON.stringify(students)); // Save to localStorage

        // Update the student select dropdown
        loadStudentSelect();

        // Clear the input field
        document.getElementById("newStudentName").value = "";

        // Update the attendance table
        updateTable();

        // Update the graph
        renderAttendanceGraph();

        alert("Student added successfully!");
    } else {
        alert("Please enter a valid student name.");
    }
}

// Function to toggle the visibility of the student list
function toggleStudentList() {
    const studentListContainer = document.getElementById("studentList");
    if (studentListContainer.style.display === "none") {
        studentListContainer.style.display = "block"; // Show the list
        renderStudentList(); // Render the list when it becomes visible
    } else {
        studentListContainer.style.display = "none"; // Hide the list
    }
}

// Function to remove a student
function removeStudent(studentName) {
    if (confirm(`Are you sure you want to remove ${studentName} from the class?`)) {
        const index = students.indexOf(studentName);
        if (index !== -1) {
            students.splice(index, 1); // Remove the student from the array
            localStorage.setItem("students", JSON.stringify(students)); // Update localStorage

            // Remove the student's attendance data
            Object.keys(attendanceData).forEach(date => {
                if (attendanceData[date][studentName]) {
                    delete attendanceData[date][studentName];
                }
            });
            localStorage.setItem("attendanceData", JSON.stringify(attendanceData)); // Update localStorage

            // Refresh the UI
            loadStudentList();
            loadStudentSelect();
            updateTable();
            renderStudentList();
            renderAttendanceGraph(); // Update the graph
            alert(`${studentName} has been removed from the class.`);
        }
    }
}

// Function to render the student list with remove buttons
function renderStudentList() {
    const container = document.getElementById("studentList");
    container.innerHTML = "";

    students.forEach(student => {
        const div = document.createElement("div");
        div.className = "student-item";
        div.innerHTML = `
            <span>${student}</span>
            <button onclick="removeStudent('${student}')" class="remove-btn">Remove</button>
        `;
        container.appendChild(div);
    });
}

// Load the student list for marking attendance
function loadStudentList() {
    const date = document.getElementById("attendanceDate").value;
    if (!date) return;

    const container = document.getElementById("studentListContainer");
    container.innerHTML = "";

    students.forEach(name => {
        const div = document.createElement("div");
        div.className = "radio-group";

        // Present Radio Button
        const presentLabel = document.createElement("label");
        presentLabel.className = "radio-label";
        presentLabel.innerHTML = `
            <input type="radio" name="${name}" value="Present" checked> Present
        `;

        // Absent Radio Button
        const absentLabel = document.createElement("label");
        absentLabel.className = "radio-label";
        absentLabel.innerHTML = `
            <input type="radio" name="${name}" value="Absent"> Absent
        `;

        // Add radio buttons to the group
        div.appendChild(document.createTextNode(name)); // Student name
        div.appendChild(presentLabel); // Present option
        div.appendChild(absentLabel); // Absent option

        // Add the group to the container
        container.appendChild(div);
    });
}

// Save attendance for the selected date
function saveAttendance() {
    const date = document.getElementById("attendanceDate").value;
    if (!date) {
        alert("Please select a date.");
        return;
    }

    // Check if attendance for this date already exists
    if (attendanceData[date]) {
        alert("Attendance for this date has already been recorded. Please select a different date.");
        return;
    }

    // Initialize attendance data for the selected date
    attendanceData[date] = {};

    // Save attendance status for each student
    students.forEach(name => {
        const status = document.querySelector(`input[name="${name}"]:checked`).value;
        attendanceData[date][name] = status;
    });

    // Save to localStorage
    localStorage.setItem("attendanceData", JSON.stringify(attendanceData));

    // Update the UI
    updateTable();
    renderAttendanceGraph(); // Update the graph
    alert("Attendance saved successfully!");
}

// Update the attendance table
function updateTable() {
    const tableBody = document.getElementById("attendanceTable");
    tableBody.innerHTML = "";

    students.forEach(student => {
        let presentCount = 0, totalCount = 0;

        Object.keys(attendanceData).forEach(date => {
            if (attendanceData[date][student]) {
                totalCount++;
                if (attendanceData[date][student] === "Present") {
                    presentCount++;
                }
            }
        });

        let percentage = totalCount ? ((presentCount / totalCount) * 100).toFixed(2) + "%" : "0%";
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${student}</td>
            <td>${percentage}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Load the student select dropdown
function loadStudentSelect() {
    const select = document.getElementById("studentSelect");
    select.innerHTML = `<option value="" disabled selected>Select a Student</option>`;

    students.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

// Load attendance history for a selected student
function loadStudentAttendance() {
    const student = document.getElementById("studentSelect").value;
    const container = document.getElementById("attendanceHistoryContainer");
    container.innerHTML = "";

    if (!student) return;

    // Create a table to display attendance history
    const table = document.createElement("table");
    table.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody id="attendanceHistoryBody"></tbody>
    `;
    container.appendChild(table);

    const tbody = document.getElementById("attendanceHistoryBody");

    // Populate the table with attendance data
    Object.keys(attendanceData).forEach(date => {
        if (attendanceData[date][student]) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${date}</td>
                <td>
                    <select onchange="updateAttendanceStatus('${date}', '${student}', this.value)">
                        <option value="Present" ${attendanceData[date][student] === "Present" ? "selected" : ""}>Present</option>
                        <option value="Absent" ${attendanceData[date][student] === "Absent" ? "selected" : ""}>Absent</option>
                    </select>
                </td>
            `;
            tbody.appendChild(row);
        }
    });
}

// Save edited attendance data
function saveEditedAttendance() {
    const student = document.getElementById("studentSelect").value;
    if (!student) {
        alert("Please select a student.");
        return;
    }

    // Update attendance data in localStorage
    localStorage.setItem("attendanceData", JSON.stringify(attendanceData));

    // Hide the attendance history table
    document.getElementById("attendanceHistoryContainer").innerHTML = "";

    // Show success message
    alert("Attendance updated successfully!");

    // Update the attendance table and graph
    updateTable();
    renderAttendanceGraph();
}

// Update attendance status for a specific date and student
function updateAttendanceStatus(date, student, status) {
    attendanceData[date][student] = status;
}

// Download attendance data as a CSV file
function downloadCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";

    // Create Header Row
    let dates = Object.keys(attendanceData);
    let header = "Name," + dates.join(",") + ",Attendance %\n";
    csvContent += header;

    // Create Data Rows
    students.forEach(student => {
        let presentCount = 0, totalCount = dates.length;
        let row = `${student}`;

        dates.forEach(date => {
            let status = attendanceData[date] && attendanceData[date][student] ? attendanceData[date][student] : "Absent";
            if (status === "Present") presentCount++;
            row += `,${status}`;
        });

        let percentage = totalCount ? ((presentCount / totalCount) * 100).toFixed(2) + "%" : "0%";
        row += `,${percentage}\n`;
        csvContent += row;
    });

    // Create & Download CSV
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "AttendanceRecords.csv");
    document.body.appendChild(link);
    link.click();
}

// Clear all attendance data
function clearAttendance() {
    const password = prompt("Enter password to clear attendance data:");
    if (password === "admin123") { // Replace "admin123" with your desired password
        if (confirm("Are you sure you want to delete all attendance records? This action cannot be undone!")) {
            localStorage.removeItem("attendanceData"); // Clears all stored attendance
            alert("Attendance records have been cleared!");
            location.reload(); // Refresh the page to reset the UI
        }
    } else {
        alert("Incorrect password. Action denied.");
    }
}

// Function to render the attendance graph
function renderAttendanceGraph() {
    const ctx = document.getElementById("attendanceChart").getContext("2d");

    // Prepare data for the chart
    const labels = students; // Student names (X-axis labels)
    const data = students.map(student => {
        let presentCount = 0, totalCount = 0;

        // Calculate attendance percentage for each student
        Object.keys(attendanceData).forEach(date => {
            if (attendanceData[date][student]) {
                totalCount++;
                if (attendanceData[date][student] === "Present") {
                    presentCount++;
                }
            }
        });

        // Return attendance percentage (or 0 if no data)
        return totalCount ? ((presentCount / totalCount) * 100).toFixed(2) : 0;
    });

    // Create the chart using Chart.js
    new Chart(ctx, {
        type: "bar", // Type of chart (bar chart)
        data: {
            labels: labels, // X-axis labels (student names)
            datasets: [{
                label: "Attendance Percentage", // Label for the dataset
                data: data, // Y-axis data (attendance percentages)
                backgroundColor: "rgba(0, 123, 255, 0.5)", // Bar color (blue with transparency)
                borderColor: "rgba(0, 123, 255, 1)", // Border color (solid blue)
                borderWidth: 1 // Border width
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true, // Start Y-axis from 0
                    max: 100, // Y-axis maximum value (100%)
                    title: {
                        display: true,
                        text: "Attendance Percentage (%)" // Y-axis title
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Students" // X-axis title
                    }
                }
            },
            plugins: {
                legend: {
                    display: true, // Show the legend
                    position: "top" // Position of the legend
                }
            }
        }
    });
}