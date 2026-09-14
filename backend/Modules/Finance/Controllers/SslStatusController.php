<?php

namespace Modules\Finance\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Finance\Models\HostingCharge;
use Carbon\Carbon;
use DB;

class SslStatusController extends Controller
{
    public function getSslStatus()
    {
        // Get all SSL hosting charges that have a domain name configured
        $sslCharges = HostingCharge::with('projectFinance.project')
            ->where('charge_type', 'ssl')
            ->whereNotNull('domain_name')
            ->get();

        $results = [];

        foreach ($sslCharges as $charge) {
            $rawDomain = $charge->domain_name;
            // Normalize domain: remove http://, https://, and trailing slashes
            $domain = preg_replace('#^https?://#', '', $rawDomain);
            $domain = rtrim($domain, '/');

            $project = $charge->projectFinance->project ?? null;

            // Fetch live certificate
            $certExpiry = $this->fetchSslExpiry($domain);
            $recordedExpiry = $charge->expiry_date ? Carbon::parse($charge->expiry_date)->startOfDay() : null;

            if ($certExpiry) {
                // We got the live certificate!
                $daysUntilExpiry = Carbon::now()->startOfDay()->diffInDays($certExpiry, false);
                $expired = $daysUntilExpiry < 0;

                // Check for unrecorded renewal
                // If the live cert expiry is > 10 days after the recorded expiry, it likely means a renewal occurred but wasn't logged.
                $unrecordedRenewal = false;
                if ($recordedExpiry && $certExpiry->gt($recordedExpiry->copy()->addDays(10))) {
                    $unrecordedRenewal = true;
                }

                if ($expired || $daysUntilExpiry <= 0) {
                    $status = 'Expired';
                } elseif ($daysUntilExpiry <= 7) {
                    $status = 'Critical';
                } elseif ($daysUntilExpiry <= 30) {
                    $status = 'Expiring Soon';
                } else {
                    $status = 'Active';
                }

                // Construct SSL URL securely
                $sslUrl = 'https://' . preg_replace('#^https?://#', '', $domain);
                
                // Get last renewal info
                $lastRenewal = DB::table('ssl_renewal_history')
                    ->where('hosting_charge_id', $charge->id)
                    ->orderBy('renewal_date', 'desc')
                    ->first();
                
                // Calculate Totals
                $initialSslAmount = (float) $charge->amount;
                $totalRenewalCost = (float) DB::table('ssl_renewal_history')
                    ->where('hosting_charge_id', $charge->id)
                    ->sum('renewal_amount');
                $totalSslSpent = $initialSslAmount + $totalRenewalCost;

                $results[] = [
                    'project_id' => $project->id ?? null,
                    'project_name' => $project->title ?? 'Unknown project',
                    'domain' => $domain,
                    'ssl_url' => $sslUrl,
                    'provider' => $charge->reference_details ?? 'Unknown',
                    'expiry_date' => $certExpiry->toDateString(),
                    'days_remaining' => $daysUntilExpiry,
                    'status' => $status,
                    'unrecorded_renewal' => $unrecordedRenewal,
                    'recorded_expiry_date' => $recordedExpiry ? $recordedExpiry->toDateString() : null,
                    'last_renewal_date' => $lastRenewal ? $lastRenewal->renewal_date : null,
                    'last_renewal_amount' => $lastRenewal ? $lastRenewal->renewal_amount : null,
                    'initial_ssl_amount' => $initialSslAmount,
                    'total_renewal_cost' => $totalRenewalCost,
                    'total_ssl_spent' => $totalSslSpent,
                    'error' => false
                ];

                // Sync notifications to the database for coordinators
                $this->syncNotification($project->id ?? null, $domain, $daysUntilExpiry, $expired, $unrecordedRenewal);
            } else {
                // Construct SSL URL securely
                $sslUrl = 'https://' . preg_replace('#^https?://#', '', $domain);
                
                // Get last renewal info
                $lastRenewal = DB::table('ssl_renewal_history')
                    ->where('hosting_charge_id', $charge->id)
                    ->orderBy('renewal_date', 'desc')
                    ->first();
                
                // Calculate Totals
                $initialSslAmount = (float) $charge->amount;
                $totalRenewalCost = (float) DB::table('ssl_renewal_history')
                    ->where('hosting_charge_id', $charge->id)
                    ->sum('renewal_amount');
                $totalSslSpent = $initialSslAmount + $totalRenewalCost;

                // Failed to fetch SSL
                $results[] = [
                    'project_id' => $project->id ?? null,
                    'project_name' => $project->title ?? 'Unknown project',
                    'domain' => $domain,
                    'ssl_url' => $sslUrl,
                    'provider' => $charge->reference_details ?? 'Unknown',
                    'expiry_date' => null,
                    'days_remaining' => null,
                    'status' => 'Unable to fetch SSL certificate',
                    'unrecorded_renewal' => false,
                    'recorded_expiry_date' => $recordedExpiry ? $recordedExpiry->toDateString() : null,
                    'last_renewal_date' => $lastRenewal ? $lastRenewal->renewal_date : null,
                    'last_renewal_amount' => $lastRenewal ? $lastRenewal->renewal_amount : null,
                    'initial_ssl_amount' => $initialSslAmount,
                    'total_renewal_cost' => $totalRenewalCost,
                    'total_ssl_spent' => $totalSslSpent,
                    'error' => true,
                    'message' => "Unable to fetch SSL certificate for {$domain}."
                ];
            }
        }

        return response()->json(['ssl_status' => $results]);
    }

    private function syncNotification($projectId, $domain, $daysUntilExpiry, $expired, $unrecordedRenewal)
    {
        $coordinatorIds = DB::table('users')->where('role', 'coordinator')->pluck('id');
        if ($coordinatorIds->isEmpty() || !$projectId) {
            return;
        }

        if ($unrecordedRenewal) {
            $message = "SSL certificate for {$domain} appears to have been renewed. Please record the renewal expense if it has not already been recorded.";
            $urgency = 'info';
            $type = 'ssl_renewal_detected';
        } elseif ($expired || $daysUntilExpiry <= 0) {
            $message = "SSL certificate for {$domain} has expired.";
            $urgency = 'urgent';
            $type = 'ssl_expiry';
        } elseif ($daysUntilExpiry <= 7) {
            $message = "CRITICAL: SSL certificate for {$domain} expires in {$daysUntilExpiry} days.";
            $urgency = 'urgent';
            $type = 'ssl_expiry';
        } elseif ($daysUntilExpiry <= 15) {
            $message = "WARNING: SSL certificate for {$domain} expires in {$daysUntilExpiry} days.";
            $urgency = 'urgent';
            $type = 'ssl_expiry';
        } elseif ($daysUntilExpiry <= 30) {
            $message = "SSL certificate for {$domain} expires in {$daysUntilExpiry} days.";
            $urgency = 'normal';
            $type = 'ssl_expiry';
        } else {
            // > 30 days, no warning required. 
            // We could optionally clear existing notifications for this project if we wanted.
            return;
        }

        foreach ($coordinatorIds as $userId) {
            \Modules\Dashboard\Models\Notification::updateOrCreate(
                [
                    'user_id' => $userId,
                    'type' => $type,
                    'project_id' => $projectId,
                ],
                [
                    'message' => $message,
                    'urgency' => $urgency,
                ]
            );
        }
    }

    /**
     * Connects to the given domain and reads the SSL certificate validTo date.
     * Returns a Carbon instance of the expiry date, or null if it fails.
     */
    private function fetchSslExpiry($domain)
    {
        try {
            $context = stream_context_create([
                'ssl' => [
                    'capture_peer_cert' => true,
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                    'peer_name' => $domain,
                ],
            ]);

            // Add timeout so it doesn't block forever if a domain is down
            $client = @stream_socket_client(
                "ssl://{$domain}:443",
                $errorNumber,
                $errorString,
                5, // 5 seconds timeout
                STREAM_CLIENT_CONNECT,
                $context
            );

            if ($client) {
                $params = stream_context_get_params($client);
                $cert = openssl_x509_parse($params['options']['ssl']['peer_certificate']);
                
                if (isset($cert['validTo_time_t'])) {
                    return Carbon::createFromTimestamp($cert['validTo_time_t'])->startOfDay();
                }
            }
        } catch (\Exception $e) {
            // Silently fail and return null
        }

        return null;
    }
}
