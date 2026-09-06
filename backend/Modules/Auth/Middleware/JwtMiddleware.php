<?php

namespace Modules\Auth\Middleware;
use Closure;
use Illuminate\Http\Request;

class JwtMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['status' => 'Authorization Token not found'], 401);
        }

        $parts = explode('.', $token);
        if (count($parts) === 3) {
            $signature = hash_hmac('sha256', $parts[0] . "." . $parts[1], config('app.key'), true);
            $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
            
            if (hash_equals($base64UrlSignature, $parts[2])) {
                $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
                
                if (isset($payload['exp']) && $payload['exp'] >= time()) {
                    $request->merge([
                        'auth_user' => $payload
                    ]);
                    return $next($request);
                }
                return response()->json(['status' => 'Token is Expired'], 401);
            }
        }

        return response()->json(['status' => 'Token is Invalid'], 401);
    }
}
