<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Adds 'other' to projects.source_type, following the same raw ALTER TABLE approach as
 * the prior 2026_08_30_000000_alter_projects_source_type_enum migration (which added
 * 'student'). brought_by (existing nullable column) is reused to store the free-text
 * "please specify" description when source_type = 'other' — no new column needed.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE projects MODIFY COLUMN source_type ENUM('faculty', 'student', 'alumni', 'institution', 'external', 'other') NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE projects MODIFY COLUMN source_type ENUM('faculty', 'student', 'alumni', 'institution', 'external') NULL");
    }
};
