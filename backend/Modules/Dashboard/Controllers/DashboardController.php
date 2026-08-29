<?php

namespace Modules\Dashboard\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class DashboardController extends Controller
{
    /**
     * Get Director Dashboard KPI Overview Metrics
     */
    public function getOverview()
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'total_projects' => 3,
                'active_projects' => 2,
                'pending_proposals' => 2,
                'student_counts' => [
                    'nova' => 3,
                    'orbit' => 3,
                    'spark' => 3,
                    'total' => 9
                ],
                'faculty_count' => 4,
                'finance_summary' => [
                    'total_budget' => 265000,
                    'total_spent' => 90000,
                    'stipends_disbursed' => 45000
                ]
            ]
        ]);
    }

    /**
     * Accept or Reject a Project Proposal
     */
    public function updateProposalStatus(Request $request, $proposalId)
    {
        $request->validate([
            'status' => 'required|in:accepted,rejected',
            'faculty_id' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Proposal {$proposalId} status updated to {$request->status}.",
            'data' => [
                'proposal_id' => $proposalId,
                'status' => $request->status,
                'assigned_faculty' => $request->faculty_id,
                'notes' => $request->notes
            ]
        ]);
    }
}
