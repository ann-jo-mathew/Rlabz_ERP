<?php

namespace Modules\Finance\Repositories;

class MockFinanceRepository
{
    private $projects = [];
    private $studentPayments = [];
    private $clientPayments = [];

    public function __construct()
    {
        $this->projects = [
            [
                'id' => 101,
                'name' => 'RLabZ ERP Website',
                'status' => 'In Progress',
                'estimated_cost' => 100000,
                'development_charges' => [
                    'student' => 30000,
                    'faculty' => 10000,
                    'rlabz' => 20000,
                    'total' => 60000
                ],
                'hosting_charges' => [
                    'ssl' => 1000,
                    'domain' => 1500,
                    'domain_name' => 'rlabz.com',
                    'api' => 2000,
                    'total' => 4500
                ],
                'maintenance_support' => [
                    'included' => true,
                    'amount' => 5000,
                    'status' => 'Active'
                ],
                'subtotal' => 69500,
                'gst_amount' => 12510,
                'total_amount' => 82010,
            ],
            [
                'id' => 102,
                'name' => 'College Management System',
                'status' => 'Completed',
                'estimated_cost' => 150000,
                'development_charges' => [
                    'student' => 50000,
                    'faculty' => 20000,
                    'rlabz' => 30000,
                    'total' => 100000
                ],
                'hosting_charges' => [
                    'ssl' => 1000,
                    'domain' => 1500,
                    'domain_name' => 'cms.edu',
                    'api' => null, // Optional API
                    'total' => 2500
                ],
                'maintenance_support' => [
                    'included' => false,
                    'amount' => 0,
                    'status' => 'Not Included'
                ],
                'subtotal' => 102500,
                'gst_amount' => 18450,
                'total_amount' => 120950,
            ]
        ];

        $this->clientPayments = [
            [
                'id' => 1,
                'project_id' => 101,
                'date' => '2025-10-15',
                'payment_type' => 'Advance',
                'amount' => 30000,
                'payment_method' => 'Bank Transfer',
                'reference' => 'TXN-001',
                'status' => 'Confirmed'
            ],
            [
                'id' => 2,
                'project_id' => 101,
                'date' => '2025-11-20',
                'payment_type' => 'Partial',
                'amount' => 20000,
                'payment_method' => 'UPI',
                'reference' => 'TXN-002',
                'status' => 'Confirmed'
            ],
            [
                'id' => 3,
                'project_id' => 102,
                'date' => '2025-08-10',
                'payment_type' => 'Full',
                'amount' => 120950,
                'payment_method' => 'Cheque',
                'reference' => 'CHQ-987',
                'status' => 'Confirmed'
            ]
        ];

        $this->studentPayments = [
            [
                'id' => 1,
                'student_id' => 1,
                'student_name' => 'Alice Johnson',
                'project_id' => 101,
                'project_name' => 'RLabZ ERP Website',
                'module' => 'Frontend',
                'designation' => 'Nova',
                'approved_hours' => 40,
                'hourly_rate' => 200,
                'amount' => 8000,
                'payment_period' => 'Oct 2025',
                'status' => 'Paid',
                'payment_date' => '2025-11-05',
                'payment_method' => 'Bank Transfer',
                'payment_reference' => 'STU-TXN-001'
            ],
            [
                'id' => 2,
                'student_id' => 2,
                'student_name' => 'Bob Smith',
                'project_id' => 101,
                'project_name' => 'RLabZ ERP Website',
                'module' => 'Backend',
                'designation' => 'Orbit',
                'approved_hours' => 30,
                'hourly_rate' => 300,
                'amount' => 9000,
                'payment_period' => 'Oct 2025',
                'status' => 'Processing',
                'payment_date' => null,
                'payment_method' => null,
                'payment_reference' => null
            ]
        ];
    }

    public function getAllProjects()
    {
        return $this->projects;
    }

    public function getProjectById($id)
    {
        foreach ($this->projects as $project) {
            if ($project['id'] == $id) {
                return $project;
            }
        }
        return null;
    }

    public function getPaymentsForProject($projectId)
    {
        $payments = [];
        foreach ($this->clientPayments as $payment) {
            if ($payment['project_id'] == $projectId) {
                $payments[] = $payment;
            }
        }
        return $payments;
    }

    public function getAllStudentPayments()
    {
        return $this->studentPayments;
    }

    public function getDashboardSummary()
    {
        $totalProjectValue = array_sum(array_column($this->projects, 'total_amount'));
        
        $totalAmountReceived = 0;
        foreach ($this->clientPayments as $payment) {
            if ($payment['status'] === 'Confirmed') {
                $totalAmountReceived += $payment['amount'];
            }
        }

        $totalStudentPayments = 0;
        foreach ($this->studentPayments as $payment) {
            if ($payment['status'] === 'Paid') {
                $totalStudentPayments += $payment['amount'];
            }
        }

        $totalDevelopmentCharges = 0;
        $totalHostingCharges = 0;
        foreach ($this->projects as $project) {
            $totalDevelopmentCharges += $project['development_charges']['total'];
            $totalHostingCharges += $project['hosting_charges']['total'];
        }

        return [
            'total_project_value' => $totalProjectValue,
            'total_amount_received' => $totalAmountReceived,
            'amount_pending' => max(0, $totalProjectValue - $totalAmountReceived),
            'total_student_payments' => $totalStudentPayments,
            'total_development_charges' => $totalDevelopmentCharges,
            'total_hosting_charges' => $totalHostingCharges
        ];
    }
}
