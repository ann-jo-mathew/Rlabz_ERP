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
                'permissions' => ['view-dashboard', 'view-finance-readonly', 'view-projects', 'view-github', 'view-audit-notifications'],
            ],
            [
                'name' => 'Coordinator',
                'email' => 'coordinator@rajagiri.edu',
                'password' => Hash::make('password123'),
                'role' => 'coordinator',
                'permissions' => ['view-coordinator', 'view-finance-readonly', 'view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates'],
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
                'permissions' => ['view-faculty', 'view-projects', 'view-communication', 'view-github'],
            ],
            [
                'name' => 'Student Nova',
                'email' => 'nova@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => ['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read'],
            ],
            [
                'name' => 'Student Orbit',
                'email' => 'orbit@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => ['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read'],
            ],
            [
                'name' => 'Student Spark',
                'email' => 'spark@rajagiri.edu',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'permissions' => ['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read'],
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
