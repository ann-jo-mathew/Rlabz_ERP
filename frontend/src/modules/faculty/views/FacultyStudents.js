import '../faculty.css';

export function FacultyStudents() {

    const students = [
        {
            id: 'STU001',
            name: 'Sandra',
            email: 'sandra@example.com',
            project: 'RLabZ ERP',
            designation: 'Nova'
        },
        {
            id: 'STU002',
            name: 'Anju',
            email: 'anju@example.com',
            project: 'RLabZ ERP',
            designation: 'Orbit'
        },
        {
            id: 'STU003',
            name: 'Rahul',
            email: 'rahul@example.com',
            project: 'RLabZ ERP',
            designation: 'Spark'
        },
        {
            id: 'STU004',
            name: 'Neha',
            email: 'neha@example.com',
            project: 'Student Management System',
            designation: 'Orbit'
        },
        {
            id: 'STU005',
            name: 'Arun',
            email: 'arun@example.com',
            project: 'Hospital Management System',
            designation: 'Spark'
        }
    ];

    const container = document.createElement('div');

    container.className = 'faculty-students';

    container.innerHTML = `
        <div class="page-header">
            <h1>Students</h1>
            <p>Students assigned to your projects.</p>
        </div>

        <div class="faculty-student-toolbar">

            <input
                type="text"
                id="faculty-student-search"
                placeholder="Search students..."
            />

        </div>

        <div class="faculty-student-table-container">

            <table class="faculty-student-table">

                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Project</th>
                        <th>Designation</th>
                        <th>Action</th>
                    </tr>
                </thead>

                <tbody id="faculty-student-table-body">

                    ${students.map(student => `
                        <tr>

                            <td>${student.id}</td>

                            <td>
                                <strong>${student.name}</strong>
                            </td>

                            <td>${student.email}</td>

                            <td>${student.project}</td>

                            <td>
                                <span class="faculty-designation ${student.designation.toLowerCase()}">
                                    ${student.designation}
                                </span>
                            </td>

                            <td>
                                <button
                                    class="faculty-student-view"
                                    data-student="${student.id}">
                                    View
                                </button>
                            </td>

                        </tr>
                    `).join('')}

                </tbody>

            </table>

        </div>
    `;

    // Student search
    const searchInput = container.querySelector(
        '#faculty-student-search'
    );

    const tableBody = container.querySelector(
        '#faculty-student-table-body'
    );

    searchInput.addEventListener('input', () => {

        const searchValue = searchInput.value.toLowerCase();

        const filteredStudents = students.filter(student =>
            student.name.toLowerCase().includes(searchValue) ||
            student.email.toLowerCase().includes(searchValue) ||
            student.project.toLowerCase().includes(searchValue) ||
            student.designation.toLowerCase().includes(searchValue)
        );

        tableBody.innerHTML = filteredStudents.map(student => `
            <tr>

                <td>${student.id}</td>

                <td>
                    <strong>${student.name}</strong>
                </td>

                <td>${student.email}</td>

                <td>${student.project}</td>

                <td>
                    <span class="faculty-designation ${student.designation.toLowerCase()}">
                        ${student.designation}
                    </span>
                </td>

                <td>
                    <button
                        class="faculty-student-view"
                        data-student="${student.id}">
                        View
                    </button>
                </td>

            </tr>
        `).join('');

    });

    return container;
}

export default FacultyStudents;