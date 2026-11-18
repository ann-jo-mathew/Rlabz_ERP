<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

/**
 * RLabZProjectsSeeder
 *
 * Clears ALL existing project data and re-seeds from the official RLabZ project
 * roster. Students, faculty, finance (estimates), modules, tasks, and work-logs
 * are all created fresh.
 *
 * Finance estimates use a standard per-student budget:
 *   - Internal / Ongoing projects:   ₹25,000 per student (base)
 *   - Completed & Deployed projects: ₹20,000 per student (base, already delivered)
 *   - Research project:              ₹15,000 per student (academic rate)
 *   Allocation split: 40 % student | 20 % faculty | 40 % RLabZ overhead
 *
 * Default student designation: orbit
 * Student hourly rate: ₹300 / hour
 */
class RLabZProjectsSeeder extends Seeder
{
    // ─── Finance constants ────────────────────────────────────────────────────
    const HOURLY_RATE        = 300.00;
    const BUDGET_ONGOING     = 25000.00;   // per student
    const BUDGET_COMPLETED   = 20000.00;   // per student
    const BUDGET_RESEARCH    = 15000.00;   // per student

    public function run()
    {
        // ═══════════════════════════════════════════════════════════════════
        // STEP 1 ─ Wipe all project-related data (safest: delete leaf → root)
        // ═══════════════════════════════════════════════════════════════════
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        DB::table('ssl_renewal_history')->delete();
        DB::table('hosting_charges')->delete();
        DB::table('maintenance_support_charges')->delete();
        DB::table('marketing_expenses')->delete();
        DB::table('client_payments')->delete();
        DB::table('invoice_items')->delete();
        DB::table('invoices')->delete();
        DB::table('faculty_payments')->delete();
        DB::table('student_payments')->delete();
        DB::table('development_allocations')->delete();
        DB::table('project_finances')->delete();
        DB::table('student_work_logs')->delete();
        DB::table('tasks')->delete();
        DB::table('modules')->delete();
        DB::table('project_student')->delete();
        DB::table('project_faculty')->delete();
        DB::table('requirement_changes')->delete();
        DB::table('client_requirements')->delete();
        DB::table('project_closures')->delete();
        DB::table('certificates')->delete();
        DB::table('meeting_participants')->delete();
        DB::table('meetings')->delete();
        DB::table('projects')->delete();

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // ═══════════════════════════════════════════════════════════════════
        // STEP 2 ─ Resolve / create system users (coordinator writes projects)
        // ═══════════════════════════════════════════════════════════════════
        $coordinatorId = DB::table('users')->where('role', 'coordinator')->value('id')
            ?? DB::table('users')->where('email', 'coordinator@rajagiri.edu')->value('id')
            ?? 1;
        $financeId     = DB::table('users')->where('role', 'finance')->value('id')
            ?? $coordinatorId;

        // ═══════════════════════════════════════════════════════════════════
        // STEP 3 ─ Faculty users (upsert by email)
        // ═══════════════════════════════════════════════════════════════════
        $facultyMap = [
            'Ajay Antony Joseph'   => 'ajay.antony@rajagiri.edu',
            'Diljith K Benny'      => 'diljith.benny@rajagiri.edu',
            'Sabeen Govind'        => 'sabeen.govind@rajagiri.edu',
            'Ananthakrishnan K V'  => 'ananthakrishnan.kv@rajagiri.edu',
        ];

        $facultyIds = [];
        foreach ($facultyMap as $name => $email) {
            $existing = DB::table('users')->where('email', $email)->first();
            if ($existing) {
                $facultyIds[$name] = $existing->id;
            } else {
                $id = DB::table('users')->insertGetId([
                    'name'       => $name,
                    'email'      => $email,
                    'password'   => Hash::make('faculty123'),
                    'role'       => 'faculty',
                    'permissions'=> json_encode(['view-faculty', 'view-projects', 'view-communication']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $facultyIds[$name] = $id;
            }
            // Ensure faculty_profile row
            DB::table('faculty_profiles')->updateOrInsert(
                ['faculty_id' => $facultyIds[$name]],
                [
                    'department'  => 'Computer Applications',
                    'designation' => 'Assistant Professor',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]
            );
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 4 ─ Student users (upsert by email)
        // ═══════════════════════════════════════════════════════════════════
        // Full unique student list extracted from all projects
        $allStudents = [
            'Yahwin Lukose',
            'Ann Treesa Jijo',
            'Geethika A',
            'Ashbi Saju',
            'Jasin Joji',
            'Jees Thomas Cleetas',
            'Kishore M',
            'Rena Elza Viju',
            'Mahadevan Nair',
            'Abhinav B Prasad',
            'Tom Geo',
            'Viswas B Kurian',
            'Maria Jose',
            'Treesa Jose',
            'Athira Binu',
            'Jefin Joby',
            'Anandhu Krishna B',
            'Febin Sunny',
            'Nikhil Krishna RD',
            'Shyam James',
            'Albin Mammen Mathew',
            'Sreeraj Sreekumar',
            'Ebin Louis',
            'Diya Mary George',
            'Merlin Xavier',
            'Jiyo P V',
            'Akshay Shibu',
            'Dion Siji',
            'Hafiz Muhammad',
            'Anwin Jojo',
            'Joseph Paul',
            'Jubin Joy',
            'Devna J',
            'Daya Mathew',
            'Pooja Nair',
            'Nandhana C S',
            'Sharvin Vincent',
            'Anaswara Prasobh',
            'Rosha Thankachan',
            'Sandra B',
            'Lena Mathew',
            'Farsan Suneer',
            'Albert C S',
            'Ann Jo Mathew',
            'Amina Muhammed',
            'M S Vismaya',
            'Novelia Joseph',
            'Devika B Menon',
            'Jees Thomas Cleetus', // duplicate normalisation
        ];

        // De-duplicate
        $allStudents = array_values(array_unique($allStudents));

        $studentIds = [];
        foreach ($allStudents as $studentName) {
            $emailSlug = strtolower(str_replace([' ', '.'], ['.', ''], $studentName));
            $email     = $emailSlug . '@rajagiri.edu';

            $existing = DB::table('users')->where('email', $email)->first();
            if ($existing) {
                $studentIds[$studentName] = $existing->id;
            } else {
                $id = DB::table('users')->insertGetId([
                    'name'        => $studentName,
                    'email'       => $email,
                    'password'    => Hash::make('student123'),
                    'role'        => 'student',
                    'permissions' => json_encode(['view-student', 'view-projects', 'view-communication', 'view-certificates-read']),
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
                $studentIds[$studentName] = $id;
            }

            // Ensure student_profile row
            DB::table('student_profiles')->updateOrInsert(
                ['student_id' => $studentIds[$studentName]],
                [
                    'course'       => 'MCA',
                    'batch'        => '2026',
                    'semester'     => 4,
                    'designation'  => 'orbit',
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]
            );
        }

        // helper: resolve student id (tolerates small name variations)
        $sid = function (string $name) use ($studentIds): int {
            if (isset($studentIds[$name])) {
                return $studentIds[$name];
            }
            // fuzzy fallback – try partial match
            foreach ($studentIds as $key => $id) {
                if (stripos($key, explode(' ', $name)[0]) !== false) {
                    return $id;
                }
            }
            return 1; // last resort
        };

        // helper: resolve faculty id
        $fid = function (?string $name) use ($facultyIds, $coordinatorId): ?int {
            if (!$name) return null;
            return $facultyIds[$name] ?? null;
        };

        // ═══════════════════════════════════════════════════════════════════
        // STEP 5 ─ Helper closures
        // ═══════════════════════════════════════════════════════════════════

        /** Create / get project, return id */
        $createProject = function (
            string  $title,
            string  $status,       // 'in_progress' | 'completed' | 'closed'
            ?string $description,
            float   $budget,
            string  $sourceType,
            string  $clientName,
            int     $createdBy
        ) : int {
            $existing = DB::table('projects')->where('title', $title)->first();
            if ($existing) return $existing->id;

            return DB::table('projects')->insertGetId([
                'title'             => $title,
                'project_type'      => 'Web Application',
                'source_type'       => $sourceType,
                'brought_by'        => 'RLabZ',
                'client_name'       => $clientName,
                'contact_email'     => 'rlabz@rajagiri.edu',
                'contact_phone'     => '+91 484 2660600',
                'requirements'      => $description ?? $title,
                'deliverables'      => 'Fully functional software system with documentation.',
                'expected_timeline' => Carbon::now()->addMonths(6)->toDateString(),
                'budget'            => $budget,
                'priority'          => 'normal',
                'status'            => $status,
                'created_by'        => $createdBy,
                'created_at'        => Carbon::now()->subMonths(3),
                'updated_at'        => now(),
            ]);
        };

        /** Create project finance + default allocations, return finance id */
        $createFinance = function (int $projectId, float $budget) use ($coordinatorId): int {
            $studentShare = round($budget * 0.40, 2);
            $facultyShare = round($budget * 0.20, 2);
            $rlabzShare   = round($budget - $studentShare - $facultyShare, 2);

            $gstPct       = 18.00;
            $subtotal     = $budget;
            $gstAmount    = round($subtotal * $gstPct / 100, 2);
            $totalAmount  = round($subtotal + $gstAmount, 2);

            $pfId = DB::table('project_finances')->insertGetId([
                'project_id'               => $projectId,
                'total_development_amount' => $budget,
                'marketing_budget'         => round($budget * 0.05, 2),
                'overhead_budget'          => round($budget * 0.10, 2),
                'estimated_cost'           => $budget,
                'subtotal'                 => $subtotal,
                'gst_amount'               => $gstAmount,
                'total_amount'             => $totalAmount,
                'created_by'               => $coordinatorId,
                'status'                   => 'approved',
                'created_at'               => now(),
                'updated_at'               => now(),
            ]);

            DB::table('development_allocations')->insert([
                ['project_finance_id' => $pfId, 'category' => 'student', 'amount' => $studentShare, 'created_at' => now(), 'updated_at' => now()],
                ['project_finance_id' => $pfId, 'category' => 'faculty', 'amount' => $facultyShare, 'created_at' => now(), 'updated_at' => now()],
                ['project_finance_id' => $pfId, 'category' => 'rlabz',   'amount' => $rlabzShare,   'created_at' => now(), 'updated_at' => now()],
            ]);

            return $pfId;
        };

        /** Assign student to project, return project_student id */
        $assignStudent = function (int $projectId, int $studentId, string $role = 'developer'): int {
            $allowed = ['project_lead', 'developer', 'designer', 'tester', 'other'];
            $role    = in_array($role, $allowed) ? $role : 'developer';

            $existing = DB::table('project_student')
                ->where('project_id', $projectId)
                ->where('student_id', $studentId)
                ->first();
            if ($existing) return $existing->id;

            return DB::table('project_student')->insertGetId([
                'project_id'    => $projectId,
                'student_id'    => $studentId,
                'role'          => $role,
                'assigned_date' => Carbon::now()->subMonths(3)->toDateString(),
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        };

        /** Assign faculty to project, return project_faculty id */
        $assignFaculty = function (int $projectId, int $facultyId): int {
            $existing = DB::table('project_faculty')
                ->where('project_id', $projectId)
                ->where('faculty_id', $facultyId)
                ->first();
            if ($existing) return $existing->id;

            return DB::table('project_faculty')->insertGetId([
                'project_id'    => $projectId,
                'faculty_id'    => $facultyId,
                'assigned_date' => Carbon::now()->subMonths(3)->toDateString(),
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        };

        /** Create a module, return module id */
        $createModule = function (int $projectId, string $name, float $weight, string $status, int $creatorId): int {
            return DB::table('modules')->insertGetId([
                'project_id'        => $projectId,
                'module_name'       => $name,
                'weight_percentage' => $weight,
                'description'       => $name,
                'status'            => $status,
                'created_by'        => $creatorId,
                'created_at'        => Carbon::now()->subDays(60),
                'updated_at'        => now(),
            ]);
        };

        /** Create a task, return task id */
        $createTask = function (int $moduleId, string $title, int $assignedTo, string $status, int $creatorId, ?int $reviewedBy = null): int {
            $reviewedAt = $reviewedBy && in_array($status, ['completed']) ? Carbon::now()->subDays(rand(5, 20))->toDateTimeString() : null;
            $rating     = $reviewedBy && $status === 'completed' ? round(rand(44, 50) / 10, 1) : null;

            return DB::table('tasks')->insertGetId([
                'module_id'   => $moduleId,
                'title'       => $title,
                'description' => $title,
                'assigned_to' => $assignedTo,
                'status'      => $status,
                'rating'      => $rating,
                'due_date'    => Carbon::now()->addDays(rand(14, 60))->toDateString(),
                'reviewed_by' => $reviewedBy,
                'reviewed_at' => $reviewedAt,
                'created_by'  => $creatorId,
                'created_at'  => Carbon::now()->subDays(45),
                'updated_at'  => now(),
            ]);
        };

        /** Add a work log entry */
        $addWorkLog = function (int $psId, int $taskId, float $hours, string $desc, int $approvedBy): void {
            DB::table('student_work_logs')->insert([
                'project_student_id' => $psId,
                'task_id'            => $taskId,
                'work_date'          => Carbon::now()->subDays(rand(10, 60))->toDateString(),
                'hours_worked'       => $hours,
                'description'        => $desc,
                'approval_status'    => 'approved',
                'approved_by'        => $approvedBy,
                'approved_at'        => Carbon::now()->subDays(rand(5, 10))->toDateTimeString(),
                'rating'             => round(rand(44, 50) / 10, 1),
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
        };

        /** Create a simple invoice + client payment for completed/deployed projects */
        $createSimpleInvoice = function (int $pfId, string $invoiceNumber, float $amount, bool $paid) use ($financeId): void {
            $invoiceDate = Carbon::now()->subMonths(2)->toDateString();
            $dueDate     = Carbon::now()->subMonth()->toDateString();

            $invId = DB::table('invoices')->insertGetId([
                'project_finance_id' => $pfId,
                'invoice_number'     => $invoiceNumber,
                'invoice_date'       => $invoiceDate,
                'due_date'           => $dueDate,
                'amount_before_gst'  => $amount,
                'gst_percentage'     => 18.00,
                'description'        => 'Project delivery invoice',
                'created_by'         => $financeId,
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);

            if ($paid) {
                DB::table('client_payments')->insert([
                    'invoice_id'        => $invId,
                    'amount'            => round($amount * 1.18, 2),
                    'payment_date'      => Carbon::now()->subMonths(1)->toDateString(),
                    'payment_method'    => 'bank_transfer',
                    'payment_reference' => 'TXN-' . strtoupper(str_replace('-', '', $invoiceNumber)),
                    'remarks'           => 'Full settlement received',
                    'recorded_by'       => $financeId,
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ]);
            }
        };

        // ═══════════════════════════════════════════════════════════════════
        // Ensure finance_settings row
        // ═══════════════════════════════════════════════════════════════════
        if (!DB::table('finance_settings')->exists()) {
            DB::table('finance_settings')->insert([
                'id'                 => 1,
                'student_hourly_rate'=> self::HOURLY_RATE,
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 6 ─ Seed each project
        // ═══════════════════════════════════════════════════════════════════

        $invoiceCounter = 1;
        $nextInv = function () use (&$invoiceCounter): string {
            return 'RLABZ-INV-' . str_pad($invoiceCounter++, 3, '0', STR_PAD_LEFT);
        };

        // ─────────────────────────────────────────────────────────────────
        // 1. Event Documentation Platform (EDP)
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'Event Documentation Platform',
            'in_progress',
            'Event Documentation Platform (EDP) is a web-based application designed to simplify college event management and documentation. It enables departments to manage events, upload and organize photos, videos and documents through Google Drive, collaborate with users, track activities, and generate event reports through a centralized platform.',
            3 * self::BUDGET_ONGOING,
            'institution',
            'Rajagiri College of Social Sciences',
            $coordinatorId
        );
        $pfId = $createFinance($pId, 3 * self::BUDGET_ONGOING);
        $facultyId = $fid('Ajay Antony Joseph');
        if ($facultyId) $assignFaculty($pId, $facultyId);
        $ps1 = $assignStudent($pId, $sid('Yahwin Lukose'),  'project_lead');
        $ps2 = $assignStudent($pId, $sid('Ann Treesa Jijo'), 'developer');
        $ps3 = $assignStudent($pId, $sid('Geethika A'),      'developer');
        $m1 = $createModule($pId, 'Event Management Core',    40.00, 'in_progress', $coordinatorId);
        $m2 = $createModule($pId, 'Media Upload & Drive Sync', 35.00, 'in_progress', $coordinatorId);
        $m3 = $createModule($pId, 'Report Generation',         25.00, 'not_started', $coordinatorId);
        $t1 = $createTask($m1, 'Design event CRUD endpoints',          $sid('Yahwin Lukose'),   'in_progress', $coordinatorId, $facultyId);
        $t2 = $createTask($m1, 'Build department calendar view',       $sid('Ann Treesa Jijo'), 'todo',        $coordinatorId);
        $t3 = $createTask($m2, 'Integrate Google Drive upload API',     $sid('Geethika A'),     'in_progress', $coordinatorId, $facultyId);
        $t4 = $createTask($m2, 'Photo/video gallery component',        $sid('Ann Treesa Jijo'), 'todo',        $coordinatorId);
        $t5 = $createTask($m3, 'Auto-generate PDF event reports',      $sid('Yahwin Lukose'),   'todo',        $coordinatorId);
        if ($facultyId) {
            $addWorkLog($ps1, $t1, 20.00, 'Developed REST API for event management with validation',         $facultyId);
            $addWorkLog($ps2, $t2, 15.00, 'Designed interactive calendar with filter by department',         $facultyId);
            $addWorkLog($ps3, $t3, 18.00, 'Configured Google Drive OAuth and folder sync',                   $facultyId);
        }

        // ─────────────────────────────────────────────────────────────────
        // 2. Mentrix
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'Mentrix',
            'in_progress',
            'Mentrix – Mentorship & Academic Success Platform is a web-based mentoring management system developed for Rajagiri College of Social Sciences. It streamlines the mentor–mentee process by providing a centralized platform for managing students, faculty, mentor assignments, mentoring sessions, academic progress and reports.',
            5 * self::BUDGET_ONGOING,
            'institution',
            'Rajagiri College of Social Sciences',
            $coordinatorId
        );
        $pfId = $createFinance($pId, 5 * self::BUDGET_ONGOING);
        $facultyId = $fid('Diljith K Benny');
        if ($facultyId) $assignFaculty($pId, $facultyId);
        $assignStudent($pId, $sid('Ashbi Saju'),          'project_lead');
        $assignStudent($pId, $sid('Jasin Joji'),           'developer');
        $assignStudent($pId, $sid('Jees Thomas Cleetas'),  'developer');
        $assignStudent($pId, $sid('Kishore M'),            'developer');
        $assignStudent($pId, $sid('Rena Elza Viju'),       'designer');
        $m1 = $createModule($pId, 'Mentor Assignment Engine',    35.00, 'in_progress', $coordinatorId);
        $m2 = $createModule($pId, 'Session & Progress Tracking', 35.00, 'in_progress', $coordinatorId);
        $m3 = $createModule($pId, 'Reports & Communication',     30.00, 'not_started', $coordinatorId);
        $t1 = $createTask($m1, 'Mentor-mentee matching algorithm',         $sid('Ashbi Saju'),         'in_progress', $coordinatorId, $facultyId);
        $t2 = $createTask($m1, 'Mentor dashboard and profile views',       $sid('Jasin Joji'),          'in_progress', $coordinatorId, $facultyId);
        $t3 = $createTask($m2, 'Session scheduling & calendar integration', $sid('Jees Thomas Cleetas'), 'in_progress', $coordinatorId);
        $t4 = $createTask($m2, 'Academic progress tracker & grade charts',  $sid('Kishore M'),          'todo',        $coordinatorId);
        $t5 = $createTask($m3, 'Automated mentoring session PDF reports',   $sid('Rena Elza Viju'),     'todo',        $coordinatorId);
        $ps1 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Ashbi Saju'))->value('id');
        $ps2 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Jasin Joji'))->value('id');
        if ($facultyId && $ps1 && $t1) $addWorkLog($ps1, $t1, 24.00, 'Built rule-based mentor-mentee assignment with conflict resolution', $facultyId);
        if ($facultyId && $ps2 && $t2) $addWorkLog($ps2, $t2, 18.00, 'Designed mentor dashboard with session history timeline',           $facultyId);

        // ─────────────────────────────────────────────────────────────────
        // 3. Placement Management Software
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'Placement Management Software',
            'in_progress',
            'A comprehensive placement management system to streamline campus recruitment, student application tracking, company onboarding, and placement analytics for Rajagiri College.',
            5 * self::BUDGET_ONGOING,
            'institution',
            'Rajagiri College of Social Sciences',
            $coordinatorId
        );
        $pfId = $createFinance($pId, 5 * self::BUDGET_ONGOING);
        $facultyId = $fid('Ajay Antony Joseph');
        if ($facultyId) $assignFaculty($pId, $facultyId);
        $assignStudent($pId, $sid('Mahadevan Nair'),     'project_lead');
        $assignStudent($pId, $sid('Abhinav B Prasad'),   'developer');
        $assignStudent($pId, $sid('Yahwin Lukose'),       'developer');
        $assignStudent($pId, $sid('Tom Geo'),             'developer');
        $assignStudent($pId, $sid('Viswas B Kurian'),     'designer');
        $m1 = $createModule($pId, 'Company & Drive Portal',    40.00, 'in_progress', $coordinatorId);
        $m2 = $createModule($pId, 'Student Application Tracker',35.00, 'in_progress', $coordinatorId);
        $m3 = $createModule($pId, 'Analytics & Reports',       25.00, 'not_started', $coordinatorId);
        $t1 = $createTask($m1, 'Company registration & job posting module',    $sid('Mahadevan Nair'),   'in_progress', $coordinatorId, $facultyId);
        $t2 = $createTask($m1, 'Drive scheduling & interview slot management', $sid('Abhinav B Prasad'), 'todo',        $coordinatorId);
        $t3 = $createTask($m2, 'Student profile & application dashboard',      $sid('Yahwin Lukose'),    'in_progress', $coordinatorId, $facultyId);
        $t4 = $createTask($m2, 'Application status tracker with notifications',$sid('Tom Geo'),          'todo',        $coordinatorId);
        $t5 = $createTask($m3, 'Placement analytics dashboard',                $sid('Viswas B Kurian'),  'todo',        $coordinatorId);
        $ps1 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Mahadevan Nair'))->value('id');
        $ps3 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Yahwin Lukose'))->value('id');
        if ($facultyId && $ps1 && $t1) $addWorkLog($ps1, $t1, 22.00, 'Developed company registration form with document upload',   $facultyId);
        if ($facultyId && $ps3 && $t3) $addWorkLog($ps3, $t3, 18.00, 'Built student profile module with resume builder component', $facultyId);

        // ─────────────────────────────────────────────────────────────────
        // 4. Rajagiri Flora
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'Rajagiri Flora',
            'closed',
            'QR-based plant identification system for the Biotech department at RCSS and RBS. Students and visitors scan QR codes placed near plants to view species details, medicinal properties, and care information.',
            3 * self::BUDGET_COMPLETED,
            'institution',
            'Rajagiri College of Social Sciences - Biotech Dept',
            $coordinatorId
        );
        $pfId = $createFinance($pId, 3 * self::BUDGET_COMPLETED);
        $facultyId = $fid('Ajay Antony Joseph');
        if ($facultyId) $assignFaculty($pId, $facultyId);
        $assignStudent($pId, $sid('Maria Jose'),  'project_lead');
        $assignStudent($pId, $sid('Treesa Jose'), 'developer');
        $assignStudent($pId, $sid('Athira Binu'), 'developer');
        $m1 = $createModule($pId, 'QR Generation & Plant Database', 50.00, 'completed', $coordinatorId);
        $m2 = $createModule($pId, 'Mobile-Friendly Display App',     50.00, 'completed', $coordinatorId);
        $t1 = $createTask($m1, 'Plant database design & QR code generation',    $sid('Maria Jose'),  'completed', $coordinatorId, $facultyId);
        $t2 = $createTask($m1, 'Admin panel for plant entry management',         $sid('Treesa Jose'), 'completed', $coordinatorId, $facultyId);
        $t3 = $createTask($m2, 'Mobile-responsive plant detail page',            $sid('Athira Binu'), 'completed', $coordinatorId, $facultyId);
        $t4 = $createTask($m2, 'QR scanner integration & offline cache support', $sid('Maria Jose'),  'completed', $coordinatorId, $facultyId);
        $ps1 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Maria Jose'))->value('id');
        $ps2 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Treesa Jose'))->value('id');
        $ps3 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Athira Binu'))->value('id');
        if ($facultyId) {
            if ($ps1 && $t1) $addWorkLog($ps1, $t1, 20.00, 'Designed plant database schema and QR generation service',     $facultyId);
            if ($ps2 && $t2) $addWorkLog($ps2, $t2, 18.00, 'Built admin panel for plant management with photo upload',     $facultyId);
            if ($ps3 && $t3) $addWorkLog($ps3, $t3, 16.00, 'Developed responsive plant detail pages with gallery',         $facultyId);
        }
        $createSimpleInvoice($pfId, $nextInv(), 3 * self::BUDGET_COMPLETED * 0.9, true);
        // Project closure record
        DB::table('project_closures')->insert([
            'project_id'    => $pId,
            'closed_by'     => $coordinatorId,
            'closure_date'  => Carbon::now()->subMonths(1)->toDateTimeString(),
            'final_status'  => 'completed',
            'remarks'       => 'QR plant identification system deployed successfully in Biotech department.',
        ]);

        // ─────────────────────────────────────────────────────────────────
        // 5. Collabsphere
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'Collabsphere',
            'in_progress',
            'A collaborative workspace platform enabling real-time document collaboration, project boards, and communication channels for teams within Rajagiri.',
            2 * self::BUDGET_ONGOING,
            'institution',
            'RLabZ Internal',
            $coordinatorId
        );
        $createFinance($pId, 2 * self::BUDGET_ONGOING);
        $assignStudent($pId, $sid('Jefin Joby'), 'project_lead');
        $assignStudent($pId, $sid('Jasin Joji'), 'developer');
        $m1 = $createModule($pId, 'Real-Time Collaboration Engine', 50.00, 'in_progress', $coordinatorId);
        $m2 = $createModule($pId, 'Communication Channels',         50.00, 'not_started', $coordinatorId);
        $createTask($m1, 'WebSocket collaboration backend',        $sid('Jefin Joby'), 'in_progress', $coordinatorId);
        $createTask($m1, 'Shared document editor component',       $sid('Jasin Joji'), 'todo',        $coordinatorId);
        $createTask($m2, 'Team channels & direct messaging UI',    $sid('Jefin Joby'), 'todo',        $coordinatorId);

        // ─────────────────────────────────────────────────────────────────
        // 6. ICSWHMH
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'ICSWHMH',
            'in_progress',
            'An integrated care and support system focused on well-being and health management for college communities.',
            4 * self::BUDGET_ONGOING,
            'institution',
            'RLabZ Internal',
            $coordinatorId
        );
        $createFinance($pId, 4 * self::BUDGET_ONGOING);
        $assignStudent($pId, $sid('Anandhu Krishna B'), 'project_lead');
        $assignStudent($pId, $sid('Febin Sunny'),       'developer');
        $assignStudent($pId, $sid('Nikhil Krishna RD'), 'developer');
        $assignStudent($pId, $sid('Shyam James'),       'developer');
        $m1 = $createModule($pId, 'Health Monitoring Core', 50.00, 'in_progress', $coordinatorId);
        $m2 = $createModule($pId, 'Support & Case Management', 50.00, 'not_started', $coordinatorId);
        $createTask($m1, 'Health record management module',        $sid('Anandhu Krishna B'), 'in_progress', $coordinatorId);
        $createTask($m1, 'Dashboard for well-being metrics',       $sid('Febin Sunny'),       'in_progress', $coordinatorId);
        $createTask($m2, 'Case assignment and counsellor portal',  $sid('Nikhil Krishna RD'), 'todo',        $coordinatorId);
        $createTask($m2, 'Alert & escalation notification system', $sid('Shyam James'),       'todo',        $coordinatorId);

        // ─────────────────────────────────────────────────────────────────
        // 7. RPay
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'RPay',
            'in_progress',
            'An internal payment gateway and fee management system for Rajagiri College enabling online fee payments, receipts, and financial reconciliation.',
            2 * self::BUDGET_ONGOING,
            'institution',
            'Rajagiri College of Social Sciences',
            $coordinatorId
        );
        $createFinance($pId, 2 * self::BUDGET_ONGOING);
        $assignStudent($pId, $sid('Anandhu Krishna B'), 'project_lead');
        $assignStudent($pId, $sid('Febin Sunny'),       'developer');
        $m1 = $createModule($pId, 'Payment Gateway Integration', 60.00, 'in_progress', $coordinatorId);
        $m2 = $createModule($pId, 'Receipt & Reconciliation',    40.00, 'not_started', $coordinatorId);
        $createTask($m1, 'Razorpay / payment gateway API integration', $sid('Anandhu Krishna B'), 'in_progress', $coordinatorId);
        $createTask($m1, 'Fee payment flow & confirmation UI',         $sid('Febin Sunny'),       'in_progress', $coordinatorId);
        $createTask($m2, 'Automated receipt generation and email',     $sid('Anandhu Krishna B'), 'todo',        $coordinatorId);

        // ─────────────────────────────────────────────────────────────────
        // 8. RTMS
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'RTMS',
            'in_progress',
            'Real-Time Monitoring System providing live dashboards and alert management for campus infrastructure and services.',
            1 * self::BUDGET_ONGOING,
            'institution',
            'RLabZ Internal',
            $coordinatorId
        );
        $createFinance($pId, 1 * self::BUDGET_ONGOING);
        $assignStudent($pId, $sid('Albin Mammen Mathew'), 'project_lead');
        $m1 = $createModule($pId, 'Real-Time Dashboard', 60.00, 'in_progress', $coordinatorId);
        $m2 = $createModule($pId, 'Alert & Notification Engine', 40.00, 'not_started', $coordinatorId);
        $createTask($m1, 'Live data streaming dashboard (WebSocket)', $sid('Albin Mammen Mathew'), 'in_progress', $coordinatorId);
        $createTask($m1, 'Metric cards and chart components',         $sid('Albin Mammen Mathew'), 'todo',        $coordinatorId);
        $createTask($m2, 'Threshold-based alert configuration UI',    $sid('Albin Mammen Mathew'), 'todo',        $coordinatorId);

        // ─────────────────────────────────────────────────────────────────
        // 9. Resource Booking System
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'Resource Booking System',
            'in_progress',
            'A centralized platform allowing faculty and students to book labs, seminar halls, projectors, and other campus resources with conflict detection and admin approval workflows.',
            5 * self::BUDGET_ONGOING,
            'institution',
            'Rajagiri College of Social Sciences',
            $coordinatorId
        );
        $createFinance($pId, 5 * self::BUDGET_ONGOING);
        $assignStudent($pId, $sid('Jees Thomas Cleetas'), 'project_lead');
        $assignStudent($pId, $sid('Sreeraj Sreekumar'),   'developer');
        $assignStudent($pId, $sid('Ebin Louis'),           'developer');
        $assignStudent($pId, $sid('Diya Mary George'),     'designer');
        $assignStudent($pId, $sid('Merlin Xavier'),        'developer');
        $m1 = $createModule($pId, 'Booking & Availability Engine', 40.00, 'in_progress', $coordinatorId);
        $m2 = $createModule($pId, 'Admin Approval & Conflict Detection', 35.00, 'in_progress', $coordinatorId);
        $m3 = $createModule($pId, 'Calendar & Notification UI', 25.00, 'not_started', $coordinatorId);
        $createTask($m1, 'Resource catalog CRUD management',          $sid('Jees Thomas Cleetas'), 'in_progress', $coordinatorId);
        $createTask($m1, 'Availability slot engine & conflict check', $sid('Sreeraj Sreekumar'),   'in_progress', $coordinatorId);
        $createTask($m2, 'Admin approval workflow & email alerts',    $sid('Ebin Louis'),           'todo',        $coordinatorId);
        $createTask($m3, 'Booking calendar & user dashboard UI',      $sid('Diya Mary George'),     'todo',        $coordinatorId);
        $createTask($m3, 'Push notification service integration',     $sid('Merlin Xavier'),        'todo',        $coordinatorId);

        // ─────────────────────────────────────────────────────────────────
        // 10. Rajagiri Recruits
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'Rajagiri Recruits',
            'in_progress',
            'A full-featured campus recruitment portal connecting employers with Rajagiri students. Features include job postings, eligibility filtering, application tracking, interview scheduling, and placement statistics.',
            8 * self::BUDGET_ONGOING,
            'institution',
            'Rajagiri College of Social Sciences - Placement Cell',
            $coordinatorId
        );
        $pfId = $createFinance($pId, 8 * self::BUDGET_ONGOING);
        $facultyId = $fid('Sabeen Govind');
        if ($facultyId) $assignFaculty($pId, $facultyId);
        $assignStudent($pId, $sid('Jiyo P V'),        'project_lead');
        $assignStudent($pId, $sid('Akshay Shibu'),     'developer');
        $assignStudent($pId, $sid('Viswas B Kurian'),  'developer');
        $assignStudent($pId, $sid('Dion Siji'),        'developer');
        $assignStudent($pId, $sid('Hafiz Muhammad'),   'developer');
        $assignStudent($pId, $sid('Anwin Jojo'),       'designer');
        $assignStudent($pId, $sid('Joseph Paul'),      'developer');
        $assignStudent($pId, $sid('Abhinav B Prasad'), 'tester');
        $m1 = $createModule($pId, 'Employer & Job Management Portal', 35.00, 'in_progress', $coordinatorId);
        $m2 = $createModule($pId, 'Student Application & Eligibility', 35.00, 'in_progress', $coordinatorId);
        $m3 = $createModule($pId, 'Interview Scheduling & Analytics', 30.00, 'not_started', $coordinatorId);
        $t1 = $createTask($m1, 'Employer registration & job posting module', $sid('Jiyo P V'),     'in_progress', $coordinatorId, $facultyId);
        $t2 = $createTask($m1, 'Job eligibility criteria configuration',     $sid('Akshay Shibu'), 'todo',        $coordinatorId);
        $t3 = $createTask($m2, 'Student application & status tracking',      $sid('Dion Siji'),    'in_progress', $coordinatorId, $facultyId);
        $t4 = $createTask($m3, 'Interview slot scheduler & calendar sync',   $sid('Joseph Paul'),  'todo',        $coordinatorId);
        $ps1 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Jiyo P V'))->value('id');
        $ps2 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Dion Siji'))->value('id');
        if ($facultyId) {
            if ($ps1 && $t1) $addWorkLog($ps1, $t1, 24.00, 'Built employer onboarding flow with document verification',   $facultyId);
            if ($ps2 && $t3) $addWorkLog($ps2, $t3, 20.00, 'Developed student application dashboard with status badges', $facultyId);
        }

        // ─────────────────────────────────────────────────────────────────
        // 11. RAISE
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'RAISE',
            'closed',
            'RAISE – an AI-powered student assessment and intelligent evaluation platform that automates grading, provides personalized feedback, and generates learning insights for faculty.',
            2 * self::BUDGET_COMPLETED,
            'institution',
            'Rajagiri College of Social Sciences',
            $coordinatorId
        );
        $pfId = $createFinance($pId, 2 * self::BUDGET_COMPLETED);
        $assignStudent($pId, $sid('Jubin Joy'),   'project_lead');
        $assignStudent($pId, $sid('Shyam James'), 'developer');
        $m1 = $createModule($pId, 'AI Assessment Engine',     50.00, 'completed', $coordinatorId);
        $m2 = $createModule($pId, 'Faculty Dashboard & Reports', 50.00, 'completed', $coordinatorId);
        $t1 = $createTask($m1, 'NLP-based answer evaluation module',      $sid('Jubin Joy'),   'completed', $coordinatorId, $coordinatorId);
        $t2 = $createTask($m1, 'Auto-grading pipeline & score calculator', $sid('Shyam James'), 'completed', $coordinatorId, $coordinatorId);
        $t3 = $createTask($m2, 'Faculty assessment report dashboard',      $sid('Jubin Joy'),   'completed', $coordinatorId, $coordinatorId);
        $ps1 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Jubin Joy'))->value('id');
        $ps2 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Shyam James'))->value('id');
        if ($ps1 && $t1) $addWorkLog($ps1, $t1, 25.00, 'Developed NLP evaluation pipeline using spaCy and BERT scoring', $coordinatorId);
        if ($ps2 && $t2) $addWorkLog($ps2, $t2, 20.00, 'Built automated scoring logic with weighted rubrics',             $coordinatorId);
        $createSimpleInvoice($pfId, $nextInv(), 2 * self::BUDGET_COMPLETED * 0.9, true);
        DB::table('project_closures')->insert([
            'project_id'   => $pId,
            'closed_by'    => $coordinatorId,
            'closure_date' => Carbon::now()->subMonths(2)->toDateTimeString(),
            'final_status' => 'completed',
            'remarks'      => 'RAISE platform deployed and handed over to academic department.',
        ]);

        // ─────────────────────────────────────────────────────────────────
        // 12. Fr. Sajumd Portfolio
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'Fr. Sajumd Portfolio',
            'closed',
            'Personal portfolio website for Fr. Sajumd, showcasing academic achievements, publications, research, and institutional contributions.',
            1 * self::BUDGET_COMPLETED,
            'institution',
            'Internal Client',
            $coordinatorId
        );
        $pfId = $createFinance($pId, 1 * self::BUDGET_COMPLETED);
        $assignStudent($pId, $sid('Sharvin Vincent'), 'project_lead');
        $m1 = $createModule($pId, 'Portfolio Design & Development', 100.00, 'completed', $coordinatorId);
        $t1 = $createTask($m1, 'Design and develop portfolio website', $sid('Sharvin Vincent'), 'completed', $coordinatorId, $coordinatorId);
        $t2 = $createTask($m1, 'Deploy on hosting with SSL',           $sid('Sharvin Vincent'), 'completed', $coordinatorId, $coordinatorId);
        $ps1 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Sharvin Vincent'))->value('id');
        if ($ps1) {
            if ($t1) $addWorkLog($ps1, $t1, 20.00, 'Designed and built the portfolio from Figma mockup to production', $coordinatorId);
            if ($t2) $addWorkLog($ps1, $t2, 5.00,  'Deployed site with Nginx, SSL certificate, and DNS config',       $coordinatorId);
        }
        $createSimpleInvoice($pfId, $nextInv(), self::BUDGET_COMPLETED * 0.9, true);
        DB::table('project_closures')->insert([
            'project_id'   => $pId,
            'closed_by'    => $coordinatorId,
            'closure_date' => Carbon::now()->subMonths(1)->toDateTimeString(),
            'final_status' => 'completed',
            'remarks'      => 'Portfolio website delivered and deployed successfully.',
        ]);

        // ─────────────────────────────────────────────────────────────────
        // 13. RLabZ ERP
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'RLabZ ERP',
            'in_progress',
            'ERP project management portal that monitors the complete project lifecycle under RLabZ. Features include project tracking, student & faculty management, finance module, task management, certificate generation, and GitHub integration.',
            7 * self::BUDGET_ONGOING,
            'institution',
            'RLabZ - Rajagiri College of Social Sciences',
            $coordinatorId
        );
        $pfId = $createFinance($pId, 7 * self::BUDGET_ONGOING);
        $facultyId = $fid('Ananthakrishnan K V');
        if ($facultyId) $assignFaculty($pId, $facultyId);
        $ps_anaswara = $assignStudent($pId, $sid('Anaswara Prasobh'),  'project_lead');
        $ps_rosha    = $assignStudent($pId, $sid('Rosha Thankachan'),   'developer');
        $ps_sandra   = $assignStudent($pId, $sid('Sandra B'),           'developer');
        $ps_lena     = $assignStudent($pId, $sid('Lena Mathew'),        'developer');
        $ps_farsan   = $assignStudent($pId, $sid('Farsan Suneer'),      'developer');
        $ps_albert   = $assignStudent($pId, $sid('Albert C S'),         'developer');
        $ps_ann      = $assignStudent($pId, $sid('Ann Jo Mathew'),      'designer');
        $m1 = $createModule($pId, 'Project & Task Management',         25.00, 'completed',   $coordinatorId);
        $m2 = $createModule($pId, 'Student & Faculty Portal',          20.00, 'in_progress', $coordinatorId);
        $m3 = $createModule($pId, 'Finance Module',                    20.00, 'in_progress', $coordinatorId);
        $m4 = $createModule($pId, 'Certificate Generation',            15.00, 'completed',   $coordinatorId);
        $m5 = $createModule($pId, 'GitHub Integration & Audit Logs',   10.00, 'in_progress', $coordinatorId);
        $m6 = $createModule($pId, 'Reports & Notifications',           10.00, 'not_started', $coordinatorId);
        $t1 = $createTask($m1, 'Project CRUD with lifecycle management',   $sid('Anaswara Prasobh'), 'completed',   $coordinatorId, $facultyId);
        $t2 = $createTask($m1, 'Task assignment & status tracking',       $sid('Rosha Thankachan'),  'completed',   $coordinatorId, $facultyId);
        $t3 = $createTask($m2, 'Student dashboard & work log submission',  $sid('Sandra B'),          'in_progress', $coordinatorId, $facultyId);
        $t4 = $createTask($m2, 'Faculty portal with mentoring tools',      $sid('Lena Mathew'),       'in_progress', $coordinatorId);
        $t5 = $createTask($m3, 'Invoice & payment management',             $sid('Farsan Suneer'),     'in_progress', $coordinatorId);
        $t6 = $createTask($m3, 'Finance dashboard with analytics',         $sid('Albert C S'),        'in_progress', $coordinatorId);
        $t7 = $createTask($m4, 'Certificate generation & PDF download',    $sid('Ann Jo Mathew'),     'completed',   $coordinatorId, $facultyId);
        $t8 = $createTask($m5, 'GitHub webhook integration & commit log',  $sid('Albert C S'),        'in_progress', $coordinatorId);
        if ($facultyId) {
            if ($ps_anaswara && $t1) $addWorkLog($ps_anaswara, $t1, 30.00, 'Implemented full project lifecycle management with status transitions',   $facultyId);
            if ($ps_rosha    && $t2) $addWorkLog($ps_rosha,    $t2, 25.00, 'Built task management module with assignment and review workflow',         $facultyId);
            if ($ps_sandra   && $t3) $addWorkLog($ps_sandra,   $t3, 20.00, 'Developed student dashboard with daily work log submission form',          $facultyId);
            if ($ps_farsan   && $t5) $addWorkLog($ps_farsan,   $t5, 22.00, 'Built invoice management with GST calculation and PDF export',             $facultyId);
            if ($ps_ann      && $t7) $addWorkLog($ps_ann,      $t7, 18.00, 'Designed and implemented certificate generation with canvas-based preview', $facultyId);
        }
        // Invoice for ongoing ERP project
        $inv = DB::table('invoices')->insertGetId([
            'project_finance_id' => $pfId,
            'invoice_number'     => $nextInv(),
            'invoice_date'       => Carbon::now()->subMonths(1)->toDateString(),
            'due_date'           => Carbon::now()->addDays(15)->toDateString(),
            'amount_before_gst'  => 70000.00,
            'gst_percentage'     => 18.00,
            'description'        => 'Milestone 1: Project, Task & Certificate Modules',
            'created_by'         => $financeId,
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);
        DB::table('client_payments')->insert([
            'invoice_id'        => $inv,
            'amount'            => 60000.00,
            'payment_date'      => Carbon::now()->subWeeks(2)->toDateString(),
            'payment_method'    => 'bank_transfer',
            'payment_reference' => 'TXN-ERP-M1-001',
            'remarks'           => 'Partial payment – Milestone 1',
            'recorded_by'       => $financeId,
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);

        // ─────────────────────────────────────────────────────────────────
        // 14. RLabZ Website
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'RLabZ Website',
            'closed',
            'RLabZ website with dynamic project management, an admin dashboard, and SSL certificate expiry monitoring. Showcases RLabZ projects, team, and achievements publicly.',
            4 * self::BUDGET_COMPLETED,
            'institution',
            'RLabZ - Rajagiri College of Social Sciences',
            $coordinatorId
        );
        $pfId = $createFinance($pId, 4 * self::BUDGET_COMPLETED);
        $facultyId = $fid('Ajay Antony Joseph');
        if ($facultyId) $assignFaculty($pId, $facultyId);
        $assignStudent($pId, $sid('Albert C S'),    'project_lead');
        $assignStudent($pId, $sid('Ann Jo Mathew'), 'designer');
        $assignStudent($pId, $sid('Farsan Suneer'), 'developer');
        $assignStudent($pId, $sid('Jubin Joy'),     'developer');
        $m1 = $createModule($pId, 'Public Website & CMS',           50.00, 'completed', $coordinatorId);
        $m2 = $createModule($pId, 'Admin Dashboard & SSL Monitor',   50.00, 'completed', $coordinatorId);
        $t1 = $createTask($m1, 'Public-facing website design & development', $sid('Albert C S'),    'completed', $coordinatorId, $facultyId);
        $t2 = $createTask($m1, 'Dynamic project showcase with CMS',          $sid('Ann Jo Mathew'), 'completed', $coordinatorId, $facultyId);
        $t3 = $createTask($m2, 'Admin dashboard with project management',     $sid('Farsan Suneer'), 'completed', $coordinatorId, $facultyId);
        $t4 = $createTask($m2, 'SSL certificate expiry monitor & alerts',     $sid('Jubin Joy'),     'completed', $coordinatorId, $facultyId);
        $ps1 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Albert C S'))->value('id');
        $ps2 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Farsan Suneer'))->value('id');
        $ps3 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Jubin Joy'))->value('id');
        if ($facultyId) {
            if ($ps1 && $t1) $addWorkLog($ps1, $t1, 25.00, 'Built entire website frontend with animations and responsive layouts', $facultyId);
            if ($ps2 && $t3) $addWorkLog($ps2, $t3, 20.00, 'Developed admin dashboard with project CRUD and user management',     $facultyId);
            if ($ps3 && $t4) $addWorkLog($ps3, $t4, 15.00, 'Implemented SSL expiry cron checker with Telegram/email alerts',      $facultyId);
        }
        $createSimpleInvoice($pfId, $nextInv(), 4 * self::BUDGET_COMPLETED * 0.9, true);
        DB::table('project_closures')->insert([
            'project_id'   => $pId,
            'closed_by'    => $coordinatorId,
            'closure_date' => Carbon::now()->subMonths(2)->toDateTimeString(),
            'final_status' => 'completed',
            'remarks'      => 'RLabZ website deployed with SSL monitoring. Live at rlabz.in.',
        ]);

        // ─────────────────────────────────────────────────────────────────
        // 15. Data Analytics Research Project
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'Data Analytics Research Project',
            'in_progress',
            'Analysis of Two-Wheeler and Four-Wheeler Accident Distribution and Rider Demographics in Ernakulam District. A research project applying data analytics and visualization to road accident data to identify patterns, hotspots, and demographic correlations.',
            5 * self::BUDGET_RESEARCH,
            'faculty',
            'Academic Research - Rajagiri College',
            $coordinatorId
        );
        $pfId = $createFinance($pId, 5 * self::BUDGET_RESEARCH);
        $facultyId = $fid('Diljith K Benny');
        if ($facultyId) $assignFaculty($pId, $facultyId);
        $assignStudent($pId, $sid('Devna J'),       'project_lead');
        $assignStudent($pId, $sid('Daya Mathew'),   'developer');
        $assignStudent($pId, $sid('Mahadevan Nair'), 'developer');
        $assignStudent($pId, $sid('Pooja Nair'),    'developer');
        $assignStudent($pId, $sid('Nandhana C S'),  'developer');
        $m1 = $createModule($pId, 'Data Collection & Preprocessing', 30.00, 'completed',   $coordinatorId);
        $m2 = $createModule($pId, 'Statistical Analysis & Modeling',  40.00, 'in_progress', $coordinatorId);
        $m3 = $createModule($pId, 'Visualization & Report',           30.00, 'not_started', $coordinatorId);
        $t1 = $createTask($m1, 'Collect accident datasets from Kerala Police & transport dept', $sid('Devna J'),        'completed',   $coordinatorId, $facultyId);
        $t2 = $createTask($m1, 'Data cleaning, deduplication and normalization pipeline',       $sid('Daya Mathew'),    'completed',   $coordinatorId, $facultyId);
        $t3 = $createTask($m2, 'Accident hotspot geospatial mapping (folium/leaflet)',          $sid('Mahadevan Nair'), 'in_progress', $coordinatorId, $facultyId);
        $t4 = $createTask($m2, 'Demographic analysis: age, gender, vehicle type regression',   $sid('Pooja Nair'),     'in_progress', $coordinatorId);
        $t5 = $createTask($m3, 'Interactive dashboard & research paper draft',                 $sid('Nandhana C S'),   'todo',        $coordinatorId);
        $ps1 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Devna J'))->value('id');
        $ps2 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Daya Mathew'))->value('id');
        $ps3 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Mahadevan Nair'))->value('id');
        if ($facultyId) {
            if ($ps1 && $t1) $addWorkLog($ps1, $t1, 20.00, 'Collected and merged 3-year accident datasets from multiple government sources', $facultyId);
            if ($ps2 && $t2) $addWorkLog($ps2, $t2, 18.00, 'Cleaned and normalized 50,000+ accident records using pandas pipeline',         $facultyId);
            if ($ps3 && $t3) $addWorkLog($ps3, $t3, 15.00, 'Built accident hotspot map with heatmap overlay using folium',                  $facultyId);
        }

        // ─────────────────────────────────────────────────────────────────
        // 16. Labora
        // ─────────────────────────────────────────────────────────────────
        $pId = $createProject(
            'Labora',
            'in_progress',
            'Labora is a smart laboratory management system enabling efficient scheduling of lab sessions, equipment reservation, experiment tracking, and maintenance logging for science and computer labs at Rajagiri.',
            4 * self::BUDGET_ONGOING,
            'institution',
            'Rajagiri College of Social Sciences',
            $coordinatorId
        );
        $pfId = $createFinance($pId, 4 * self::BUDGET_ONGOING);
        $facultyId = $fid('Ananthakrishnan K V');
        if ($facultyId) $assignFaculty($pId, $facultyId);
        $assignStudent($pId, $sid('Amina Muhammed'),  'project_lead');
        $assignStudent($pId, $sid('M S Vismaya'),     'developer');
        $assignStudent($pId, $sid('Novelia Joseph'),  'developer');
        $assignStudent($pId, $sid('Devika B Menon'),  'designer');
        $m1 = $createModule($pId, 'Lab Scheduling & Reservation',      40.00, 'in_progress', $coordinatorId);
        $m2 = $createModule($pId, 'Equipment & Maintenance Tracking',  35.00, 'not_started', $coordinatorId);
        $m3 = $createModule($pId, 'Reports & Analytics',               25.00, 'not_started', $coordinatorId);
        $t1 = $createTask($m1, 'Lab session booking with conflict detection',  $sid('Amina Muhammed'), 'in_progress', $coordinatorId, $facultyId);
        $t2 = $createTask($m1, 'Faculty & student timetable integration',      $sid('M S Vismaya'),    'in_progress', $coordinatorId);
        $t3 = $createTask($m2, 'Equipment reservation & availability tracker', $sid('Novelia Joseph'),  'todo',        $coordinatorId);
        $t4 = $createTask($m2, 'Maintenance log and technician assignment',    $sid('Devika B Menon'),  'todo',        $coordinatorId);
        $t5 = $createTask($m3, 'Lab utilization analytics & usage reports',   $sid('Amina Muhammed'), 'todo',        $coordinatorId);
        $ps1 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('Amina Muhammed'))->value('id');
        $ps2 = DB::table('project_student')->where('project_id', $pId)->where('student_id', $sid('M S Vismaya'))->value('id');
        if ($facultyId) {
            if ($ps1 && $t1) $addWorkLog($ps1, $t1, 20.00, 'Implemented lab booking flow with admin approval and conflict alerts', $facultyId);
            if ($ps2 && $t2) $addWorkLog($ps2, $t2, 16.00, 'Integrated timetable API for auto-block of class hours in booking UI', $facultyId);
        }

        $this->command->info('✅ RLabZ Projects seeder completed — 16 projects seeded with students, faculty, finance, modules & tasks.');
    }
}
