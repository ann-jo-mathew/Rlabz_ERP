<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class FullDatabaseDemoSeeder extends Seeder
{
    public function run()
    {
        // 1. Users
        $usersData = [
            [
                'name' => 'Director Office',
                'email' => 'director@rajagiri.edu',
                'password' => Hash::make('director123'),
                'role' => 'director',
                'permissions' => json_encode(['view-dashboard', 'view-finance-readonly', 'view-projects', 'view-github', 'view-audit-notifications']),
            ],
            [
                'name' => 'Test Coordinator',
                'email' => 'coordinator@rajagiri.edu',
                'password' => Hash::make('password123'),
                'role' => 'coordinator',
                'permissions' => json_encode(['view-coordinator', 'view-finance-readonly', 'view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates']),
            ],
            [
                'name' => 'Finance Head',
                'email' => 'finance@rajagiri.edu',
                'password' => Hash::make('finance123'),
                'role' => 'finance',
                'permissions' => json_encode(['view-finance', 'view-student-designations', 'view-projects']),
            ],
            [
                'name' => 'Dr. Joseph Thomas',
                'email' => 'joseph.thomas@rajagiri.edu',
                'password' => Hash::make('faculty123'),
                'role' => 'faculty',
                'permissions' => json_encode(['view-faculty', 'view-projects', 'view-communication', 'view-github']),
            ],
            [
                'name' => 'Prof. Anita Sharma',
                'email' => 'anita.sharma@rajagiri.edu',
                'password' => Hash::make('faculty123'),
                'role' => 'faculty',
                'permissions' => json_encode(['view-faculty', 'view-projects', 'view-communication', 'view-github']),
            ],
            [
                'name' => 'Alex Varghese',
                'email' => 'alex.varghese@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => json_encode(['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read']),
            ],
            [
                'name' => 'Rhea Mathew',
                'email' => 'rhea.mathew@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => json_encode(['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read']),
            ],
            [
                'name' => 'Karan Nair',
                'email' => 'karan.nair@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => json_encode(['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read']),
            ],
            [
                'name' => 'Meera Kurien',
                'email' => 'meera.kurien@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => json_encode(['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read']),
            ],
        ];

        $userIds = [];
        foreach ($usersData as $u) {
            $existing = DB::table('users')->where('email', $u['email'])->first();
            if ($existing) {
                DB::table('users')->where('id', $existing->id)->update([
                    'name' => $u['name'],
                    'role' => $u['role'],
                    'permissions' => $u['permissions'],
                    'updated_at' => now(),
                ]);
                $userIds[$u['email']] = $existing->id;
            } else {
                $id = DB::table('users')->insertGetId([
                    'name' => $u['name'],
                    'email' => $u['email'],
                    'password' => $u['password'],
                    'role' => $u['role'],
                    'permissions' => $u['permissions'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $userIds[$u['email']] = $id;
            }
        }

        $coordinatorId = $userIds['coordinator@rajagiri.edu'];
        $directorId = $userIds['director@rajagiri.edu'];
        $financeId = $userIds['finance@rajagiri.edu'];
        $faculty1Id = $userIds['joseph.thomas@rajagiri.edu'];
        $faculty2Id = $userIds['anita.sharma@rajagiri.edu'];
        $student1Id = $userIds['alex.varghese@rajagiri.edu'];
        $student2Id = $userIds['rhea.mathew@rajagiri.edu'];
        $student3Id = $userIds['karan.nair@rajagiri.edu'];
        $student4Id = $userIds['meera.kurien@rajagiri.edu'];

        // 2. Faculty Profiles
        DB::table('faculty_profiles')->updateOrInsert(
            ['faculty_id' => $faculty1Id],
            ['department' => 'Computer Applications', 'designation' => 'Associate Professor', 'created_at' => now(), 'updated_at' => now()]
        );
        DB::table('faculty_profiles')->updateOrInsert(
            ['faculty_id' => $faculty2Id],
            ['department' => 'Computer Science & Engineering', 'designation' => 'Assistant Professor', 'created_at' => now(), 'updated_at' => now()]
        );

        // 3. Student Profiles
        $studentProfilesData = [
            ['student_id' => $student1Id, 'course' => 'MCA', 'batch' => '2026', 'semester' => 4, 'designation' => 'nova'],
            ['student_id' => $student2Id, 'course' => 'MCA', 'batch' => '2026', 'semester' => 4, 'designation' => 'orbit'],
            ['student_id' => $student3Id, 'course' => 'B.Tech CSE', 'batch' => '2026', 'semester' => 6, 'designation' => 'orbit'],
            ['student_id' => $student4Id, 'course' => 'BCA', 'batch' => '2026', 'semester' => 4, 'designation' => 'spark'],
        ];

        foreach ($studentProfilesData as $sp) {
            DB::table('student_profiles')->updateOrInsert(
                ['student_id' => $sp['student_id']],
                [
                    'course' => $sp['course'],
                    'batch' => $sp['batch'],
                    'semester' => $sp['semester'],
                    'designation' => $sp['designation'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // 4. Projects
        $p1 = DB::table('projects')->where('title', 'Smart Campus IoT System')->first();
        $p1Id = $p1 ? $p1->id : DB::table('projects')->insertGetId([
            'title' => 'Smart Campus IoT System',
            'project_type' => 'IoT',
            'source_type' => 'external',
            'brought_by' => 'Industry Partner',
            'client_name' => 'Tech Solutions Pvt Ltd',
            'contact_email' => 'tech@example.com',
            'contact_phone' => '9876543211',
            'requirements' => 'Deploy IoT sensors across campus for real-time energy & environment monitoring.',
            'deliverables' => 'IoT sensors, backend API and web dashboard.',
            'expected_timeline' => '2027-01-31',
            'budget' => 75000.00,
            'priority' => 'urgent',
            'status' => 'in_progress',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $p2 = DB::table('projects')->where('title', 'Campus ERP Mobile Application')->first();
        $p2Id = $p2 ? $p2->id : DB::table('projects')->insertGetId([
            'title' => 'Campus ERP Mobile Application',
            'project_type' => 'Mobile App',
            'source_type' => 'institution',
            'brought_by' => 'Rajagiri IT Dept',
            'client_name' => 'Rajagiri College',
            'contact_email' => 'erp@rajagiri.edu',
            'contact_phone' => '9876543210',
            'requirements' => 'Cross-platform mobile app for students and faculty for attendance, grades, and notices.',
            'deliverables' => 'iOS & Android app binaries, REST API integration, User manual',
            'expected_timeline' => '2026-12-15',
            'budget' => 95000.00,
            'priority' => 'normal',
            'status' => 'in_progress',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $p3 = DB::table('projects')->where('title', 'Automated Library Kiosk System')->first();
        $p3Id = $p3 ? $p3->id : DB::table('projects')->insertGetId([
            'title' => 'Automated Library Kiosk System',
            'project_type' => 'Desktop Application',
            'source_type' => 'faculty',
            'brought_by' => 'Dr. Joseph Thomas',
            'client_name' => 'Rajagiri Central Library',
            'contact_email' => 'library@rajagiri.edu',
            'contact_phone' => '9876543212',
            'requirements' => 'Self-service library check-in/check-out kiosk with RFID scanner integration.',
            'deliverables' => 'Kiosk desktop software, RFID driver module, final handover report',
            'expected_timeline' => '2026-06-30',
            'budget' => 45000.00,
            'priority' => 'normal',
            'status' => 'closed',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 5. Project-Student Assignments
        $pStudents = [
            ['project_id' => $p1Id, 'student_id' => $student1Id, 'role' => 'project_lead', 'assigned_date' => '2026-02-01'],
            ['project_id' => $p1Id, 'student_id' => $student2Id, 'role' => 'developer', 'assigned_date' => '2026-02-01'],
            ['project_id' => $p2Id, 'student_id' => $student3Id, 'role' => 'developer', 'assigned_date' => '2026-03-01'],
            ['project_id' => $p2Id, 'student_id' => $student4Id, 'role' => 'designer', 'assigned_date' => '2026-03-01'],
            ['project_id' => $p3Id, 'student_id' => $student1Id, 'role' => 'developer', 'assigned_date' => '2026-01-10'],
            ['project_id' => $p3Id, 'student_id' => $student3Id, 'role' => 'tester', 'assigned_date' => '2026-01-10'],
        ];

        $psRecordMap = [];
        foreach ($pStudents as $ps) {
            DB::table('project_student')->updateOrInsert(
                ['project_id' => $ps['project_id'], 'student_id' => $ps['student_id']],
                ['role' => $ps['role'], 'assigned_date' => $ps['assigned_date'], 'created_at' => now(), 'updated_at' => now()]
            );
            $psId = DB::table('project_student')->where('project_id', $ps['project_id'])->where('student_id', $ps['student_id'])->value('id');
            $psRecordMap[$ps['project_id'] . '_' . $ps['student_id']] = $psId;
        }

        // 6. Project-Faculty Assignments
        $pFaculty = [
            ['project_id' => $p1Id, 'faculty_id' => $faculty1Id, 'assigned_date' => '2026-02-01'],
            ['project_id' => $p2Id, 'faculty_id' => $faculty2Id, 'assigned_date' => '2026-03-01'],
            ['project_id' => $p3Id, 'faculty_id' => $faculty1Id, 'assigned_date' => '2026-01-10'],
        ];

        foreach ($pFaculty as $pf) {
            DB::table('project_faculty')->updateOrInsert(
                ['project_id' => $pf['project_id'], 'faculty_id' => $pf['faculty_id']],
                ['assigned_date' => $pf['assigned_date'], 'created_at' => now(), 'updated_at' => now()]
            );
        }

        // 7. Modules & Tasks
        $m1 = DB::table('modules')->where('project_id', $p1Id)->where('module_name', 'Sensor Integration')->first();
        $m1Id = $m1 ? $m1->id : DB::table('modules')->insertGetId([
            'project_id' => $p1Id,
            'module_name' => 'Sensor Integration',
            'weight_percentage' => 40.00,
            'description' => 'Hardware sensor setup and MQTT protocol integration',
            'status' => 'completed',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $t1 = DB::table('tasks')->where('module_id', $m1Id)->where('title', 'Hardware setup and firmware flash')->first();
        $t1Id = $t1 ? $t1->id : DB::table('tasks')->insertGetId([
            'module_id' => $m1Id,
            'title' => 'Hardware setup and firmware flash',
            'description' => 'Flash ESP32 devices and connect temperature/humidity sensors',
            'assigned_to' => $student1Id,
            'status' => 'completed',
            'due_date' => '2026-03-15',
            'reviewed_by' => $faculty1Id,
            'review_status' => 'approved',
            'reviewed_at' => '2026-03-16 10:00:00',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $m2 = DB::table('modules')->where('project_id', $p1Id)->where('module_name', 'Analytics Web Dashboard')->first();
        $m2Id = $m2 ? $m2->id : DB::table('modules')->insertGetId([
            'project_id' => $p1Id,
            'module_name' => 'Analytics Web Dashboard',
            'weight_percentage' => 60.00,
            'description' => 'Web interface for viewing real-time sensor telemetry',
            'status' => 'in_progress',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tasks')->updateOrInsert(
            ['module_id' => $m2Id, 'title' => 'Real-time Telemetry Charts'],
            [
                'description' => 'Build WebSocket chart components for energy usage stream',
                'assigned_to' => $student2Id,
                'status' => 'in_progress',
                'due_date' => '2026-10-15',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // 8. Client Requirements
        $cr1 = DB::table('client_requirements')->where('project_id', $p1Id)->first();
        $cr1Id = $cr1 ? $cr1->id : DB::table('client_requirements')->insertGetId([
            'project_id' => $p1Id,
            'task_id' => $t1Id,
            'description' => 'Hardware sensors must withstand outdoor temperature fluctuations up to 45°C.',
            'document_path' => '/docs/requirements/p1_sensor_spec.pdf',
            'uploaded_by' => $coordinatorId,
            'uploaded_on' => '2026-02-10 10:00:00',
        ]);

        // 9. Requirement Changes
        DB::table('requirement_changes')->updateOrInsert(
            ['client_requirement_id' => $cr1Id],
            [
                'project_id' => $p1Id,
                'previous_description' => 'Outdoor temperature tolerance 40°C',
                'new_description' => 'Outdoor temperature tolerance extended to 45°C',
                'change_description' => 'Upgraded thermal enclosure specification per client request.',
                'reason' => 'High ambient summer temperatures on campus.',
                'previous_document_path' => '/docs/requirements/p1_sensor_spec_v1.pdf',
                'new_document_path' => '/docs/requirements/p1_sensor_spec.pdf',
                'requested_by' => $coordinatorId,
                'status' => 'approved',
                'approved_by' => $faculty1Id,
                'approved_at' => '2026-02-12 16:00:00',
                'changed_on' => '2026-02-12 12:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // 10. Project Closure
        DB::table('project_closures')->updateOrInsert(
            ['project_id' => $p3Id],
            [
                'closed_by' => $coordinatorId,
                'closure_date' => '2026-06-30 17:00:00',
                'final_status' => 'completed',
                'remarks' => 'Project successfully delivered and installed in Central Library. Client sign-off completed.',
            ]
        );

        // 11. Certificates
        DB::table('certificates')->updateOrInsert(
            ['certificate_number' => 'CERT-2026-001'],
            [
                'project_id' => $p3Id,
                'student_id' => $student1Id,
                'description' => 'Certificate of Completion for Automated Library Kiosk System',
                'issue_date' => '2026-07-01',
                'certificate_file' => '/certificates/CERT-2026-001.pdf',
                'issued_by' => $coordinatorId,
            ]
        );

        DB::table('certificates')->updateOrInsert(
            ['certificate_number' => 'CERT-2026-002'],
            [
                'project_id' => $p3Id,
                'student_id' => $student3Id,
                'description' => 'Certificate of Completion for Automated Library Kiosk System',
                'issue_date' => '2026-07-01',
                'certificate_file' => '/certificates/CERT-2026-002.pdf',
                'issued_by' => $coordinatorId,
            ]
        );

        // 12. Meetings
        $mId = DB::table('meetings')->where('title', 'Weekly Sprint Sync')->value('id');
        if (!$mId) {
            $mId = DB::table('meetings')->insertGetId([
                'title' => 'Weekly Sprint Sync',
                'project_id' => $p1Id,
                'created_by' => $coordinatorId,
                'scheduled_at' => '2026-09-02 10:00:00',
                'location' => 'Room 302 / Online',
                'meeting_link' => 'https://meet.google.com/rlabz-sync',
                'agenda' => 'Review telemetry dashboard and sensor deployment timeline.',
                'status' => 'scheduled',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('meeting_participants')->insert([
                ['meeting_id' => $mId, 'user_id' => $student1Id, 'attendance_status' => 'invited', 'created_at' => now(), 'updated_at' => now()],
                ['meeting_id' => $mId, 'user_id' => $faculty1Id, 'attendance_status' => 'attended', 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        $mId2 = DB::table('meetings')->where('title', 'ERP Requirements Walkthrough')->value('id');
        if (!$mId2) {
            $mId2 = DB::table('meetings')->insertGetId([
                'title' => 'ERP Requirements Walkthrough',
                'project_id' => $p2Id,
                'created_by' => $coordinatorId,
                'scheduled_at' => '2026-09-05 14:30:00',
                'location' => 'Online',
                'meeting_link' => 'https://meet.google.com/rlabz-erp-review',
                'agenda' => 'Walk through mobile app requirements with the IT department.',
                'status' => 'scheduled',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('meeting_participants')->insert([
                ['meeting_id' => $mId2, 'user_id' => $student3Id, 'attendance_status' => 'invited', 'created_at' => now(), 'updated_at' => now()],
                ['meeting_id' => $mId2, 'user_id' => $faculty2Id, 'attendance_status' => 'invited', 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        $mId3 = DB::table('meetings')->where('title', 'Library Kiosk Handover Review')->value('id');
        if (!$mId3) {
            $mId3 = DB::table('meetings')->insertGetId([
                'title' => 'Library Kiosk Handover Review',
                'project_id' => $p3Id,
                'created_by' => $coordinatorId,
                'scheduled_at' => '2026-06-25 11:00:00',
                'location' => 'Central Library, Room 1',
                'meeting_link' => null,
                'agenda' => 'Final walkthrough and sign-off with library staff before handover.',
                'status' => 'completed',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('meeting_participants')->insert([
                ['meeting_id' => $mId3, 'user_id' => $student1Id, 'attendance_status' => 'attended', 'created_at' => now(), 'updated_at' => now()],
                ['meeting_id' => $mId3, 'user_id' => $student3Id, 'attendance_status' => 'attended', 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        // 13. Notifications & Audit Logs
        DB::table('notifications')->insert([
            'user_id' => $student1Id,
            'type' => 'project',
            'message' => 'You have been assigned as Project Lead on Smart Campus IoT System.',
            'is_read' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('audit_logs')->insert([
            'user_id' => $coordinatorId,
            'action' => 'CREATE_PROJECT',
            'description' => 'Created project Smart Campus IoT System',
            'created_at' => now(),
        ]);

        // 14. Finance Records
        $pf1 = DB::table('project_finances')->where('project_id', $p1Id)->first();
        $pf1Id = $pf1 ? $pf1->id : DB::table('project_finances')->insertGetId([
            'project_id' => $p1Id,
            'estimated_cost' => 75000.00,
            'subtotal' => 75000.00,
            'gst_amount' => 13500.00,
            'total_amount' => 88500.00,
            'created_by' => $coordinatorId,
            'status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('client_payments')->insert([
            'project_finance_id' => $pf1Id,
            'amount' => 30000.00,
            'payment_date' => '2026-02-15',
            'payment_method' => 'bank_transfer',
            'payment_type' => 'advance',
            'payment_reference' => 'TXN-789012',
            'status' => 'received',
            'recorded_by' => $financeId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $ps1Id = $psRecordMap[$p1Id . '_' . $student1Id] ?? null;
        if ($ps1Id) {
            DB::table('student_payments')->insert([
                'project_student_id' => $ps1Id,
                'task_id' => $t1Id,
                'project_finance_id' => $pf1Id,
                'designation' => 'nova',
                'approved_hours' => 40,
                'hourly_rate' => 250.00,
                'amount' => 10000.00,
                'payment_period_start' => '2026-02-01',
                'payment_period_end' => '2026-02-28',
                'status' => 'paid',
                'payment_date' => '2026-03-01',
                'payment_method' => 'bank_transfer',
                'payment_reference' => 'STU-TXN-001',
                'created_by' => $financeId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 15. GitHub Repositories
        DB::table('github_repositories')->updateOrInsert(
            ['repository_name' => 'smart-campus-iot'],
            [
                'project_id' => $p1Id,
                'repository_url' => 'https://github.com/rlabz/smart-campus-iot',
                'submitted_date' => '2026-02-05',
                'is_verified' => true,
                'verified_by' => $faculty1Id,
                'verified_at' => '2026-02-06 09:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
