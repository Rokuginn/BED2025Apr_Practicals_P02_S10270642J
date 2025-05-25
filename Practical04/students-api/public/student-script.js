const studentsListDiv = document.getElementById("studentsList");
const fetchStudentsBtn = document.getElementById("fetchStudentsBtn");
const messageDiv = document.getElementById("message");
const apiBaseUrl = "http://localhost:3000";

async function fetchStudents() {
    try {
        studentsListDiv.innerHTML = "Loading students...";
        messageDiv.textContent = "";

        const response = await fetch(`${apiBaseUrl}/students`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const students = await response.json();
        
        studentsListDiv.innerHTML = "";
        if (students.length === 0) {
            studentsListDiv.innerHTML = "<p>No students found.</p>";
        } else {
            students.forEach(student => {
                const studentElement = document.createElement("div");
                studentElement.classList.add("student-item");
                studentElement.innerHTML = `
                    <h3>${student.name}</h3>
                    <p>Course: ${student.course}</p>
                    <p>ID: ${student.id}</p>
                    <button onclick="editStudent(${student.id})">Edit</button>
                    <button class="delete-btn" data-id="${student.id}">Delete</button>
                `;
                studentsListDiv.appendChild(studentElement);
            });
            
            document.querySelectorAll(".delete-btn").forEach(button => {
                button.addEventListener("click", handleDeleteClick);
            });
        }
    } catch (error) {
        console.error("Error fetching students:", error);
        studentsListDiv.innerHTML = `<p style="color: red;">Failed to load students: ${error.message}</p>`;
    }
}

function editStudent(studentId) {
    window.location.href = `edit-student.html?id=${studentId}`;
}

function handleDeleteClick(event) {
    const studentId = event.target.getAttribute("data-id");
    
    if (!confirm("Are you sure you want to delete this student?")) {
        return;
    }

    fetch(`${apiBaseUrl}/students/${studentId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.status === 204) {
            const studentElement = event.target.closest('.student-item');
            studentElement.remove();
            messageDiv.textContent = "Student deleted successfully";
            messageDiv.style.color = "green";
        } else {
            throw new Error(`Failed to delete student (${response.status})`);
        }
    })
    .catch(error => {
        console.error("Error deleting student:", error);
        messageDiv.textContent = `Error: ${error.message}`;
        messageDiv.style.color = "red";
    });
}

fetchStudentsBtn.addEventListener("click", fetchStudents);
window.addEventListener('load', fetchStudents);