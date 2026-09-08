<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo Illuminate\Support\Facades\Schema::hasColumn('client_requirements', 'project_id') ? "YES\n" : "NO\n";
