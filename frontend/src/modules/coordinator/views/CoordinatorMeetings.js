export function CoordinatorMeetings(route, router) {
  const container = document.createElement('div');
  container.className = 'coordinator-dashboard';

  const meetings = [
    {
      date: '12 Aug 2026',
      time: '10:30 AM',
      title: 'Client Requirement Discussion',
      project: 'Smart Campus Management',
      participants: 'Anjali, Rahul, Dr. Thomas',
      status: 'Scheduled'
    },
    {
      date: '13 Aug 2026',
      time: '2:00 PM',
      title: 'Project Progress Review',
      project: 'Online Food Ordering',
      participants: 'Neha, Arjun, Coordinator',
      status: 'Scheduled'
    },
    {
      date: '10 Aug 2026',
      time: '11:00 AM',
      title: 'Initial Client Meeting',
      project: 'Hospital Appointment System',
      participants: 'Meera, Client Team',
      status: 'Completed'
    }
  ];

  function render() {
    container.innerHTML = `
      <div class="coordinator-header">
        <div>
          <h1>Meetings</h1>
          <p>Arrange and document meetings between students, clients and RLabZ members.</p>
        </div>

        <button class="coordinator-primary-btn" id="add-meeting-btn">
          + Arrange Meeting
        </button>
      </div>

      <div class="coordinator-panel">
        <div class="coordinator-panel-header">
          <div>
            <h2>Project Meetings</h2>
            <p>Upcoming and completed project meetings.</p>
          </div>
        </div>

        <div class="coordinator-table-wrapper">
          <table class="coordinator-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Meeting</th>
                <th>Project</th>
                <th>Participants</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              ${meetings.map(meeting => `
                <tr>
                  <td>
                    <strong>${meeting.date}</strong><br>
                    <small>${meeting.time}</small>
                  </td>

                  <td>${meeting.title}</td>

                  <td>${meeting.project}</td>

                  <td>${meeting.participants}</td>

                  <td>
                    <span class="project-status ${
                      meeting.status.toLowerCase()
                    }">
                      ${meeting.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div id="meeting-modal-root"></div>
    `;

    container
      .querySelector('#add-meeting-btn')
      ?.addEventListener('click', showMeetingForm);
  }

  function showMeetingForm() {
    const root = container.querySelector('#meeting-modal-root');

    root.innerHTML = `
      <div class="coordinator-modal-overlay">

        <div class="coordinator-modal">

          <div class="coordinator-modal-header">
            <div>
              <h2>Arrange Meeting</h2>
              <p>Schedule a project-related meeting.</p>
            </div>

            <button id="close-meeting" class="coordinator-close-btn">
              ×
            </button>
          </div>

          <form id="meeting-form">

            <div class="coordinator-form-grid">

              <div class="coordinator-form-group">
                <label>Meeting Title *</label>
                <input
                  name="title"
                  placeholder="e.g. Client Requirement Discussion"
                  required
                >
              </div>

              <div class="coordinator-form-group">
                <label>Project *</label>
                <select name="project" required>
                  <option value="">Select project</option>
                  <option>Smart Campus Management</option>
                  <option>Online Food Ordering</option>
                  <option>Hospital Appointment System</option>
                </select>
              </div>

              <div class="coordinator-form-group">
                <label>Date *</label>
                <input type="date" name="date" required>
              </div>

              <div class="coordinator-form-group">
                <label>Time *</label>
                <input type="time" name="time" required>
              </div>

              <div class="coordinator-form-group full-width">
                <label>Participants</label>
                <input
                  name="participants"
                  placeholder="Students / Faculty / Client"
                >
              </div>

              <div class="coordinator-form-group full-width">
                <label>Meeting Notes</label>
                <textarea
                  rows="4"
                  placeholder="Add meeting agenda or notes..."
                ></textarea>
              </div>

            </div>

            <div class="coordinator-modal-footer">

              <button
                type="button"
                id="cancel-meeting"
                class="coordinator-secondary-btn">
                Cancel
              </button>

              <button
                type="submit"
                class="coordinator-primary-btn">
                Schedule Meeting
              </button>

            </div>

          </form>

        </div>
      </div>
    `;

    const close = () => {
      root.innerHTML = '';
    };

    root.querySelector('#close-meeting').addEventListener('click', close);
    root.querySelector('#cancel-meeting').addEventListener('click', close);

    root.querySelector('#meeting-form').addEventListener('submit', e => {
      e.preventDefault();

      alert('Meeting scheduled successfully!');
      close();
    });
  }

  render();

  return container;
}

export default CoordinatorMeetings;