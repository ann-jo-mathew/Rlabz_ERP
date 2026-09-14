<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // 1. Expand enum on tasks.status to include 'rework'
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('todo', 'in_progress', 'completed', 'blocked', 'rework') NOT NULL DEFAULT 'todo'");

        // 2. Drop review_status column from tasks table if it exists
        if (Schema::hasColumn('tasks', 'review_status')) {
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE tasks DROP COLUMN review_status");
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // 1. Re-add review_status column
        if (!Schema::hasColumn('tasks', 'review_status')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->enum('review_status', ['pending', 'approved', 'rejected'])->nullable()->after('reviewed_by');
            });
        }

        // 2. Revert enum on tasks.status
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('todo', 'in_progress', 'completed', 'blocked') NOT NULL DEFAULT 'todo'");
    }
};
