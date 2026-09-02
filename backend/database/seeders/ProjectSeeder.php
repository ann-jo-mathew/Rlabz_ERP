<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProjectSeeder extends Seeder
{
    public function run()
    {
        if (!Schema::hasTable('projects')) {
            return;
        }

        $directorId = DB::table('users')->where('role', 'director')->value('id') ?? 1;

        $projects = [
            [
                'title' => 'Rajagiri ERP System & Executive Control Panel',
                'project_type' => 'Web Application',
                'source_type' => 'institution',
                'brought_by' => 'Director Office',
                'client_name' => 'Department of Computer Applications',
                'contact_email' => 'director@rajagiri.edu',
                'contact_phone' => '+91 484 2660601',
                'requirements' => 'Multi-role enterprise web portal providing Director Oversight, Co-ordinator Workspaces, Faculty Portals, Student Designation Tracks (Nova/Orbit/Spark), and Real-time System Audit Logging.',
                'deliverables' => 'Modular Laravel backend, Single-Page Responsive Javascript Frontend, Role-Based Access Control, MySQL Database Integration.',
                'expected_timeline' => '2026-10-31',
                'budget' => 125000.00,
                'priority' => 'urgent',
                'status' => 'in_progress',
                'created_by' => $directorId,
                'created_at' => now()->subDays(10),
                'updated_at' => now()
            ],
            [
                'title' => 'Automated Attendance System via Face Detection',
                'project_type' => 'AI/ML System',
                'source_type' => 'faculty',
                'brought_by' => 'Dr. Alice Smith',
                'client_name' => 'Department of Computer Applications',
                'contact_email' => 'alice.smith@rajagiri.edu',
                'contact_phone' => '+91 484 2660605',
                'requirements' => 'AI-powered automated student attendance tracker using facial recognition models integrated with classroom IP cameras and attendance database.',
                'deliverables' => 'Python OpenCV Facial Recognition Engine, Real-Time Web Dashboard, Automated Absentees Email Alerts.',
                'expected_timeline' => '2026-09-15',
                'budget' => 60000.00,
                'priority' => 'urgent',
                'status' => 'proposed',
                'created_by' => $directorId,
                'created_at' => now()->subDays(5),
                'updated_at' => now()
            ],
            [
                'title' => 'Smart Lab Inventory & Equipment Tracker',
                'project_type' => 'IoT & Automation',
                'source_type' => 'faculty',
                'brought_by' => 'Prof. Bob Johnson',
                'client_name' => 'Rajagiri Hardware Maintenance Division',
                'contact_email' => 'bob.johnson@rajagiri.edu',
                'contact_phone' => '+91 484 2660610',
                'requirements' => 'Barcode and RFID scanner integration for tracking high-value computer hardware components, microcontrollers, servers, and lab maintenance schedules.',
                'deliverables' => 'Hardware Barcode Scanner API, Maintenance Audit Log, Stock Reorder Alert System.',
                'expected_timeline' => '2026-08-30',
                'budget' => 80000.00,
                'priority' => 'normal',
                'status' => 'in_progress',
                'created_by' => $directorId,
                'created_at' => now()->subDays(12),
                'updated_at' => now()
            ],
            [
                'title' => 'Alumni Network & Career Mentorship Portal',
                'project_type' => 'Web Application',
                'source_type' => 'alumni',
                'brought_by' => 'Rajagiri Alumni Council',
                'client_name' => 'Rajagiri Placement Cell & Alumni Relations',
                'contact_email' => 'alumni@rajagiri.edu',
                'contact_phone' => '+91 484 2660620',
                'requirements' => 'Alumni registration, career mentoring session scheduler, job referral board, and annual alumni meet event ticket booking.',
                'deliverables' => 'Alumni Directory Search, Job Referral Wall, Interactive Calendar, Payment Gateway Integration.',
                'expected_timeline' => '2026-11-30',
                'budget' => 95000.00,
                'priority' => 'normal',
                'status' => 'accepted',
                'created_by' => $directorId,
                'created_at' => now()->subDays(15),
                'updated_at' => now()
            ],
            [
                'title' => 'Library RFID Automation & E-Resource Access Hub',
                'project_type' => 'Web & Hardware',
                'source_type' => 'external',
                'brought_by' => 'Central Library Committee',
                'client_name' => 'Rajagiri Central Library',
                'contact_email' => 'library@rajagiri.edu',
                'contact_phone' => '+91 484 2660630',
                'requirements' => 'Automated book check-in/check-out kiosks using RFID card readers, digital journal search repository, and overdue fine calculator.',
                'deliverables' => 'RFID Kiosk Software, Digital Journal Search Engine, Auto Fine Notification System.',
                'expected_timeline' => '2026-12-15',
                'budget' => 110000.00,
                'priority' => 'normal',
                'status' => 'proposed',
                'created_by' => $directorId,
                'created_at' => now()->subDays(2),
                'updated_at' => now()
            ]
        ];

        foreach ($projects as $proj) {
            DB::table('projects')->updateOrInsert(
                ['title' => $proj['title']],
                $proj
            );
        }
    }
}
