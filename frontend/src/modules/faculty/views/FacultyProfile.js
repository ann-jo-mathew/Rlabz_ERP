import '../faculty.css';

export function FacultyProjects() {

    const projects = [
        {
            id: 1,
            name: 'RLabZ ERP',
            client: 'Rajagiri College',
            type: 'ERP',
            status: 'In Progress',
            progress: 70,
            students: 5,
            github: 'Verified'
        },
        {
            id: 2,
            name: 'Student Management System',
            client: 'Computer Science Department',
            type: 'Web Application',
            status: 'In Progress',
            progress: 50,
            students: 4,
            github: 'Pending'
        },
        {
            id: 3,
            name: 'Hospital Management System',
            client: 'ABC Hospital',
            type: 'Web Application',
            status: 'In Progress',
            progress: 35,
            students: 3,
            github: 'Pending'
        }
    ];

    // Temporary student data
    // This will later come from the Laravel API.
    const availableStudents = [
        {
            id: 'STU001',
            name: 'Sandra'
        },
        {
            id: 'STU002',
            name: 'Anju'
        },
        {
            id: 'STU003',
            name: 'Rahul'
        },
        {
            id: 'STU004',
            name: 'Neha'
        },
        {
            id: 'STU005',
            name: 'Arun'
        },
        {
            id: 'STU006',
            name: 'Meera'
        },
        {
            id: 'STU007',
            name: 'Adithya'
        },
        {
            id: 'STU008',
            name: 'Akhil'
        }
    ];

    const container = document.createElement('div');

    container.className = 'faculty-projects';

    container.innerHTML = `
        <div class="page-header">
            <h1>My Projects</h1>
            <p>Projects assigned to you.</p>
        </div>

        <div class="faculty-project-grid">

            ${projects.map(project => `
                <div class="faculty-project-detail-card">

                    <div class="project-card-header">

                        <div>
                            <h2>${project.name}</h2>
                            <p>${project.client}</p>
                        </div>

                        <span class="faculty-status active">
                            ${project.status}
                        </span>

                    </div>

                    <div class="project-information">

                        <div>
                            <span>Project Type</span>
                            <strong>${project.type}</strong>
                        </div>

                        <div>
                            <span>Students</span>
                            <strong>${project.students}</strong>
                        </div>

                        <div>
                            <span>GitHub</span>
                            <strong>${project.github}</strong>
                        </div>

                    </div>

                    <div class="faculty-project-progress">

                        <div class="progress-header">
                            <span>Project Progress</span>
                            <strong>${project.progress}%</strong>
                        </div>

                        <div class="progress-bar">
                            <div
                                class="progress-fill"
                                style="width:${project.progress}%">
                            </div>
                        </div>

                    </div>

                    <button
                        class="faculty-project-view"
                        data-project-id="${project.id}">
                        View Project
                    </button>

                </div>
            `).join('')}

        </div>

        <!-- Project Details -->
        <div
            id="faculty-project-details"
            class="faculty-project-details"
            style="display:none;">
        </div>
    `;

    /*
     * Open project details
     */
    const projectButtons = container.querySelectorAll(
        '.faculty-project-view'
    );

    projectButtons.forEach(button => {

        button.addEventListener('click', () => {

            const projectId = button.dataset.projectId;

            const project = projects.find(
                item => item.id == projectId
            );

            openProjectDetails(project);

        });

    });

    /*
     * Project detail + student assignment
     */
    function openProjectDetails(project) {

        const detailsContainer = container.querySelector(
            '#faculty-project-details'
        );

        detailsContainer.style.display = 'block';

        detailsContainer.innerHTML = `

            <div class="faculty-project-detail-header">

                <div>
                    <h2>${project.name}</h2>
                    <p>${project.client}</p>
                </div>

                <button
                    id="faculty-close-project"
                    class="faculty-close-button">
                    ✕
                </button>

            </div>

            <div class="faculty-project-info">

                <div>
                    <span>Project Type</span>
                    <strong>${project.type}</strong>
                </div>

                <div>
                    <span>Status</span>
                    <strong>${project.status}</strong>
                </div>

                <div>
                    <span>Progress</span>
                    <strong>${project.progress}%</strong>
                </div>

            </div>


            <!-- ASSIGN STUDENTS -->

            <div class="faculty-assignment-section">

                <div class="faculty-section-header">

                    <div>
                        <h2>Assign Students</h2>
                        <p>
                            Assign students to this project based on
                            their designation.
                        </p>
                    </div>

                </div>


                <div class="faculty-assignment-grid">


                    <!-- NOVA -->

                    <div class="faculty-assignment-card nova">

                        <div class="designation-icon">
                            N
                        </div>

                        <h3>Nova</h3>

                        <p>
                            Lead Developer Track
                        </p>

                        <select
                            id="nova-student"
                            class="faculty-student-select">

                            <option value="">
                                Select Nova student
                            </option>

                            ${availableStudents.map(student => `
                                <option value="${student.id}">
                                    ${student.name}
                                </option>
                            `).join('')}

                        </select>

                    </div>


                    <!-- ORBIT -->

                    <div class="faculty-assignment-card orbit">

                        <div class="designation-icon">
                            O
                        </div>

                        <h3>Orbit</h3>

                        <p>
                            Developer Track
                        </p>

                        <select
                            id="orbit-student"
                            class="faculty-student-select">

                            <option value="">
                                Select Orbit student
                            </option>

                            ${availableStudents.map(student => `
                                <option value="${student.id}">
                                    ${student.name}
                                </option>
                            `).join('')}

                        </select>

                    </div>


                    <!-- SPARK -->

                    <div class="faculty-assignment-card spark">

                        <div class="designation-icon">
                            S
                        </div>

                        <h3>Spark</h3>

                        <p>
                            Learner Intern Track
                        </p>

                        <select
                            id="spark-student"
                            class="faculty-student-select">

                            <option value="">
                                Select Spark student
                            </option>

                            ${availableStudents.map(student => `
                                <option value="${student.id}">
                                    ${student.name}
                                </option>
                            `).join('')}

                        </select>

                    </div>

                </div>


                <div class="faculty-assignment-actions">

                    <button
                        id="faculty-assign-students"
                        class="faculty-assign-button">

                        Assign Students

                    </button>

                </div>

                <div
                    id="faculty-assignment-message"
                    class="faculty-assignment-message">
                </div>

            </div>
        `;


        /*
         * Close project details
         */

        const closeButton = detailsContainer.querySelector(
            '#faculty-close-project'
        );

        closeButton.addEventListener('click', () => {

            detailsContainer.style.display = 'none';

        });


        /*
         * Assign students
         */

        const assignButton = detailsContainer.querySelector(
            '#faculty-assign-students'
        );

        assignButton.addEventListener('click', () => {

            const novaStudent =
                detailsContainer.querySelector(
                    '#nova-student'
                ).value;

            const orbitStudent =
                detailsContainer.querySelector(
                    '#orbit-student'
                ).value;

            const sparkStudent =
                detailsContainer.querySelector(
                    '#spark-student'
                ).value;


            if (
                !novaStudent &&
                !orbitStudent &&
                !sparkStudent
            ) {

                alert('Please select at least one student.');

                return;

            }


            const message =
                detailsContainer.querySelector(
                    '#faculty-assignment-message'
                );


            message.innerHTML = `
                <div class="assignment-success">
                    ✓ Students assigned successfully.
                </div>
            `;

        });

    }

    return container;
}

export default FacultyProjects;