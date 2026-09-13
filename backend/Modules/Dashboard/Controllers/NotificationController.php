<?php

namespace Modules\Dashboard\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Dashboard\Models\Notification;

/**
 * Generic, role-agnostic notification feed. Any feature can create a row here
 * (Notification::create(['user_id' => ..., 'type' => 'ssl_expiry', ...])) and it
 * will show up in every role's bell icon with no further frontend work.
 */
class NotificationController extends Controller
{
    protected function currentUserId(Request $request): ?int
    {
        return $request->auth_user['sub'] ?? null;
    }

    public function index(Request $request)
    {
        $userId = $this->currentUserId($request);
        if (!$userId) {
            return response()->json(['error' => 'Unable to identify current user'], 400);
        }

        $notifications = Notification::where('user_id', $userId)
            ->with('project:id,title')
            ->latest()
            ->get();

        return response()->json(['data' => $notifications]);
    }

    public function markRead(Request $request, Notification $notification)
    {
        $userId = $this->currentUserId($request);
        if (!$userId) {
            return response()->json(['error' => 'Unable to identify current user'], 400);
        }

        if ((int) $notification->user_id !== (int) $userId) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $notification->update(['is_read' => true]);

        return response()->json(['message' => 'Notification marked as read', 'data' => $notification]);
    }
}
