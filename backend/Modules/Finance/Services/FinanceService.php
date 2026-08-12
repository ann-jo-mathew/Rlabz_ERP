<?php

namespace Modules\Finance\Services;

use Modules\Finance\Repositories\MockFinanceRepository;

class FinanceService
{
    protected $repository;

    public function __construct(MockFinanceRepository $repository)
    {
        // By injecting the repository here, we can easily swap it out for an Eloquent repository later.
        $this->repository = $repository;
    }

    public function getDashboardSummary()
    {
        return $this->repository->getDashboardSummary();
    }

    public function getAllProjects()
    {
        return $this->repository->getAllProjects();
    }

    public function getProjectFinanceDetails($id)
    {
        $project = $this->repository->getProjectById($id);
        
        if (!$project) {
            return null;
        }

        $payments = $this->repository->getPaymentsForProject($id);
        
        $totalReceived = 0;
        foreach ($payments as $payment) {
            if ($payment['status'] === 'Confirmed') {
                $totalReceived += $payment['amount'];
            }
        }

        $project['payments'] = $payments;
        $project['payments_received'] = $totalReceived;
        $project['amount_remaining'] = max(0, $project['total_amount'] - $totalReceived);

        return $project;
    }

    public function getAllStudentPayments()
    {
        return $this->repository->getAllStudentPayments();
    }
}
