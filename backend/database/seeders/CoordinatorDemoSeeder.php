<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CoordinatorDemoSeeder extends Seeder
{
    public function run()
    {
        // 1. Ensure Coordinator User exists
        $coordinatorId = DB::table('users')->where('email', 'coordinator@rajagiri.edu')->value('id');
        if (!$coordinatorId) {
            $coordinatorId = DB::table('users')->insertGetId([
                'name' => 'Test Coordinator',
                'email' => 'coordinator@rajagiri.edu',
                'password' => Hash::make('password123'),
                'role' => 'coordinator',
                'permissions' => json_encode(['view-coordinator', 'view-finance-readonly', 'view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            DB::table('users')->where('id', $coordinatorId)->update([
                'password' => Hash::make('password123'),
                'role' => 'coordinator',
                'updated_at' => now(),
            ]);
        }

        // 2. Faculty Users (2)
        $facultyUsers = [
            [
                'name' => 'Dr. Joseph Thomas',
                'email' => 'joseph.thomas@rajagiri.edu',
                'password' => Hash::make('faculty123'),
                'role' => 'faculty',
                'permissions' => json_encode(['view-faculty', 'view-projects', 'view-communication', 'view-github']),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Prof. Anita Sharma',
                'email' => 'anita.sharma@rajagiri.edu',
                'password' => Hash::make('faculty123'),
                'role' => 'faculty',
                'permissions' => json_encode(['view-faculty', 'view-projects', 'view-communication', 'view-github']),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        $facultyIds = [];
        foreach ($facultyUsers as $f) {
            $existing = DB::table('users')->where('email', $f['email'])->value('id');
            if ($existing) {
                DB::table('users')->where('id', $existing)->update($f);
                $facultyIds[] = $existing;
            } else {
                $facultyIds[] = DB::table('users')->insertGetId($f);
            }
        }

        // 3. Student Users (4)
        $studentUsers = [
            [
                'name' => 'Alex Varghese',
                'email' => 'alex.varghese@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => json_encode(['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read']),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Rhea Mathew',
                'email' => 'rhea.mathew@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => json_encode(['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read']),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Karan Nair',
                'email' => 'karan.nair@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => json_encode(['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read']),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Meera Kurien',
                'email' => 'meera.kurien@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => json_encode(['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read']),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        $studentIds = [];
        foreach ($studentUsers as $s) {
            $existing = DB::table('users')->where('email', $s['email'])->value('id');
            if ($existing) {
                DB::table('users')->where('id', $existing)->update($s);
                $studentIds[] = $existing;
            } else {
                $studentIds[] = DB::table('users')->insertGetId($s);
            }
        }

        // 4. Projects (3)
        $project1Id = DB::table('projects')->where('title', 'Smart Campus IoT System')->value('id');
        if (!$project1Id) {
            $project1Id = DB::table('projects')->insertGetId([
                'title' => 'Smart Campus IoT System',
                'project_type' => 'IoT',
                'source_type' => 'external',
                'brought_by' => 'Industry Partner',
                'client_name' => 'Tech Solutions Pvt Ltd',
                'contact_email' => 'contact@techsolutions.com',
                'contact_phone' => '9876543210',
                'requirements' => 'Deploy IoT sensors across campus for real-time energy & environment monitoring.',
                'deliverables' => 'Sensor hardware nodes, Gateway API, and Analytics Dashboard',
                'expected_timeline' => '2026-11-30',
                'budget' => 75000.00,
                'priority' => 'urgent',
                'status' => 'in_progress',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $project2Id = DB::table('projects')->where('title', 'Campus ERP Mobile Application')->value('id');
        if (!$project2Id) {
            $project2Id = DB::table('projects')->insertGetId([
                'title' => 'Campus ERP Mobile Application',
                'project_type' => 'Mobile App',
                'source_type' => 'institution',
                'brought_by' => 'Rajagiri IT Dept',
                'client_name' => 'Rajagiri College',
                'contact_email' => 'erp@rajagiri.edu',
                'contact_phone' => '9876543211',
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
        }

        $project3Id = DB::table('projects')->where('title', 'Automated Library Kiosk System')->value('id');
        if (!$project3Id) {
            $project3Id = DB::table('projects')->insertGetId([
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
        }

        // 5. Project-Student Assignments
        $studentAssignments = [
            ['project_id' => $project1Id, 'student_id' => $studentIds[0], 'role' => 'project_lead', 'assigned_date' => '2026-02-01'],
            ['project_id' => $project1Id, 'student_id' => $studentIds[1], 'role' => 'developer', 'assigned_date' => '2026-02-01'],
            ['project_id' => $project2Id, 'student_id' => $studentIds[2], 'role' => 'developer', 'assigned_date' => '2026-03-01'],
            ['project_id' => $project2Id, 'student_id' => $studentIds[3], 'role' => 'designer', 'assigned_date' => '2026-03-01'],
            ['project_id' => $project3Id, 'student_id' => $studentIds[0], 'role' => 'developer', 'assigned_date' => '2026-01-10'],
            ['project_id' => $project3Id, 'student_id' => $studentIds[2], 'role' => 'tester', 'assigned_date' => '2026-01-10'],
        ];

        foreach ($studentAssignments as $sa) {
            DB::table('project_student')->updateOrInsert(
                ['project_id' => $sa['project_id'], 'student_id' => $sa['student_id']],
                [
                    'role' => $sa['role'],
                    'assigned_date' => $sa['assigned_date'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // 6. Project-Faculty Assignments
        $facultyAssignments = [
            ['project_id' => $project1Id, 'faculty_id' => $facultyIds[0], 'assigned_date' => '2026-02-01'],
            ['project_id' => $project2Id, 'faculty_id' => $facultyIds[1], 'assigned_date' => '2026-03-01'],
            ['project_id' => $project3Id, 'faculty_id' => $facultyIds[0], 'assigned_date' => '2026-01-10'],
        ];

        foreach ($facultyAssignments as $fa) {
            DB::table('project_faculty')->updateOrInsert(
                ['project_id' => $fa['project_id'], 'faculty_id' => $fa['faculty_id']],
                [
                    'assigned_date' => $fa['assigned_date'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // 7. Modules and Tasks
        // Project 1 Modules
        $m1Id = DB::table('modules')->updateOrInsert(
            ['project_id' => $project1Id, 'module_name' => 'Sensor Integration'],
            [
                'weight_percentage' => 40.00,
                'description' => 'Hardware sensor setup and MQTT protocol integration',
                'status' => 'completed',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $mod1RecordId = DB::table('modules')->where('project_id', $project1Id)->where('module_name', 'Sensor Integration')->value('id');

        $t1Id = DB::table('tasks')->updateOrInsert(
            ['module_id' => $mod1RecordId, 'title' => 'Hardware setup and firmware flash'],
            [
                'description' => 'Flash ESP32 devices and connect temperature/humidity sensors',
                'assigned_to' => $studentIds[0],
                'status' => 'completed',
                'due_date' => '2026-03-15',
                'reviewed_by' => $facultyIds[0],
                'review_status' => 'approved',
                'reviewed_at' => '2026-03-16 10:00:00',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $task1RecordId = DB::table('tasks')->where('module_id', $mod1RecordId)->where('title', 'Hardware setup and firmware flash')->value('id');

        $mod2RecordId = DB::table('modules')->where('project_id', $project1Id)->where('module_name', 'Analytics Web Dashboard')->value('id');
        if (!$mod2RecordId) {
            $mod2RecordId = DB::table('modules')->insertGetId([
                'project_id' => $project1Id,
                'module_name' => 'Analytics Web Dashboard',
                'weight_percentage' => 60.00,
                'description' => 'Web interface for viewing real-time sensor analytics',
                'status' => 'in_progress',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('tasks')->updateOrInsert(
            ['module_id' => $mod2RecordId, 'title' => 'Real-time Telemetry Charts'],
            [
                'description' => 'Build WebSocket chart components for energy usage stream',
                'assigned_to' => $studentIds[1],
                'status' => 'in_progress',
                'due_date' => '2026-10-15',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // Project 2 Modules
        $p2Mod1 = DB::table('modules')->where('project_id', $project2Id)->where('module_name', 'Authentication & User Profile')->value('id');
        if (!$p2Mod1) {
            $p2Mod1 = DB::table('modules')->insertGetId([
                'project_id' => $project2Id,
                'module_name' => 'Authentication & User Profile',
                'weight_percentage' => 30.00,
                'description' => 'Login, profile management, and role-based access',
                'status' => 'completed',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('tasks')->updateOrInsert(
            ['module_id' => $p2Mod1, 'title' => 'JWT Auth integration in React Native'],
            [
                'description' => 'Implement secure token storage and refresh loop',
                'assigned_to' => $studentIds[2],
                'status' => 'completed',
                'due_date' => '2026-05-10',
                'reviewed_by' => $facultyIds[1],
                'review_status' => 'approved',
                'reviewed_at' => '2026-05-12 11:00:00',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // Project 3 Modules
        $p3Mod1 = DB::table('modules')->where('project_id', $project3Id)->where('module_name', 'RFID Driver & Checkout System')->value('id');
        if (!$p3Mod1) {
            $p3Mod1 = DB::table('modules')->insertGetId([
                'project_id' => $project3Id,
                'module_name' => 'RFID Driver & Checkout System',
                'weight_percentage' => 100.00,
                'description' => 'Desktop RFID library checkout application',
                'status' => 'completed',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $p3Task1 = DB::table('tasks')->where('module_id', $p3Mod1)->where('title', 'RFID Scanner Integration and Database Sync')->value('id');
        if (!$p3Task1) {
            $p3Task1 = DB::table('tasks')->insertGetId([
                'module_id' => $p3Mod1,
                'title' => 'RFID Scanner Integration and Database Sync',
                'description' => 'Connect hardware scanner and sync book records to central library database',
                'assigned_to' => $studentIds[0],
                'status' => 'completed',
                'due_date' => '2026-05-30',
                'reviewed_by' => $facultyIds[0],
                'review_status' => 'approved',
                'reviewed_at' => '2026-06-01 14:00:00',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 8. Client Requirements
        $req1Id = DB::table('client_requirements')->where('project_id', $project1Id)->where('description', 'LIKE', 'Hardware sensors must withstand%')->value('id');
        if (!$req1Id) {
            $req1Id = DB::table('client_requirements')->insertGetId([
                'project_id' => $project1Id,
                'task_id' => $task1RecordId,
                'description' => 'Hardware sensors must withstand outdoor temperature fluctuations up to 45°C.',
                'document_path' => '/docs/requirements/p1_sensor_spec.pdf',
                'uploaded_by' => $coordinatorId,
                'uploaded_on' => '2026-02-10 10:00:00',
            ]);
        }

        $req2Id = DB::table('client_requirements')->where('project_id', $project3Id)->where('description', 'LIKE', 'RFID check-out process must complete%')->value('id');
        if (!$req2Id) {
            $req2Id = DB::table('client_requirements')->insertGetId([
                'project_id' => $project3Id,
                'task_id' => $p3Task1,
                'description' => 'RFID check-out process must complete in under 2 seconds per item.',
                'document_path' => '/docs/requirements/p3_kiosk_spec.pdf',
                'uploaded_by' => $coordinatorId,
                'uploaded_on' => '2026-01-15 11:00:00',
            ]);
        }

        // 9. Requirement Changes
        $reqChangeId = DB::table('requirement_changes')->where('client_requirement_id', $req1Id)->value('id');
        if (!$reqChangeId) {
            DB::table('requirement_changes')->insert([
                'client_requirement_id' => $req1Id,
                'project_id' => $project1Id,
                'previous_description' => 'Outdoor temperature tolerance 40°C',
                'new_description' => 'Outdoor temperature tolerance extended to 45°C',
                'change_description' => 'Upgraded thermal enclosure specification per client request.',
                'reason' => 'High ambient summer temperatures on campus.',
                'previous_document_path' => '/docs/requirements/p1_sensor_spec_v1.pdf',
                'new_document_path' => '/docs/requirements/p1_sensor_spec.pdf',
                'requested_by' => $coordinatorId,
                'status' => 'approved',
                'approved_by' => $facultyIds[0],
                'approved_at' => '2026-02-12 16:00:00',
                'changed_on' => '2026-02-12 12:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 10. Certificates (For Closed Project 3)
        DB::table('certificates')->updateOrInsert(
            ['certificate_number' => 'CERT-2026-001'],
            [
                'project_id' => $project3Id,
                'student_id' => $studentIds[0],
                'description' => 'Certificate of Completion for Automated Library Kiosk System',
                'issue_date' => '2026-07-01',
                'certificate_file' => '/certificates/CERT-2026-001.pdf',
                'issued_by' => $coordinatorId,
            ]
        );

        DB::table('certificates')->updateOrInsert(
            ['certificate_number' => 'CERT-2026-002'],
            [
                'project_id' => $project3Id,
                'student_id' => $studentIds[2],
                'description' => 'Certificate of Completion for Automated Library Kiosk System',
                'issue_date' => '2026-07-01',
                'certificate_file' => '/certificates/CERT-2026-002.pdf',
                'issued_by' => $coordinatorId,
            ]
        );

        // 11. Project Closure (For Closed Project 3)
        DB::table('project_closures')->updateOrInsert(
            ['project_id' => $project3Id],
            [
                'closed_by' => $coordinatorId,
                'closure_date' => '2026-06-30 17:00:00',
                'final_status' => 'completed',
                'remarks' => 'Project successfully delivered and installed in Central Library. Client sign-off completed.',
            ]
        );
    }
}
