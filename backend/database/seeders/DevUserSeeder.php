<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DevUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // 1. Seed Users
        $users = [
            [
                'name' => 'Director',
                'email' => 'director@rajagiri.edu',
                'password' => Hash::make('director123'),
                'role' => 'director',
                'permissions' => ['view-dashboard', 'view-finance-readonly', 'view-projects', 'view-github', 'view-audit-notifications', 'project.assign_faculty', 'project.view_global', 'project.client_requirements.view'],
            ],
            [
                'name' => 'Coordinator',
                'email' => 'coordinator@rajagiri.edu',
                'password' => Hash::make('password123'),
                'role' => 'coordinator',
                'permissions' => ['view-coordinator', 'view-finance-readonly', 'view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates', 'project.create', 'project.assign_students', 'project.view_global', 'project.client_requirements.create', 'project.client_requirements.view', 'project.client_requirements.update', 'project.close'],
            ],
            [
                'name' => 'Finance Head',
                'email' => 'finance@rajagiri.edu',
                'password' => Hash::make('finance123'),
                'role' => 'finance',
                'permissions' => ['view-finance', 'view-student-designations', 'view-projects'],
            ],
            [
                'name' => 'Faculty Member',
                'email' => 'faculty@rajagiri.edu',
                'password' => Hash::make('faculty123'),
                'role' => 'faculty',
                'permissions' => ['view-faculty', 'view-projects', 'view-communication', 'view-github', 'project.view_assigned', 'project.module.create', 'project.task.create', 'project.task.update', 'project.submission.review'],
            ],
            [
                'name' => 'Student Nova',
                'email' => 'nova@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => ['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read', 'project.view_assigned', 'project.task.update'],
            ],
            [
                'name' => 'Student Orbit',
                'email' => 'orbit@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => ['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read', 'project.view_assigned', 'project.task.update'],
            ],
            [
                'name' => 'Student Spark',
                'email' => 'spark@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => ['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read', 'project.view_assigned', 'project.task.update'],
            ],
            [
                'name' => 'Dr. Alice Smith',
                'email' => 'alice.smith@rajagiri.edu',
                'password' => Hash::make('faculty123'),
                'role' => 'faculty',
                'permissions' => ['view-faculty', 'view-projects', 'view-communication', 'view-github', 'project.view_assigned', 'project.module.create', 'project.task.create', 'project.task.update', 'project.submission.review'],
            ],
            [
                'name' => 'Prof. Bob Johnson',
                'email' => 'bob.johnson@rajagiri.edu',
                'password' => Hash::make('faculty123'),
                'role' => 'faculty',
                'permissions' => ['view-faculty', 'view-projects', 'view-communication', 'view-github', 'project.view_assigned', 'project.module.create', 'project.task.create', 'project.task.update', 'project.submission.review'],
            ],
        ];

        foreach ($users as $userData) {
            $permissions = json_encode($userData['permissions']);
            $userData['permissions'] = $permissions;
            
            DB::table('users')->updateOrInsert(
                ['email' => $userData['email']],
                $userData
            );
        }

        // Fetch user IDs
        $directorId = DB::table('users')->where('email', 'director@rajagiri.edu')->value('id');
        $coordinatorId = DB::table('users')->where('email', 'coordinator@rajagiri.edu')->value('id');
        $facultyId = DB::table('users')->where('email', 'faculty@rajagiri.edu')->value('id');
        $novaId = DB::table('users')->where('email', 'nova@rajagiri.edu')->value('id');
        $orbitId = DB::table('users')->where('email', 'orbit@rajagiri.edu')->value('id');
        $sparkId = DB::table('users')->where('email', 'spark@rajagiri.edu')->value('id');
        $aliceId = DB::table('users')->where('email', 'alice.smith@rajagiri.edu')->value('id');
        $bobId = DB::table('users')->where('email', 'bob.johnson@rajagiri.edu')->value('id');

        // Disable FK checks and truncate relational tables
        Schema::disableForeignKeyConstraints();
        if (Schema::hasTable('faculty_profiles')) {
            DB::table('faculty_profiles')->truncate();
        }
        DB::table('student_profiles')->truncate();
        DB::table('projects')->truncate();
        DB::table('project_student')->truncate();
        DB::table('project_faculty')->truncate();
        DB::table('modules')->truncate();
        DB::table('tasks')->truncate();
        DB::table('student_reports')->truncate();
        DB::table('student_work_logs')->truncate();
        DB::table('github_repositories')->truncate();
        DB::table('certificates')->truncate();
        DB::table('chats')->truncate();
        DB::table('chat_messages')->truncate();
        DB::table('meetings')->truncate();
        DB::table('meeting_participants')->truncate();
        if (Schema::hasTable('notifications')) {
            DB::table('notifications')->truncate();
        }
        Schema::enableForeignKeyConstraints();

        // 2. Seed Student Profiles & Faculty Profiles
        DB::table('student_profiles')->insert([
            ['student_id' => $novaId, 'course' => 'MCA', 'batch' => '2025-2027', 'semester' => '3', 'designation' => 'Nova', 'created_at' => now(), 'updated_at' => now()],
            ['student_id' => $orbitId, 'course' => 'MCA', 'batch' => '2025-2027', 'semester' => '3', 'designation' => 'Orbit', 'created_at' => now(), 'updated_at' => now()],
            ['student_id' => $sparkId, 'course' => 'MCA', 'batch' => '2025-2027', 'semester' => '3', 'designation' => 'Spark', 'created_at' => now(), 'updated_at' => now()],
        ]);

        if (Schema::hasTable('faculty_profiles')) {
            DB::table('faculty_profiles')->insert([
                ['faculty_id' => $facultyId, 'department' => 'Computer Applications', 'designation' => 'Associate Professor', 'created_at' => now(), 'updated_at' => now()],
                ['faculty_id' => $aliceId ?: 8, 'department' => 'Computer Applications', 'designation' => 'Assistant Professor', 'created_at' => now(), 'updated_at' => now()],
                ['faculty_id' => $bobId ?: 9, 'department' => 'Computer Applications', 'designation' => 'Professor & HOD', 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        // 3. Seed Projects
        $projectId1 = DB::table('projects')->insertGetId([
            'title' => 'RLabZ ERP - Student Portal',
            'project_type' => 'Web Application',
            'source_type' => 'institution',
            'client_name' => 'RLabZ Academy - Department of Computer Science',
            'status' => 'in_progress',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $projectId2 = DB::table('projects')->insertGetId([
            'title' => 'CMS Academic Module',
            'project_type' => 'Academic Module',
            'source_type' => 'institution',
            'client_name' => 'RLabZ Academy - Academic Administration Office',
            'status' => 'closed', // Completed project
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 4. Seed Project Student assignments
        $psNovaProj1 = DB::table('project_student')->insertGetId([
            'project_id' => $projectId1,
            'student_id' => $novaId,
            'role' => 'project_lead', // Team Lead
            'assigned_date' => '2026-08-01',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('project_student')->insert([
            ['project_id' => $projectId1, 'student_id' => $orbitId, 'role' => 'developer', 'assigned_date' => '2026-08-01', 'created_at' => now(), 'updated_at' => now()],
            ['project_id' => $projectId1, 'student_id' => $sparkId, 'role' => 'designer', 'assigned_date' => '2026-08-01', 'created_at' => now(), 'updated_at' => now()],
            
            // Proj 2
            ['project_id' => $projectId2, 'student_id' => $novaId, 'role' => 'developer', 'assigned_date' => '2026-01-10', 'created_at' => now(), 'updated_at' => now()],
            ['project_id' => $projectId2, 'student_id' => $orbitId, 'role' => 'developer', 'assigned_date' => '2026-01-10', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 5. Seed Project Faculty assignments
        DB::table('project_faculty')->insert([
            ['project_id' => $projectId1, 'faculty_id' => $facultyId, 'assigned_date' => '2026-08-01', 'created_at' => now(), 'updated_at' => now()],
            ['project_id' => $projectId2, 'faculty_id' => $facultyId, 'assigned_date' => '2026-01-10', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 6. Seed Modules (Sprints)
        // Project 1 Sprints
        $moduleId1 = DB::table('modules')->insertGetId([
            'project_id' => $projectId1,
            'module_name' => 'Sprint 1: Project Setup & Auth Flow',
            'description' => 'Initialize frontend app workspace, implement routes guard, and connect to Auth Store.',
            'status' => 'completed',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $moduleId2 = DB::table('modules')->insertGetId([
            'project_id' => $projectId1,
            'module_name' => 'Sprint 2: Sidebar Routing & Layouts',
            'description' => 'Design and implement Dashboard Layout, Student Dashboard KPI Cards, and dynamic Sidebar navigation.',
            'status' => 'in_progress',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $moduleId3 = DB::table('modules')->insertGetId([
            'project_id' => $projectId1,
            'module_name' => 'Sprint 3: Core Integration',
            'description' => 'Integrate Reports and Work Logs submission flows with local storage state.',
            'status' => 'not_started',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $moduleId4 = DB::table('modules')->insertGetId([
            'project_id' => $projectId1,
            'module_name' => 'Sprint 4: Certificates & Chat',
            'description' => 'Create certificates page and student meetings calendar.',
            'status' => 'not_started',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Project 2 Sprints
        $moduleId5 = DB::table('modules')->insertGetId([
            'project_id' => $projectId2,
            'module_name' => 'Sprint 1: DB Schema & Auth API',
            'description' => 'Create backend DB models and auth controller.',
            'status' => 'completed',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $moduleId6 = DB::table('modules')->insertGetId([
            'project_id' => $projectId2,
            'module_name' => 'Sprint 2: Course Assignment Logic',
            'description' => 'Develop core controller logic for assigning courses.',
            'status' => 'completed',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 7. Seed Tasks
        // Sprint 1
        $taskId1 = DB::table('tasks')->insertGetId([
            'module_id' => $moduleId1,
            'title' => 'Initialize frontend directory & Vite setup',
            'description' => 'Create project workspace structure',
            'assigned_to' => $novaId,
            'status' => 'completed',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tasks')->insert([
            'module_id' => $moduleId1,
            'title' => 'Configure AuthStore and login UI guards',
            'description' => 'Implement Auth state machine',
            'assigned_to' => $orbitId,
            'status' => 'completed',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Sprint 2
        $taskId2 = DB::table('tasks')->insertGetId([
            'module_id' => $moduleId2,
            'title' => 'Create student sidebar with dynamic active states',
            'description' => 'Build sidebar component',
            'assigned_to' => $novaId,
            'status' => 'completed',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tasks')->insert([
            'module_id' => $moduleId2,
            'title' => 'Design Dashboard KPI grids & charts',
            'description' => 'Build dashboard view metrics',
            'assigned_to' => $orbitId,
            'status' => 'in_progress',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tasks')->insert([
            'module_id' => $moduleId2,
            'title' => 'Remove obsolete project proposal components',
            'description' => 'Cleanup codebase',
            'assigned_to' => $novaId,
            'status' => 'completed',
            'created_by' => $coordinatorId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Sprint 3
        DB::table('tasks')->insert([
            ['module_id' => $moduleId3, 'title' => 'Add progress reports form & list', 'description' => 'Submit reports UI', 'assigned_to' => $novaId, 'status' => 'todo', 'created_by' => $coordinatorId, 'created_at' => now(), 'updated_at' => now()],
            ['module_id' => $moduleId3, 'title' => 'Connect daily logs table to mock storage', 'description' => 'Hookup work log table', 'assigned_to' => $orbitId, 'status' => 'todo', 'created_by' => $coordinatorId, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Sprint 4
        DB::table('tasks')->insert([
            ['module_id' => $moduleId4, 'title' => 'Create certificates page with view and download features', 'description' => 'Build certificates hub', 'assigned_to' => $novaId, 'status' => 'completed', 'created_by' => $coordinatorId, 'created_at' => now(), 'updated_at' => now()],
            ['module_id' => $moduleId4, 'title' => 'Implement meeting list & simple calendar', 'description' => 'Build meetings panel', 'assigned_to' => $orbitId, 'status' => 'todo', 'created_by' => $coordinatorId, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Project 2 Tasks
        DB::table('tasks')->insert([
            ['module_id' => $moduleId5, 'title' => 'Database design & modeling', 'description' => 'Schema creation', 'assigned_to' => $novaId, 'status' => 'completed', 'created_by' => $coordinatorId, 'created_at' => now(), 'updated_at' => now()],
            ['module_id' => $moduleId5, 'title' => 'REST API routes implementation', 'description' => 'Build router endpoints', 'assigned_to' => $orbitId, 'status' => 'completed', 'created_by' => $coordinatorId, 'created_at' => now(), 'updated_at' => now()],
            ['module_id' => $moduleId6, 'title' => 'Course assignment controller logic', 'description' => 'Implement controller handler', 'assigned_to' => $orbitId, 'status' => 'completed', 'created_by' => $coordinatorId, 'created_at' => now(), 'updated_at' => now()],
            ['module_id' => $moduleId6, 'title' => 'Design UI prototype for faculty allocation', 'description' => 'Wireframe UI screens', 'assigned_to' => $novaId, 'status' => 'completed', 'created_by' => $coordinatorId, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 8. Seed Reports
        DB::table('student_reports')->insert([
            [
                'student_id' => $novaId,
                'report_type' => 'weekly',
                'report_date' => '2026-08-07',
                'work_done' => 'Set up modular routes and custom StudentLayout. Created initial dashboard layout and styling base.',
                'approval_status' => 'approved',
                'feedback' => 'Excellent progress on the navigation architecture.',
                'submitted_at' => '2026-08-07 17:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'student_id' => $novaId,
                'report_type' => 'daily',
                'report_date' => '2026-08-08',
                'work_done' => 'Implemented Reports view and Work Logs submission logic.',
                'approval_status' => 'pending',
                'feedback' => null,
                'submitted_at' => '2026-08-08 18:30:00',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // 9. Seed Work Logs
        DB::table('student_work_logs')->insert([
            [
                'project_student_id' => $psNovaProj1,
                'task_id' => $taskId1,
                'work_date' => '2026-08-07',
                'hours_worked' => 6.00,
                'description' => 'Completed routing structure and dynamic sidebar injection logic.',
                'approval_status' => 'approved',
                'approved_by' => $facultyId,
                'approved_at' => '2026-08-08 09:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'project_student_id' => $psNovaProj1,
                'task_id' => $taskId2,
                'work_date' => '2026-08-08',
                'hours_worked' => 4.00,
                'description' => 'Coded Reports form, Work Log submissions and dashboard UI panels.',
                'approval_status' => 'pending',
                'approved_by' => null,
                'approved_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // 10. Seed GitHub Repositories
        DB::table('github_repositories')->insert([
            [
                'project_id' => $projectId1,
                'repository_name' => 'student-nova/rlabz-student-portal',
                'repository_url' => 'https://github.com/student-nova/rlabz-student-portal',
                'submitted_date' => '2026-08-08',
                'is_verified' => true,
                'verified_by' => $facultyId,
                'verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'project_id' => $projectId2,
                'repository_name' => 'student-nova/cms-academic-module',
                'repository_url' => 'https://github.com/student-nova/cms-academic-module',
                'submitted_date' => '2026-02-15',
                'is_verified' => true,
                'verified_by' => $facultyId,
                'verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 11. Seed Certificates
        DB::table('certificates')->insert([
            [
                'project_id' => $projectId2,
                'student_id' => $novaId,
                'certificate_number' => 'CERT-2026-CMS-001',
                'description' => 'CMS Academic Module Completion Certificate',
                'issue_date' => '2026-05-30',
                'issued_by' => $directorId,
            ]
        ]);

        // 12. Seed Meetings
        $meetingId1 = DB::table('meetings')->insertGetId([
            'project_id' => $projectId1,
            'title' => 'Weekly Progress Review',
            'scheduled_at' => '2026-08-11 14:00:00',
            'location' => 'Google Meet',
            'meeting_link' => 'https://meet.google.com/abc-defg-hij',
            'agenda' => "Agenda:\n1. Showcase current prototype UI screens.\n2. Review work log submissions flow.\n3. Discuss GitHub verification status flow with supervisor.",
            'status' => 'scheduled',
            'created_by' => $facultyId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $meetingId2 = DB::table('meetings')->insertGetId([
            'project_id' => $projectId2,
            'title' => 'Project Ideation Discussion',
            'scheduled_at' => '2026-08-05 10:30:00',
            'location' => 'CS Department Seminar Hall 2',
            'meeting_link' => null,
            'agenda' => "Notes:\n- Discussed proposal objectives.\n- Faculty advised focusing on logistic regression and random forest classification.\n- Proposal approved.",
            'status' => 'completed',
            'created_by' => $facultyId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('meeting_participants')->insert([
            ['meeting_id' => $meetingId1, 'user_id' => $novaId, 'attendance_status' => 'invited', 'created_at' => now(), 'updated_at' => now()],
            ['meeting_id' => $meetingId1, 'user_id' => $orbitId, 'attendance_status' => 'invited', 'created_at' => now(), 'updated_at' => now()],
            ['meeting_id' => $meetingId1, 'user_id' => $facultyId, 'attendance_status' => 'invited', 'created_at' => now(), 'updated_at' => now()],
            
            ['meeting_id' => $meetingId2, 'user_id' => $novaId, 'attendance_status' => 'attended', 'created_at' => now(), 'updated_at' => now()],
            ['meeting_id' => $meetingId2, 'user_id' => $facultyId, 'attendance_status' => 'attended', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 13. Seed Chats
        $chatId1 = DB::table('chats')->insertGetId([
            'project_id' => $projectId1,
            'title' => 'RLabZ ERP Chat room',
            'created_by' => $novaId,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('chat_messages')->insert([
            [
                'chat_id' => $chatId1,
                'sender_id' => $novaId,
                'message' => 'Hello Dr. Anjali, I have started building the Student Portal frontend module as per instructions. Could you review the prototype UI next Tuesday?',
                'created_at' => '2026-08-08 15:30:00',
                'updated_at' => '2026-08-08 15:30:00',
            ],
            [
                'chat_id' => $chatId1,
                'sender_id' => $facultyId,
                'message' => 'Hello Student Nova. Yes, that works. Let\'s schedule a meeting during the Weekly Progress Review on Tuesday at 2 PM. Please log your hours.',
                'created_at' => '2026-08-08 16:15:00',
                'updated_at' => '2026-08-08 16:15:00',
            ]
        ]);

        // 14. Seed Notifications for Students
        if (Schema::hasTable('notifications')) {
            DB::table('notifications')->insert([
                [
                    'user_id' => $novaId,
                    'type' => 'meeting',
                    'message' => 'Weekly Progress Review meeting scheduled for Aug 11',
                    'is_read' => false,
                    'created_at' => now()->subHours(2),
                    'updated_at' => now()->subHours(2),
                ],
                [
                    'user_id' => $novaId,
                    'type' => 'work_log',
                    'message' => 'Daily Work Log for Aug 8 successfully submitted',
                    'is_read' => false,
                    'created_at' => now()->subDays(1),
                    'updated_at' => now()->subDays(1),
                ],
                [
                    'user_id' => $novaId,
                    'type' => 'github',
                    'message' => 'GitHub repository URL updated for RLabZ ERP - Student Portal',
                    'is_read' => false,
                    'created_at' => now()->subDays(2),
                    'updated_at' => now()->subDays(2),
                ],
                [
                    'user_id' => $orbitId,
                    'type' => 'meeting',
                    'message' => 'Weekly Progress Review meeting scheduled for Aug 11',
                    'is_read' => false,
                    'created_at' => now()->subHours(2),
                    'updated_at' => now()->subHours(2),
                ],
                [
                    'user_id' => $orbitId,
                    'type' => 'work_log',
                    'message' => 'Daily Work Log for Aug 8 successfully submitted',
                    'is_read' => false,
                    'created_at' => now()->subDays(1),
                    'updated_at' => now()->subDays(1),
                ],
                [
                    'user_id' => $sparkId,
                    'type' => 'meeting',
                    'message' => 'Weekly Progress Review meeting scheduled for Aug 11',
                    'is_read' => false,
                    'created_at' => now()->subHours(2),
                    'updated_at' => now()->subHours(2),
                ]
            ]);
        }
    }
}
