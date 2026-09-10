import '../GithubHome.css';
import '../../faculty/faculty.css'; // Make sure we load the faculty styles too!

const repositories = [
    {
        projectName: 'Hospital Management System',
        students: ['Sandra', 'Anu', 'Riya'],
        repository: 'https://github.com/ann-jo-mathew/hospital-management',
        submittedDate: '09 Aug 2026',
        status: 'Pending Verification',
        messages: []
    },
    {
        projectName: 'RLabZ ERP',
        students: ['Anu', 'Sam', 'Lena'],
        repository: 'https://github.com/ann-jo-mathew/Rlabz_ERP',
        submittedDate: '08 Aug 2026',
        status: 'Verified',
        messages: []
    },
    {
        projectName: 'Booking System',
        students: ['Arun', 'Megha'],
        repository: 'https://github.com/student/temple-booking',
        submittedDate: '07 Aug 2026',
        status: 'Pending Verification',
        messages: []
    }
];

const gitLogs = {
    'Hospital Management System': [
        { author: 'Sandra', action: 'commit', message: 'feat: add patient registration form', date: '09 Aug 2026 10:15 AM', hash: 'e3f5b21' },
        { author: 'Anu', action: 'commit', message: 'fix: correct datepicker alignment', date: '08 Aug 2026 04:30 PM', hash: 'a129d3f' },
        { author: 'Riya', action: 'commit', message: 'docs: update setup documentation in README', date: '07 Aug 2026 11:00 AM', hash: 'c509f12' }
    ],
    'RLabZ ERP': [
        { author: 'Anu', action: 'commit', message: 'feat: integrate sprint schema verification', date: '08 Aug 2026 02:45 PM', hash: 'd9b23fa' },
        { author: 'Sam', action: 'commit', message: 'refactor: clean up unused layout imports', date: '07 Aug 2026 09:15 AM', hash: 'b3392ea' },
        { author: 'Lena', action: 'commit', message: 'fix: resolve routes redirect loops', date: '06 Aug 2026 06:20 PM', hash: '7c409fb' }
    ],
    'Booking System': [
        { author: 'Arun', action: 'commit', message: 'feat: create booking form UI mockup', date: '07 Aug 2026 05:10 PM', hash: '09da8fb' },
        { author: 'Megha', action: 'commit', message: 'init: initial repository upload', date: '06 Aug 2026 02:00 PM', hash: 'f210dcb' }
    ]
};

export function FacultyGithub(route, router) {

    const container = document.createElement('div');

    container.className = 'faculty-github';

    container.innerHTML = `
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.75rem;">
            <div>
                <h1>GitHub Repositories</h1>
                <p>View, verify, check activity logs, and message teams regarding their repositories.</p>
            </div>
            <div style="position: relative; width: 320px; max-width: 100%;">
                <input
                    type="text"
                    id="github-project-search"
                    class="premium-input"
                    placeholder="Search project by name..."
                    style="padding-left: 2.25rem; font-size: 0.88rem; height: 40px; border-radius: 8px;"
                />
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 13px; color: #94a3b8;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
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
                    <div class="github-project-card" data-project="${repo.projectName}">

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

                                <div style="display: flex; align-items: center; flex-wrap: wrap;">
                                    <a
                                        href="${repo.repository}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="github-repository-link"
                                    >
                                        ${repo.repository}
                                    </a>
                                    <button class="git-log-btn" data-project="${repo.projectName}">
                                        📋 View Logs
                                    </button>
                                </div>

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

                        <!-- Commits / Activity logs section -->
                        <div id="git-log-display-${index}" class="git-log-container" style="display: none;">
                            <h4 style="margin: 0 0 10px; font-size: 13px; color: #38bdf8;">GitHub Commit History Logs</h4>
                            <div class="git-log-entries-list">
                                ${(gitLogs[repo.projectName] || []).map(log => `
                                    <div class="git-log-entry">
                                        <div style="display: flex; justify-content: space-between; font-weight: bold; color: #f8fafc;">
                                            <span>${log.message}</span>
                                            <span style="color: #64748b; font-family: monospace;">[${log.hash}]</span>
                                        </div>
                                        <div style="font-size: 11px; color: #94a3b8; margin-top: 3px;">
                                            Author: <strong>${log.author}</strong> | Date: ${log.date}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Feedback and student messaging section -->
                        <div class="git-message-box">
                            <h4 style="margin: 0 0 6px; font-size: 13px; color: #475569;">Send Message / Instruction to Team:</h4>
                            
                            <div id="team-messages-display-${index}" style="${repo.messages.length > 0 ? 'margin-bottom: 10px;' : 'display: none;'}">
                                <span style="font-weight: 700; font-size: 11px; color: #087f5b; display: block; margin-bottom: 4px;">Sent Instructions:</span>
                                <div id="messages-list-${index}" style="display: flex; flex-direction: column; gap: 5px;">
                                    ${repo.messages.map(m => `
                                        <div style="font-size: 12px; color: #334155; padding: 6px 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 5px;">
                                            ${m}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <div style="display: flex; gap: 10px;">
                                <textarea id="git-msg-input-${index}" placeholder="Type instruction/message regarding this repo..." required></textarea>
                                <button class="git-message-btn" data-index="${index}">Send</button>
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

        // Bind Mark as Verified button
        container
            .querySelectorAll('.github-verify-button')
            .forEach((button) => {

                button.addEventListener('click', () => {

                    const index = Number(button.dataset.index);

                    repositories[index].status = 'Verified';

                    applySearch();

                });

            });

        // Bind View Logs button
        container.querySelectorAll('.git-log-btn').forEach((button, idx) => {
            button.addEventListener('click', () => {
                const logDisplay = container.querySelector(`#git-log-display-${idx}`);
                if (logDisplay) {
                    const isHidden = logDisplay.style.display === 'none';
                    logDisplay.style.display = isHidden ? 'block' : 'none';
                    button.textContent = isHidden ? '🙈 Hide Logs' : '📋 View Logs';
                }
            });
        });

        // Bind Send Message to Team button
        container.querySelectorAll('.git-message-btn').forEach((button) => {
            button.addEventListener('click', () => {
                const index = Number(button.dataset.index);
                const input = container.querySelector(`#git-msg-input-${index}`);
                if (input && input.value.trim()) {
                    const msg = input.value.trim();
                    repositories[index].messages.push(msg);
                    input.value = '';

                    // Update UI immediately
                    const displayBox = container.querySelector(`#team-messages-display-${index}`);
                    const list = container.querySelector(`#messages-list-${index}`);
                    if (displayBox && list) {
                        list.innerHTML = repositories[index].messages.map(m => `
                            <div style="font-size: 12px; color: #334155; padding: 6px 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 5px;">
                                ${m}
                            </div>
                        `).join('');
                        displayBox.style.display = 'block';
                    }
                }
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