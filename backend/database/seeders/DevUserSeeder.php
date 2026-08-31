<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Modules\Auth\Models\User;

class DevUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
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
                'password' => Hash::make('coord123'),
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
            [
                'name' => 'Student Alpha',
                'email' => 'alpha@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => ['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read', 'project.view_assigned', 'project.task.update'],
            ],
            [
                'name' => 'Student Beta',
                'email' => 'beta@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => ['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read', 'project.view_assigned', 'project.task.update'],
            ]
        ];

        foreach ($users as $userData) {
            $permissions = json_encode($userData['permissions']);
            $userData['permissions'] = $permissions;
            
            \Illuminate\Support\Facades\DB::table('users')->updateOrInsert(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}
