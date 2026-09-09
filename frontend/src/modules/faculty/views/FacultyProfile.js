import '../faculty.css';
import { API_BASE } from '@/core/config/api.js';

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

    // Default state derived from logged in user if available
    let facultyData = {
        name: storedUser?.name || 'Faculty Member',
        email: storedUser?.email || 'faculty@rajagiri.edu',
        phone: storedUser?.phone || '+91 484 2660605',
        role: storedUser?.role ? (storedUser.role.charAt(0).toUpperCase() + storedUser.role.slice(1)) : 'Faculty',
        department: 'Department of Computer Applications',
        designation: 'Associate Professor'
    };

    function renderUI() {
        const initials = (facultyData.name || 'Faculty Member')
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        container.innerHTML = `
            <div class="page-header">
                <h1>Faculty Profile</h1>
                <p>Personal and academic profile retrieved from the database.</p>
            </div>

            <div class="faculty-profile-card" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 30px; display: flex; gap: 30px; align-items: flex-start; max-width: 800px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
                
                <div class="profile-photo" style="flex-shrink: 0;">
                    <div style="border-radius: 50%; width: 110px; height: 110px; background: #087f5b; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 700; border: 4px solid #e8f7f1;">
                        ${initials}
                    </div>
                </div>

                <div class="profile-details" style="flex-grow: 1;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: #172033; font-size: 24px;">${facultyData.name}</h2>
                        <span style="background: #e8f7f1; color: #087f5b; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;">
                            ${facultyData.role}
                        </span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div style="background: #f7faf9; padding: 12px; border-radius: 8px;">
                            <span style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px;">Full Name</span>
                            <strong style="color: #172033; font-size: 14px;">${facultyData.name}</strong>
                        </div>

                        <div style="background: #f7faf9; padding: 12px; border-radius: 8px;">
                            <span style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px;">Email Address</span>
                            <strong style="color: #172033; font-size: 14px;">${facultyData.email}</strong>
                        </div>

                        <div style="background: #f7faf9; padding: 12px; border-radius: 8px;">
                            <span style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px;">Department</span>
                            <strong style="color: #172033; font-size: 14px;">${facultyData.department}</strong>
                        </div>
                        
                        <div style="background: #f7faf9; padding: 12px; border-radius: 8px;">
                            <span style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px;">Designation</span>
                            <strong style="color: #172033; font-size: 14px;">${facultyData.designation}</strong>
                        </div>

                        <div style="background: #f7faf9; padding: 12px; border-radius: 8px;">
                            <span style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px;">Phone Number</span>
                            <strong style="color: #172033; font-size: 14px;">${facultyData.phone || 'Not provided'}</strong>
                        </div>

                        <div style="background: #f7faf9; padding: 12px; border-radius: 8px;">
                            <span style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px;">Account Role</span>
                            <strong style="color: #172033; font-size: 14px;">${facultyData.role}</strong>
                        </div>
                    </div>
                </div>

            </div>
        `;
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
                }
            }
        } catch (err) {
            console.warn('Could not fetch faculty profile from API, using stored credentials:', err);
        }
    }

    renderUI();
    loadFacultyProfile();

    return container;
}

export default FacultyProfile;