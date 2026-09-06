<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE projects MODIFY COLUMN source_type ENUM('faculty', 'student', 'alumni', 'institution', 'external') NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE projects MODIFY COLUMN source_type ENUM('faculty', 'alumni', 'institution', 'external') NULL");
    }
};
