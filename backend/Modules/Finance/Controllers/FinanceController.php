<?php

namespace Modules\Finance\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Finance\Services\FinanceService;

class FinanceController extends Controller
{
    protected $financeService;

    public function __construct(FinanceService $financeService)
    {
        $this->financeService = $financeService;
    }

    public function getDashboard()
    {
        $summary = $this->financeService->getDashboardSummary();
        return response()->json($summary);
    }

    public function getProjects()
    {
        $projects = $this->financeService->getAllProjects();
        return response()->json($projects);
    }

    public function getProjectDetails($id)
    {
        $project = $this->financeService->getProjectFinanceDetails($id);

        if (!$project) {
            return response()->json(['error' => 'Project not found'], 404);
        }

        return response()->json($project);
    }

    public function getStudentPayments()
    {
        $payments = $this->financeService->getAllStudentPayments();
        return response()->json($payments);
    }

    // Mock endpoints for recording payments (Frontend validation/testing only)
    public function recordClientPayment(Request $request)
    {
        // For now, this is a mock endpoint that just returns success
        return response()->json([
            'message' => 'Payment recorded successfully (Mock)',
            'data' => $request->all()
        ]);
    }

    public function recordStudentPayment(Request $request)
    {
        // For now, this is a mock endpoint that just returns success
        return response()->json([
            'message' => 'Student payment processed successfully (Mock)',
            'data' => $request->all()
        ]);
    }
}
