import '../GithubHome.css';

const repositories = [
    {
        projectName: 'Hospital Management System',
        students: ['Sandra', 'Anu', 'Riya'],
        repository: 'https://github.com/ann-jo-mathew/hospital-management',
        submittedDate: '09 Aug 2026',
        status: 'Pending Verification'
    },
    {
        projectName: 'RLabZ ERP',
        students: ['Anu', 'Sam', 'Lena'],
        repository: 'https://github.com/ann-jo-mathew/Rlabz_ERP',
        submittedDate: '08 Aug 2026',
        status: 'Verified'
    },
    {
        projectName: 'Booking System',
        students: ['Arun', 'Megha'],
        repository: 'https://github.com/student/temple-booking',
        submittedDate: '07 Aug 2026',
        status: 'Pending Verification'
    }
];

export function FacultyGithub(route, router) {

    const container = document.createElement('div');

    container.className = 'faculty-github';

    container.innerHTML = `
        <div class="page-header">
            <h1>GitHub Repositories</h1>
            <p>View and verify GitHub repositories of your assigned projects.</p>
        </div>

        <div class="faculty-github-search">
            <input
                type="text"
                id="github-project-search"
                placeholder="🔍 Search project by name..."
            />
        </div>

        <div id="github-repository-list"></div>
    `;

    const repositoryList = container.querySelector(
        '#github-repository-list'
    );

    const searchInput = container.querySelector(
        '#github-project-search'
    );

    function displayRepositories(data) {

        if (data.length === 0) {

            repositoryList.innerHTML = `
                <div class="github-empty">
                    <h3>No projects found</h3>
                    <p>No GitHub repository matches your search.</p>
                </div>
            `;

            return;
        }

        repositoryList.innerHTML = data
            .map((repo, index) => {

                const statusClass =
                    repo.status === 'Verified'
                        ? 'github-status-verified'
                        : 'github-status-pending';

                return `
                    <div class="github-project-card">

                        <div class="github-project-header">

                            <div>
                                <h2>${repo.projectName}</h2>

                                <p class="github-student-count">
                                    ${repo.students.length} students assigned
                                </p>
                            </div>

                            <span class="github-status ${statusClass}">
                                ${repo.status}
                            </span>

                        </div>

                        <div class="github-project-body">

                            <div class="github-info">

                                <span class="github-label">
                                    Students
                                </span>

                                <p>
                                    ${repo.students.join(', ')}
                                </p>

                            </div>

                            <div class="github-info">

                                <span class="github-label">
                                    Repository
                                </span>

                                <a
                                    href="${repo.repository}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="github-repository-link"
                                >
                                    ${repo.repository}
                                </a>

                            </div>

                            <div class="github-info">

                                <span class="github-label">
                                    Submitted Date
                                </span>

                                <p>
                                    ${repo.submittedDate}
                                </p>

                            </div>

                        </div>

                        <div class="github-project-actions">

                            <a
                                href="${repo.repository}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="github-view-button"
                            >
                                View Repository
                            </a>

                            ${
                                repo.status === 'Pending Verification'
                                    ? `
                                        <button
                                            class="github-verify-button"
                                            data-index="${index}"
                                        >
                                            Mark as Verified
                                        </button>
                                    `
                                    : `
                                        <button
                                            class="github-verified-button"
                                            disabled
                                        >
                                            ✓ Verified
                                        </button>
                                    `
                            }

                        </div>

                    </div>
                `;

            })
            .join('');

        container
            .querySelectorAll('.github-verify-button')
            .forEach((button) => {

                button.addEventListener('click', () => {

                    const index = Number(button.dataset.index);

                    repositories[index].status = 'Verified';

                    applySearch();

                });

            });
    }

    function applySearch() {

        const searchText = searchInput.value
            .toLowerCase()
            .trim();

        const filteredRepositories = repositories.filter((repo) =>
            repo.projectName
                .toLowerCase()
                .includes(searchText)
        );

        displayRepositories(filteredRepositories);
    }

    searchInput.addEventListener(
        'input',
        applySearch
    );

    displayRepositories(repositories);

    return container;
}

export default FacultyGithub;