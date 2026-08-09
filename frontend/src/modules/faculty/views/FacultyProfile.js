import '../faculty.css';

export function FacultyProfile() {
    // Temporary faculty data
    const facultyData = {
        name: 'Dr. Sarah Johnson',
        photo: 'https://ui-avatars.com/api/?name=Sarah+Johnson&size=120&background=087f5b&color=fff',
        department: 'Computer Science',
        designation: 'Associate Professor',
        email: 'sarah.johnson@example.com',
        phone: '+1 (555) 123-4567',
        joined: 'August 2015'
    };

    const container = document.createElement('div');
    container.className = 'faculty-profile';

    container.innerHTML = `
        <div class="page-header">
            <h1>Faculty Profile</h1>
            <p>Manage your personal information and settings.</p>
        </div>

        <div class="faculty-profile-card" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 30px; display: flex; gap: 30px; align-items: flex-start; max-width: 800px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
            
            <div class="profile-photo" style="flex-shrink: 0;">
                <img src="${facultyData.photo}" alt="${facultyData.name}" style="border-radius: 50%; width: 120px; height: 120px; border: 4px solid #e8f7f1;">
            </div>

            <div class="profile-details" style="flex-grow: 1;">
                <h2 style="margin: 0 0 20px 0; color: #172033; font-size: 24px;">${facultyData.name}</h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="background: #f7faf9; padding: 12px; border-radius: 8px;">
                        <span style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px;">Department</span>
                        <strong style="color: #172033; font-size: 14px;">${facultyData.department}</strong>
                    </div>
                    
                    <div style="background: #f7faf9; padding: 12px; border-radius: 8px;">
                        <span style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px;">Designation</span>
                        <strong style="color: #172033; font-size: 14px;">${facultyData.designation}</strong>
                    </div>

                    <div style="background: #f7faf9; padding: 12px; border-radius: 8px;">
                        <span style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px;">Email Address</span>
                        <strong style="color: #172033; font-size: 14px;">${facultyData.email}</strong>
                    </div>

                    <div style="background: #f7faf9; padding: 12px; border-radius: 8px;">
                        <span style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px;">Phone Number</span>
                        <strong style="color: #172033; font-size: 14px;">${facultyData.phone}</strong>
                    </div>
                </div>

                <div style="margin-top: 30px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
                    <button class="faculty-view-btn">
                        Edit Profile
                    </button>
                </div>
            </div>

        </div>
    `;

    return container;
}

export default FacultyProfile;