<?php

namespace App\Http\Traits;

trait ApiResponse
{
    protected function success($data = null, int $code = 200)
    {
        return response()->json($data !== null ? $data : ['ok' => true], $code);
    }

    protected function error(string $message, int $code = 400, array $errors = [])
    {
        $body = ['error' => $message];
        if ($errors) {
            $body['errors'] = $errors;
        }
        return response()->json($body, $code);
    }
}
