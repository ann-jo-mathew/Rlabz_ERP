
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
        // REAL IMPLEMENTATION (Commented out):
        // try {
        //     $user = JWTAuth::parseToken()->authenticate();
        // } catch (Exception $e) {
        //     if ($e instanceof \Tymon\JWTAuth\Exceptions\TokenInvalidException){
        //         return response()->json(['status' => 'Token is Invalid'], 401);
        //     } else if ($e instanceof \Tymon\JWTAuth\Exceptions\TokenExpiredException){
        //         return response()->json(['status' => 'Token is Expired'], 401);
        //     } else{
        //         return response()->json(['status' => 'Authorization Token not found'], 401);
        //     }
        // }
        // // Attach user, permissions, and roles to the request object for easy access
        // $request->merge(['auth_user' => $user]);

        // MOCK IMPLEMENTATION:
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['status' => 'Authorization Token not found (MOCK)'], 401);
        }

        // Mock decoding token
        if (str_contains($token, 'mocksignature')) {
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                $payload = json_decode(base64_decode($parts[1]), true);
                
                // Attach mock user to request so next middleware can read it
                $request->merge([
                    'auth_user' => $payload
                ]);
                return $next($request);
            }
        }

        return response()->json(['status' => 'Token is Invalid (MOCK)'], 401);
    }
}
