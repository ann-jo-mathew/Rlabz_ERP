<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$tables = DB::select('SHOW TABLES');
$schema = "# Database Schema\n\n";

foreach ($tables as $t) {
    $tableName = array_values((array)$t)[0];
    
    // Skip Laravel internal tables
    if (in_array($tableName, ['migrations', 'personal_access_tokens', 'failed_jobs', 'password_reset_tokens', 'cache', 'cache_locks', 'jobs', 'job_batches'])) continue;

    $columns = DB::select('DESCRIBE ' . $tableName);
    $schema .= "## Table: `$tableName`\n";
    $schema .= "| Field | Type | Null | Key | Default | Extra |\n";
    $schema .= "|---|---|---|---|---|---|\n";
    foreach ($columns as $c) {
        $default = $c->Default === null ? 'NULL' : $c->Default;
        $schema .= "| `{$c->Field}` | {$c->Type} | {$c->Null} | {$c->Key} | $default | {$c->Extra} |\n";
    }
    
    // Get constraints
    $constraintsQuery = "
        SELECT COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
    ";
    $constraints = DB::select($constraintsQuery, [$tableName]);
    if (count($constraints) > 0) {
        $schema .= "\n**Foreign Keys:**\n";
        foreach ($constraints as $fk) {
            $schema .= "- `{$fk->COLUMN_NAME}` references `{$fk->REFERENCED_TABLE_NAME}`.`{$fk->REFERENCED_COLUMN_NAME}` (Constraint: `{$fk->CONSTRAINT_NAME}`)\n";
        }
    }
    
    $schema .= "\n---\n\n";
}

file_put_contents(__DIR__ . '/db_schema.md', $schema);
echo "Schema exported to db_schema.md";
