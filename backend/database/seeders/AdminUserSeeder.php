<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminPermissions = [
            'system.admin',
            'admin.manage_users',
            'admin.manage_permissions',
            'admin.reset_passwords',
            'admin.audit_logs',
            'view-dashboard',
            'view-coordinator',
            'view-faculty',
            'view-finance',
            'view-finance-readonly',
            'view-student',
            'view-student-designations',
            'view-projects',
            'project.view_global',
            'project.view_assigned',
            'project.create',
            'project.close',
            'project.assign_faculty',
            'project.assign_students',
            'project.task.update',
            'project.submission.review',
            'project.client_requirements.view',
            'project.client_requirements.create',
            'project.client_requirements.update',
            'view-design',
            'design.create',
            'design.review',
            'design.approve',
            'view-github',
            'view-communication',
            'view-certificates',
            'view-certificates-read',
            'view-audit-notifications',
        ];

        DB::table('users')->updateOrInsert(
            ['email' => 'admin@rajagiri.edu'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('admin123'),
                'phone' => '+91 98470 00000',
                'role' => 'admin',
                'status' => 'active',
                'department' => 'Administration',
                'location' => 'Kochi, India',
                'permissions' => json_encode($adminPermissions),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );
    }
}
