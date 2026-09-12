<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('student_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('student_reports', 'task_id')) {
                $table->foreignId('task_id')->nullable()->after('project_id')->constrained('tasks')->nullOnDelete();
            }
            if (!Schema::hasColumn('student_reports', 'week_start')) {
                $table->date('week_start')->nullable()->after('report_date');
            }
            if (!Schema::hasColumn('student_reports', 'week_end')) {
                $table->date('week_end')->nullable()->after('week_start');
            }
            if (!Schema::hasColumn('student_reports', 'weekly_key')) {
                $table->string('weekly_key', 120)->nullable()->unique()->after('week_end');
            }
        });
    }

    public function down()
    {
        Schema::table('student_reports', function (Blueprint $table) {
            if (Schema::hasColumn('student_reports', 'task_id')) {
                $table->dropForeign(['task_id']);
                $table->dropColumn('task_id');
            }
            if (Schema::hasColumn('student_reports', 'weekly_key')) {
                $table->dropUnique(['weekly_key']);
                $table->dropColumn('weekly_key');
            }
            if (Schema::hasColumn('student_reports', 'week_end')) {
                $table->dropColumn('week_end');
            }
            if (Schema::hasColumn('student_reports', 'week_start')) {
                $table->dropColumn('week_start');
            }
        });
    }
};
