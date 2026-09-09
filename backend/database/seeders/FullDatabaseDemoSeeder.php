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
        // Project 1 Modules & Tasks
        $m1Id = DB::table('modules')->updateOrInsert(
            ['project_id' => $p1Id, 'module_name' => 'Sensor Integration'],
            [
                'weight_percentage' => 40.00,
                'description' => 'Hardware sensor setup and MQTT protocol integration',
                'status' => 'completed',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $m1Id = DB::table('modules')->where('project_id', $p1Id)->where('module_name', 'Sensor Integration')->value('id');

        DB::table('tasks')->updateOrInsert(
            ['module_id' => $m1Id, 'title' => 'Hardware setup and firmware flash'],
            [
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
            ]
        );
        $t1Id = DB::table('tasks')->where('module_id', $m1Id)->where('title', 'Hardware setup and firmware flash')->value('id');

        DB::table('tasks')->updateOrInsert(
            ['module_id' => $m1Id, 'title' => 'MQTT Broker & Sensor Calibration'],
            [
                'description' => 'Configure Mosquitto broker and calibrate humidity sensor curves',
                'assigned_to' => $student1Id,
                'status' => 'completed',
                'due_date' => '2026-03-25',
                'reviewed_by' => $faculty1Id,
                'review_status' => 'approved',
                'reviewed_at' => '2026-03-26 14:00:00',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $t2Id = DB::table('tasks')->where('module_id', $m1Id)->where('title', 'MQTT Broker & Sensor Calibration')->value('id');

        $m2Id = DB::table('modules')->updateOrInsert(
            ['project_id' => $p1Id, 'module_name' => 'Analytics Web Dashboard'],
            [
                'weight_percentage' => 60.00,
                'description' => 'Web interface for viewing real-time sensor telemetry',
                'status' => 'completed',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $m2Id = DB::table('modules')->where('project_id', $p1Id)->where('module_name', 'Analytics Web Dashboard')->value('id');

        DB::table('tasks')->updateOrInsert(
            ['module_id' => $m2Id, 'title' => 'Real-time Telemetry Charts'],
            [
                'description' => 'Build WebSocket chart components for energy usage stream',
                'assigned_to' => $student2Id,
                'status' => 'completed',
                'due_date' => '2026-03-20',
                'reviewed_by' => $faculty1Id,
                'review_status' => 'approved',
                'reviewed_at' => '2026-03-21 11:30:00',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $t3Id = DB::table('tasks')->where('module_id', $m2Id)->where('title', 'Real-time Telemetry Charts')->value('id');

        DB::table('tasks')->updateOrInsert(
            ['module_id' => $m2Id, 'title' => 'Sensor Health Monitoring Alert System'],
            [
                'description' => 'Create anomaly detection and notification triggers for offline sensors',
                'assigned_to' => $student2Id,
                'status' => 'completed',
                'due_date' => '2026-03-28',
                'reviewed_by' => $faculty1Id,
                'review_status' => 'approved',
                'reviewed_at' => '2026-03-29 16:00:00',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $t4Id = DB::table('tasks')->where('module_id', $m2Id)->where('title', 'Sensor Health Monitoring Alert System')->value('id');

        // Project 2 Modules & Tasks
        $m3Id = DB::table('modules')->updateOrInsert(
            ['project_id' => $p2Id, 'module_name' => 'Mobile App UI Development'],
            [
                'weight_percentage' => 50.00,
                'description' => 'Frontend UI using Flutter',
                'status' => 'in_progress',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $m3Id = DB::table('modules')->where('project_id', $p2Id)->where('module_name', 'Mobile App UI Development')->value('id');

        DB::table('tasks')->updateOrInsert(
            ['module_id' => $m3Id, 'title' => 'Design Login Screen & Auth Flow'],
            [
                'description' => 'Create pixel perfect login screen and JWT session handling',
                'assigned_to' => $student3Id,
                'status' => 'completed',
                'due_date' => '2026-04-10',
                'reviewed_by' => $faculty2Id,
                'review_status' => 'approved',
                'reviewed_at' => '2026-04-11 10:00:00',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $t5Id = DB::table('tasks')->where('module_id', $m3Id)->where('title', 'Design Login Screen & Auth Flow')->value('id');

        DB::table('tasks')->updateOrInsert(
            ['module_id' => $m3Id, 'title' => 'Student Profile & Attendance Module View'],
            [
                'description' => 'Implement calendar attendance grid and student bio view',
                'assigned_to' => $student3Id,
                'status' => 'completed',
                'due_date' => '2026-04-20',
                'reviewed_by' => $faculty2Id,
                'review_status' => 'approved',
                'reviewed_at' => '2026-04-21 15:00:00',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $t6Id = DB::table('tasks')->where('module_id', $m3Id)->where('title', 'Student Profile & Attendance Module View')->value('id');

        $m4Id = DB::table('modules')->updateOrInsert(
            ['project_id' => $p2Id, 'module_name' => 'App Design System & Notifications'],
            [
                'weight_percentage' => 50.00,
                'description' => 'Component styling library, design tokens, and push alerts',
                'status' => 'in_progress',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $m4Id = DB::table('modules')->where('project_id', $p2Id)->where('module_name', 'App Design System & Notifications')->value('id');

        DB::table('tasks')->updateOrInsert(
            ['module_id' => $m4Id, 'title' => 'UI Design Mockups & Design Tokens'],
            [
                'description' => 'Figma design kit and typography token mapping in Flutter theme',
                'assigned_to' => $student4Id,
                'status' => 'completed',
                'due_date' => '2026-04-12',
                'reviewed_by' => $faculty2Id,
                'review_status' => 'approved',
                'reviewed_at' => '2026-04-13 14:00:00',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $t7Id = DB::table('tasks')->where('module_id', $m4Id)->where('title', 'UI Design Mockups & Design Tokens')->value('id');

        DB::table('tasks')->updateOrInsert(
            ['module_id' => $m4Id, 'title' => 'Notification Bell & Settings Screen'],
            [
                'description' => 'In-app notification list and user notification preferences UI',
                'assigned_to' => $student4Id,
                'status' => 'completed',
                'due_date' => '2026-04-25',
                'reviewed_by' => $faculty2Id,
                'review_status' => 'approved',
                'reviewed_at' => '2026-04-26 12:00:00',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $t8Id = DB::table('tasks')->where('module_id', $m4Id)->where('title', 'Notification Bell & Settings Screen')->value('id');

        // Project 3 Modules & Tasks
        $m5Id = DB::table('modules')->updateOrInsert(
            ['project_id' => $p3Id, 'module_name' => 'RFID Hardware Integration'],
            [
                'weight_percentage' => 50.00,
                'description' => 'RFID Reader integration and SDK drivers',
                'status' => 'completed',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $m5Id = DB::table('modules')->where('project_id', $p3Id)->where('module_name', 'RFID Hardware Integration')->value('id');

        DB::table('tasks')->updateOrInsert(
            ['module_id' => $m5Id, 'title' => 'RFID Reader SDK Driver Setup'],
            [
                'description' => 'Install USB-Serial drivers and test UHF RFID tag reads',
                'assigned_to' => $student1Id,
                'status' => 'completed',
                'due_date' => '2026-02-15',
                'reviewed_by' => $faculty1Id,
                'review_status' => 'approved',
                'reviewed_at' => '2026-02-16 11:00:00',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $t9Id = DB::table('tasks')->where('module_id', $m5Id)->where('title', 'RFID Reader SDK Driver Setup')->value('id');

        DB::table('tasks')->updateOrInsert(
            ['module_id' => $m5Id, 'title' => 'Book Barcode & RFID Sync Service'],
            [
                'description' => 'Map Koha ILS accession numbers with RFID EPC tags',
                'assigned_to' => $student1Id,
                'status' => 'completed',
                'due_date' => '2026-02-28',
                'reviewed_by' => $faculty1Id,
                'review_status' => 'approved',
                'reviewed_at' => '2026-03-01 16:30:00',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $t10Id = DB::table('tasks')->where('module_id', $m5Id)->where('title', 'Book Barcode & RFID Sync Service')->value('id');

        $m6Id = DB::table('modules')->updateOrInsert(
            ['project_id' => $p3Id, 'module_name' => 'Kiosk UI & Checkout Flow'],
            [
                'weight_percentage' => 50.00,
                'description' => 'Self check-in/checkout screen, receipt printing, and error handling',
                'status' => 'completed',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $m6Id = DB::table('modules')->where('project_id', $p3Id)->where('module_name', 'Kiosk UI & Checkout Flow')->value('id');

        DB::table('tasks')->updateOrInsert(
            ['module_id' => $m6Id, 'title' => 'Touchscreen Kiosk User Interface'],
            [
                'description' => 'Build large-format touchscreen kiosk workflow in Electron',
                'assigned_to' => $student3Id,
                'status' => 'completed',
                'due_date' => '2026-02-20',
                'reviewed_by' => $faculty1Id,
                'review_status' => 'approved',
                'reviewed_at' => '2026-02-21 14:00:00',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $t11Id = DB::table('tasks')->where('module_id', $m6Id)->where('title', 'Touchscreen Kiosk User Interface')->value('id');

        DB::table('tasks')->updateOrInsert(
            ['module_id' => $m6Id, 'title' => 'Automated Receipt Printing & Return Testing'],
            [
                'description' => 'Thermal printer slip generation and book return drop-box integration',
                'assigned_to' => $student3Id,
                'status' => 'completed',
                'due_date' => '2026-03-05',
                'reviewed_by' => $faculty1Id,
                'review_status' => 'approved',
                'reviewed_at' => '2026-03-06 17:00:00',
                'created_by' => $coordinatorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $t12Id = DB::table('tasks')->where('module_id', $m6Id)->where('title', 'Automated Receipt Printing & Return Testing')->value('id');

        // 7b. Student Work Logs (Completed tasks with approved work logs calculate student payroll)
        $allPsIds = array_values($psRecordMap);
        DB::table('student_work_logs')->whereIn('project_student_id', $allPsIds)->delete();

        $workLogsData = [
            // PS 1: Alex Varghese on P1 (40h -> Gross 10,000)
            ['project_student_id' => $psRecordMap[$p1Id . '_' . $student1Id], 'task_id' => $t1Id, 'work_date' => '2026-02-10', 'hours_worked' => 20.00, 'description' => 'Configured ESP32 firmware and soldered humidity sensors', 'approval_status' => 'approved', 'approved_by' => $faculty1Id, 'approved_at' => '2026-02-11 10:00:00'],
            ['project_student_id' => $psRecordMap[$p1Id . '_' . $student1Id], 'task_id' => $t2Id, 'work_date' => '2026-02-24', 'hours_worked' => 20.00, 'description' => 'Calibrated sensor stream and setup Mosquitto SSL connection', 'approval_status' => 'approved', 'approved_by' => $faculty1Id, 'approved_at' => '2026-02-25 11:30:00'],

            // PS 2: Rhea Mathew on P1 (16h -> Gross 4,000)
            ['project_student_id' => $psRecordMap[$p1Id . '_' . $student2Id], 'task_id' => $t3Id, 'work_date' => '2026-02-15', 'hours_worked' => 10.00, 'description' => 'Designed real-time charts using Chart.js and WebSockets', 'approval_status' => 'approved', 'approved_by' => $faculty1Id, 'approved_at' => '2026-02-16 09:15:00'],
            ['project_student_id' => $psRecordMap[$p1Id . '_' . $student2Id], 'task_id' => $t4Id, 'work_date' => '2026-02-28', 'hours_worked' => 6.00, 'description' => 'Added offline alerts and threshold detection logic', 'approval_status' => 'approved', 'approved_by' => $faculty1Id, 'approved_at' => '2026-03-01 14:00:00'],

            // PS 3: Karan Nair on P2 (32h -> Gross 8,000)
            ['project_student_id' => $psRecordMap[$p2Id . '_' . $student3Id], 'task_id' => $t5Id, 'work_date' => '2026-03-15', 'hours_worked' => 20.00, 'description' => 'Built login screen with biometrics and JWT storage', 'approval_status' => 'approved', 'approved_by' => $faculty2Id, 'approved_at' => '2026-03-16 16:00:00'],
            ['project_student_id' => $psRecordMap[$p2Id . '_' . $student3Id], 'task_id' => $t6Id, 'work_date' => '2026-04-10', 'hours_worked' => 12.00, 'description' => 'Created student attendance grid with monthly aggregate charts', 'approval_status' => 'approved', 'approved_by' => $faculty2Id, 'approved_at' => '2026-04-11 11:00:00'],

            // PS 4: Meera Kurien on P2 (24h -> Gross 6,000)
            ['project_student_id' => $psRecordMap[$p2Id . '_' . $student4Id], 'task_id' => $t7Id, 'work_date' => '2026-03-20', 'hours_worked' => 14.00, 'description' => 'Developed design tokens and responsive mobile layout styles', 'approval_status' => 'approved', 'approved_by' => $faculty2Id, 'approved_at' => '2026-03-21 15:30:00'],
            ['project_student_id' => $psRecordMap[$p2Id . '_' . $student4Id], 'task_id' => $t8Id, 'work_date' => '2026-04-05', 'hours_worked' => 10.00, 'description' => 'Designed notification bell icon and drawer preference pane', 'approval_status' => 'approved', 'approved_by' => $faculty2Id, 'approved_at' => '2026-04-06 10:45:00'],

            // PS 5: Alex Varghese on P3 (30h -> Gross 7,500)
            ['project_student_id' => $psRecordMap[$p3Id . '_' . $student1Id], 'task_id' => $t9Id, 'work_date' => '2026-01-20', 'hours_worked' => 15.00, 'description' => 'Implemented RFID hardware reader driver and tested tag recognition', 'approval_status' => 'approved', 'approved_by' => $faculty1Id, 'approved_at' => '2026-01-21 12:00:00'],
            ['project_student_id' => $psRecordMap[$p3Id . '_' . $student1Id], 'task_id' => $t10Id, 'work_date' => '2026-02-05', 'hours_worked' => 15.00, 'description' => 'Integrated Koha database sync for book checkout events', 'approval_status' => 'approved', 'approved_by' => $faculty1Id, 'approved_at' => '2026-02-06 17:00:00'],

            // PS 6: Karan Nair on P3 (20h -> Gross 5,000)
            ['project_student_id' => $psRecordMap[$p3Id . '_' . $student3Id], 'task_id' => $t11Id, 'work_date' => '2026-01-25', 'hours_worked' => 12.00, 'description' => 'Created full kiosk touchscreen interface with student ID scanner', 'approval_status' => 'approved', 'approved_by' => $faculty1Id, 'approved_at' => '2026-01-26 14:20:00'],
            ['project_student_id' => $psRecordMap[$p3Id . '_' . $student3Id], 'task_id' => $t12Id, 'work_date' => '2026-02-12', 'hours_worked' => 8.00, 'description' => 'Tested receipt printing slip generator and book return sensor bin', 'approval_status' => 'approved', 'approved_by' => $faculty1Id, 'approved_at' => '2026-02-13 16:00:00'],
        ];

        foreach ($workLogsData as $wl) {
            DB::table('student_work_logs')->insert(array_merge($wl, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // 8. Client Requirements
        $cr1 = DB::table('client_requirements')->first();
        $cr1Id = $cr1 ? $cr1->id : DB::table('client_requirements')->insertGetId([
            'title' => 'Outdoor Sensors',
            'description' => 'Hardware sensors must withstand outdoor temperature fluctuations up to 45°C.',
            'status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 9. Requirement Changes
        DB::table('requirement_changes')->updateOrInsert(
            ['client_requirement_id' => $cr1Id],
            [
                'previous_value' => 'Outdoor temperature tolerance 40°C',
                'updated_value' => 'Outdoor temperature tolerance extended to 45°C',
                'changed_by' => $coordinatorId,
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

        // Clean prior test finance records to ensure idempotent seeding
        DB::table('ssl_renewal_history')->delete();
        DB::table('hosting_charges')->delete();
        DB::table('maintenance_support_charges')->delete();
        DB::table('client_payments')->delete();
        DB::table('invoices')->delete();
        DB::table('development_allocations')->delete();
        DB::table('student_payments')->delete();
        DB::table('faculty_payments')->delete();
        DB::table('project_finances')->delete();

        // Finance Hourly Rate Settings
        DB::table('finance_settings')->delete();
        DB::table('finance_settings')->insert([
            'id' => 1,
            'student_hourly_rate' => 250.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('student_hourly_rate_history')->delete();
        DB::table('student_hourly_rate_history')->insert([
            'old_rate' => 200.00,
            'new_rate' => 250.00,
            'updated_by' => $financeId,
            'created_at' => '2026-02-01 09:00:00',
            'updated_at' => '2026-02-01 09:00:00',
        ]);

        // Project 1 Finance (Smart Campus IoT System)
        $pf1Id = DB::table('project_finances')->insertGetId([
            'project_id' => $p1Id,
            'total_development_amount' => 75000.00,
            'created_by' => $coordinatorId,
            'status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Project 2 Finance (Campus ERP Mobile Application)
        $pf2Id = DB::table('project_finances')->insertGetId([
            'project_id' => $p2Id,
            'total_development_amount' => 95000.00,
            'created_by' => $coordinatorId,
            'status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Project 3 Finance (Automated Library Kiosk System)
        $pf3Id = DB::table('project_finances')->insertGetId([
            'project_id' => $p3Id,
            'total_development_amount' => 45000.00,
            'created_by' => $coordinatorId,
            'status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Development Allocations (Cost Distribution)
        DB::table('development_allocations')->insert([
            ['project_finance_id' => $pf1Id, 'category' => 'student', 'amount' => 30000.00, 'created_at' => now(), 'updated_at' => now()],
            ['project_finance_id' => $pf1Id, 'category' => 'faculty', 'amount' => 15000.00, 'created_at' => now(), 'updated_at' => now()],
            ['project_finance_id' => $pf1Id, 'category' => 'rlabz', 'amount' => 30000.00, 'created_at' => now(), 'updated_at' => now()],
            
            ['project_finance_id' => $pf2Id, 'category' => 'student', 'amount' => 40000.00, 'created_at' => now(), 'updated_at' => now()],
            ['project_finance_id' => $pf2Id, 'category' => 'faculty', 'amount' => 20000.00, 'created_at' => now(), 'updated_at' => now()],
            ['project_finance_id' => $pf2Id, 'category' => 'rlabz', 'amount' => 35000.00, 'created_at' => now(), 'updated_at' => now()],

            ['project_finance_id' => $pf3Id, 'category' => 'student', 'amount' => 15000.00, 'created_at' => now(), 'updated_at' => now()],
            ['project_finance_id' => $pf3Id, 'category' => 'faculty', 'amount' => 10000.00, 'created_at' => now(), 'updated_at' => now()],
            ['project_finance_id' => $pf3Id, 'category' => 'rlabz', 'amount' => 20000.00, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Invoices
        $inv1Id = DB::table('invoices')->insertGetId([
            'project_finance_id' => $pf1Id,
            'invoice_number' => 'INV-2026-001',
            'invoice_date' => '2026-02-01',
            'due_date' => '2026-02-15',
            'amount_before_gst' => 30000.00,
            'gst_percentage' => 18.00,
            'description' => 'Advance Milestone Payment',
            'created_by' => $financeId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $inv2Id = DB::table('invoices')->insertGetId([
            'project_finance_id' => $pf2Id,
            'invoice_number' => 'INV-2026-002',
            'invoice_date' => '2026-03-01',
            'due_date' => '2026-03-15',
            'amount_before_gst' => 45000.00,
            'gst_percentage' => 18.00,
            'description' => 'Phase 1 UI & Architecture Payment',
            'created_by' => $financeId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $inv3Id = DB::table('invoices')->insertGetId([
            'project_finance_id' => $pf3Id,
            'invoice_number' => 'INV-2026-003',
            'invoice_date' => '2026-06-01',
            'due_date' => '2026-06-15',
            'amount_before_gst' => 45000.00,
            'gst_percentage' => 18.00,
            'description' => 'Full Project Delivery & Handover Settlement',
            'created_by' => $financeId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Client Payments
        DB::table('client_payments')->insert([
            [
                'invoice_id' => $inv1Id,
                'amount' => 30000.00,
                'payment_date' => '2026-02-15',
                'payment_method' => 'bank_transfer',
                'payment_reference' => 'TXN-789012',
                'remarks' => 'Advance received from Tech Solutions',
                'recorded_by' => $financeId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'invoice_id' => $inv2Id,
                'amount' => 45000.00,
                'payment_date' => '2026-03-14',
                'payment_method' => 'bank_transfer',
                'payment_reference' => 'TXN-889900',
                'remarks' => 'Phase 1 received from Rajagiri College',
                'recorded_by' => $financeId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'invoice_id' => $inv3Id,
                'amount' => 45000.00,
                'payment_date' => '2026-06-15',
                'payment_method' => 'bank_transfer',
                'payment_reference' => 'TXN-998877',
                'remarks' => 'Full settlement received from Central Library',
                'recorded_by' => $financeId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Hosting Charges & SSL (Project 1)
        $hosting1Id = DB::table('hosting_charges')->insertGetId([
            'project_finance_id' => $pf1Id,
            'charge_type' => 'hosting',
            'amount' => 12000.00,
            'purchase_date' => '2026-01-01',
            'expiry_date' => '2027-01-01',
            'reference_details' => 'AWS EC2 Instance (Smart Campus IoT)',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('ssl_renewal_history')->insert([
            'hosting_charge_id' => $hosting1Id,
            'renewal_date' => '2027-01-01',
            'previous_expiry_date' => '2027-01-01',
            'new_expiry_date' => '2028-01-01',
            'renewal_amount' => 2500.00,
            'renewed_by' => $financeId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Maintenance & Support Charges (Project 2)
        DB::table('maintenance_support_charges')->insert([
            'project_finance_id' => $pf2Id,
            'amount' => 5000.00,
            'start_date' => '2026-06-01',
            'end_date' => '2026-12-01',
            'description' => 'Half-yearly support & cloud sync contract',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Faculty Payments
        $pfac1 = DB::table('project_faculty')->where('project_id', $p1Id)->where('faculty_id', $faculty1Id)->first();
        if ($pfac1) {
            DB::table('faculty_payments')->insert([
                'project_faculty_id' => $pfac1->id,
                'amount' => 5000.00,
                'payment_date' => '2026-03-05',
                'status' => 'paid',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $pfac3 = DB::table('project_faculty')->where('project_id', $p3Id)->where('faculty_id', $faculty1Id)->first();
        if ($pfac3) {
            DB::table('faculty_payments')->insert([
                'project_faculty_id' => $pfac3->id,
                'amount' => 5000.00,
                'payment_date' => '2026-06-28',
                'status' => 'paid',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Student Payments (Calculated based on tasks completed & approved hours)
        // PS 1: Alex Varghese on P1 (Gross: 40h * 250 = ₹10,000 -> Paid: ₹10,000 -> Remaining: ₹0 -> Status: Paid)
        $ps1Id = $psRecordMap[$p1Id . '_' . $student1Id] ?? null;
        if ($ps1Id) {
            DB::table('student_payments')->insert([
                'project_student_id' => $ps1Id,
                'designation' => 'nova',
                'approved_hours' => 40.00,
                'hourly_rate' => 250.00,
                'amount' => 10000.00,
                'payment_date' => '2026-03-01',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // PS 3: Karan Nair on P2 (Gross: 32h * 250 = ₹8,000 -> Paid: ₹5,000 -> Remaining: ₹3,000 -> Status: Partially Paid)
        $ps3Id = $psRecordMap[$p2Id . '_' . $student3Id] ?? null;
        if ($ps3Id) {
            DB::table('student_payments')->insert([
                'project_student_id' => $ps3Id,
                'designation' => 'orbit',
                'approved_hours' => 20.00,
                'hourly_rate' => 250.00,
                'amount' => 5000.00,
                'payment_date' => '2026-04-30',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // PS 5: Alex Varghese on P3 (Gross: 30h * 250 = ₹7,500 -> Paid: ₹7,500 -> Remaining: ₹0 -> Status: Paid)
        $ps5Id = $psRecordMap[$p3Id . '_' . $student1Id] ?? null;
        if ($ps5Id) {
            DB::table('student_payments')->insert([
                'project_student_id' => $ps5Id,
                'designation' => 'nova',
                'approved_hours' => 30.00,
                'hourly_rate' => 250.00,
                'amount' => 7500.00,
                'payment_date' => '2026-06-25',
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

        DB::table('github_repositories')->updateOrInsert(
            ['repository_name' => 'campus-erp-mobile'],
            [
                'project_id' => $p2Id,
                'repository_url' => 'https://github.com/rlabz/campus-erp-mobile',
                'submitted_date' => '2026-03-10',
                'is_verified' => true,
                'verified_by' => $faculty2Id,
                'verified_at' => '2026-03-11 14:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        DB::table('github_repositories')->updateOrInsert(
            ['repository_name' => 'library-kiosk'],
            [
                'project_id' => $p3Id,
                'repository_url' => 'https://github.com/rlabz/library-kiosk',
                'submitted_date' => '2026-01-20',
                'is_verified' => true,
                'verified_by' => $faculty1Id,
                'verified_at' => '2026-01-21 16:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
