import '../faculty.css';
import { API_BASE } from '@/core/config/api.js';
import { showFacultySuccessPopup, showFacultyErrorPopup } from '../facultyPopup.js';

export function FacultyProfile() {
    const container = document.createElement('div');
    container.className = 'faculty-profile';

    // Retrieve currently logged-in user from localStorage as immediate baseline
    let storedUser = null;
    try {
        storedUser = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        storedUser = null;
    }

    const token = localStorage.getItem('token');
    let facultyPhoto = localStorage.getItem('faculty_profile_photo') || storedUser?.avatar || null;

    // Default state derived from logged in user if available
    let facultyData = {
        name: storedUser?.name || 'Faculty Member',
        email: storedUser?.email || 'faculty@rajagiri.edu',
        phone: storedUser?.phone || '+91 484 2660605',
        role: storedUser?.role ? (storedUser.role.charAt(0).toUpperCase() + storedUser.role.slice(1)) : 'Faculty',
        department: 'Department of Computer Applications',
        designation: 'Associate Professor'
    };

    function updateTopbarAvatar(photoUrl) {
        const topbarAvatar = document.querySelector('.topbar .avatar');
        if (topbarAvatar) {
            if (photoUrl) {
                topbarAvatar.innerHTML = `<img src="${photoUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" />`;
                topbarAvatar.style.padding = '0';
                topbarAvatar.style.overflow = 'hidden';
            } else {
                const init = (facultyData.name || 'User').charAt(0).toUpperCase();
                topbarAvatar.textContent = init;
            }
        }
        const popoverAvatar = document.querySelector('#popover-avatar');
        if (popoverAvatar) {
            if (photoUrl) {
                popoverAvatar.innerHTML = `<img src="${photoUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" />`;
                popoverAvatar.style.padding = '0';
                popoverAvatar.style.overflow = 'hidden';
            } else {
                const init = (facultyData.name || 'User').charAt(0).toUpperCase();
                popoverAvatar.textContent = init;
            }
        }
    }

    function renderUI() {
        const initials = (facultyData.name || 'Faculty Member')
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        container.innerHTML = `
            <div class="page-header" style="margin-bottom: 22px;">
                <h1>Faculty Profile</h1>
                <p>Personal and academic profile details.</p>
            </div>

            <div class="simple-profile-container">
                <div class="simple-profile-card">
                    
                    <div class="simple-profile-avatar-wrap">
                        <div id="avatar-display" class="simple-profile-avatar">
                            ${facultyPhoto ? `
                                <img src="${facultyPhoto}" alt="${facultyData.name}" />
                            ` : `
                                <span>${initials}</span>
                            `}
                        </div>

                        <input type="file" id="faculty-photo-file-input" accept="image/*" style="display: none;" />

                        <div style="display: flex; flex-direction: column; gap: 5px; align-items: center; width: 100%;">
                            <button type="button" id="btn-upload-photo" class="btn btn-sm" style="font-size: 0.75rem; padding: 0.32rem 0.7rem; background: #ffffff; border: 1px solid var(--primary); color: var(--primary); border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                                ${facultyPhoto ? 'Change Photo' : 'Upload Photo'}
                            </button>

                            ${facultyPhoto ? `
                                <button type="button" id="btn-remove-photo" style="background: none; border: none; font-size: 0.72rem; color: #dc2626; cursor: pointer; text-decoration: underline; padding: 0;">
                                    Remove Photo
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <div class="simple-profile-details">
                        <div class="simple-profile-header">
                            <h2>${facultyData.name}</h2>
                            <span class="simple-profile-badge">${facultyData.role}</span>
                        </div>

                        <div class="simple-profile-grid">
                            <div class="simple-profile-field">
                                <span class="label">Full Name</span>
                                <div class="value">${facultyData.name}</div>
                            </div>

                            <div class="simple-profile-field">
                                <span class="label">Email Address</span>
                                <div class="value">${facultyData.email}</div>
                            </div>

                            <div class="simple-profile-field">
                                <span class="label">Phone Number</span>
                                <div class="value">${facultyData.phone || 'Not provided'}</div>
                            </div>

                            <div class="simple-profile-field">
                                <span class="label">Department</span>
                                <div class="value">${facultyData.department}</div>
                            </div>

                            <div class="simple-profile-field">
                                <span class="label">Designation</span>
                                <div class="value">${facultyData.designation}</div>
                            </div>

                            <div class="simple-profile-field">
                                <span class="label">Account Status</span>
                                <div class="value" style="color: var(--primary); display: flex; align-items: center; gap: 6px;">
                                    <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary-accent); display: inline-block;"></span>
                                    Active
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }

    function setupListeners() {
        const btnUpload = container.querySelector('#btn-upload-photo');
        const fileInput = container.querySelector('#faculty-photo-file-input');
        const btnRemove = container.querySelector('#btn-remove-photo');

        if (btnUpload && fileInput) {
            btnUpload.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                    showFacultyErrorPopup('Invalid File', 'Please select a valid image file (PNG, JPG, JPEG, WEBP).');
                    return;
                }

                if (file.size > 5 * 1024 * 1024) {
                    showFacultyErrorPopup('File Too Large', 'Please select an image smaller than 5MB.');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (readEvent) => {
                    const dataUrl = readEvent.target.result;
                    facultyPhoto = dataUrl;
                    localStorage.setItem('faculty_profile_photo', dataUrl);
                    if (storedUser) {
                        storedUser.avatar = dataUrl;
                        localStorage.setItem('user', JSON.stringify(storedUser));
                    }
                    updateTopbarAvatar(dataUrl);
                    showFacultySuccessPopup('Profile Photo Updated', 'Your profile photo has been updated successfully.');
                    renderUI();
                    setupListeners();
                };
                reader.readAsDataURL(file);
            });
        }

        if (btnRemove) {
            btnRemove.addEventListener('click', () => {
                facultyPhoto = null;
                localStorage.removeItem('faculty_profile_photo');
                if (storedUser) {
                    delete storedUser.avatar;
                    localStorage.setItem('user', JSON.stringify(storedUser));
                }
                updateTopbarAvatar(null);
                showFacultySuccessPopup('Photo Removed', 'Profile photo removed. Default initials avatar restored.');
                renderUI();
                setupListeners();
            });
        }
    }

    // Fetch latest details from users table via API
    async function loadFacultyProfile() {
        try {
            const apiBase = API_BASE;
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            
            const queryParam = storedUser?.email ? `?email=${encodeURIComponent(storedUser.email)}` : '';
            const res = await fetch(`${apiBase}/faculty/profile${queryParam}`, { headers });
            if (res.ok) {
                const data = await res.json();
                if (data && data.name) {
                    facultyData = {
                        name: data.name,
                        email: data.email,
                        phone: data.phone || 'Not provided',
                        role: data.role || 'Faculty',
                        department: data.department || 'Department of Computer Applications',
                        designation: data.designation || 'Associate Professor'
                    };
                    renderUI();
                    setupListeners();
                }
            }
        } catch (err) {
            console.warn('Could not fetch faculty profile from API, using stored credentials:', err);
        }
    }

    renderUI();
    setupListeners();
    loadFacultyProfile();

    return container;
}

export default FacultyProfile;