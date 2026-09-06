<?php

namespace Modules\Finance\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use Modules\Project\Models\Project;
use Illuminate\Support\Facades\DB;
use Modules\Finance\Models\ProjectFinance;
use Modules\Finance\Models\DevelopmentAllocation;
use Modules\Finance\Models\HostingCharge;
use Modules\Finance\Models\Invoice;
use Modules\Finance\Models\ClientPayment;
use Modules\Finance\Models\StudentPayment;
use Illuminate\Support\Facades\Hash;

class FinanceDatabaseSeeder extends Seeder
{
    public function run()
    {
        Model::unguard();

        // Ensure user exists
        $user = User::firstOrCreate(
            ['email' => 'nova@rajagiri.edu'],
            ['name' => 'Nova User', 'password' => Hash::make('password')]
        );

        $projects = Project::all();
        
        // If no projects exist, create dummy ones
        if ($projects->isEmpty()) {
            Project::create([
                'title' => 'RLabZ ERP Website',
                'status' => 'in_progress',
                'budget' => 150000,
                'created_by' => $user->id,
                'client_name' => 'Internal RLabZ'
            ]);
            Project::create([
                'title' => 'College Management System',
                'status' => 'closed',
                'budget' => 450000,
                'created_by' => $user->id,
                'client_name' => 'Rajagiri College'
            ]);
            Project::create([
                'title' => 'Student Portal App',
                'status' => 'proposed',
                'budget' => 200000,
                'created_by' => $user->id,
                'client_name' => 'Rajagiri College'
            ]);
            $projects = Project::all();
        }

        foreach ($projects as $project) {
            $budget = $project->budget ?: 100000;
            $devAmount = $budget * 0.8; // 80% to development

            $finance = ProjectFinance::updateOrCreate(
                ['project_id' => $project->id],
                [
                    'total_development_amount' => $devAmount,
                    'gst_percentage' => 18.00,
                    'created_by' => $user->id,
                    'status' => 'approved',
                    'approved_at' => now(),
                ]
            );

            // Development Allocations (Cost Distribution)
            DevelopmentAllocation::firstOrCreate([
                'project_finance_id' => $finance->id,
                'category' => 'student'
            ], ['amount' => $devAmount * 0.4]);
            
            DevelopmentAllocation::firstOrCreate([
                'project_finance_id' => $finance->id,
                'category' => 'faculty'
            ], ['amount' => $devAmount * 0.3]);
            
            DevelopmentAllocation::firstOrCreate([
                'project_finance_id' => $finance->id,
                'category' => 'rlabz'
            ], ['amount' => $devAmount * 0.3]);

            // Hosting Charge
            HostingCharge::firstOrCreate([
                'project_finance_id' => $finance->id,
                'charge_type' => 'ssl'
            ], [
                'amount' => 1500,
                'purchase_date' => now()->subMonths(11),
                'expiry_date' => now()->addDays(5),
                'reference_details' => 'AWS Certificate Manager',
            ]);

            // Invoice 1 (Partially Paid)
            $invoice1 = Invoice::firstOrCreate([
                'project_finance_id' => $finance->id,
                'description' => 'Milestone 1 Billing',
            ], [
                'invoice_number' => 'INV-' . date('Y') . '-' . rand(100, 999),
                'invoice_date' => now()->subDays(30),
                'due_date' => now()->addDays(15),
                'amount_before_gst' => $devAmount * 0.5,
                'gst_percentage' => 18.00,
                'created_by' => $user->id,
            ]);

            ClientPayment::firstOrCreate([
                'invoice_id' => $invoice1->id,
                'payment_method' => 'Bank Transfer',
            ], [
                'amount' => ($invoice1->amount_before_gst * 1.18) * 0.5,
                'payment_date' => now()->subDays(20),
                'recorded_by' => $user->id,
            ]);

            // Create a dummy project student if none exists
            $psId = DB::table('project_student')->where('project_id', $project->id)
                      ->where('student_id', $user->id)
                      ->value('id');
            
            if (!$psId) {
                $psId = DB::table('project_student')->insertGetId([
                    'project_id' => $project->id,
                    'student_id' => $user->id,
                    'role' => 'developer',
                    'assigned_date' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Student Payroll Test Cases
            StudentPayment::firstOrCreate([
                'project_student_id' => $psId,
                'designation' => 'nova',
            ], [
                'approved_hours' => 20,
                'hourly_rate' => 250,
                'amount' => 5000,
                'payment_date' => now()->subDays(10),
            ]);
        }
    }
}
