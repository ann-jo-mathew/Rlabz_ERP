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
        Schema::table('tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('tasks', 'rating')) {
                $table->decimal('rating', 3, 2)->unsigned()->nullable()->after('status');
            }
        });

        // Sync existing ratings from student_work_logs into tasks
        $logsWithRatings = \Illuminate\Support\Facades\DB::table('student_work_logs')
            ->whereNotNull('task_id')
            ->where(function ($q) {
                $q->whereNotNull('rating')->orWhereNotNull('ratings');
            })
            ->get();

        foreach ($logsWithRatings as $log) {
            $r = $log->rating ?? (is_numeric($log->ratings) ? (float) $log->ratings : null);
            if ($r !== null) {
                \Illuminate\Support\Facades\DB::table('tasks')
                    ->where('id', $log->task_id)
                    ->whereNull('rating')
                    ->update(['rating' => $r]);
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('tasks', function (Blueprint $table) {
            if (Schema::hasColumn('tasks', 'rating')) {
                $table->dropColumn('rating');
            }
        });
    }
};
