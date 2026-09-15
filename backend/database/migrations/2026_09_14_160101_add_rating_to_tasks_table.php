```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
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
                $table->decimal('rating', 3, 2)
                    ->unsigned()
                    ->nullable()
                    ->after('status');
            }
        });

        // Sync existing ratings from student_work_logs into tasks
        $logsWithRatings = DB::table('student_work_logs')
            ->whereNotNull('task_id')
            ->whereNotNull('rating')
            ->get();

        foreach ($logsWithRatings as $log) {
            $r = is_numeric($log->rating) ? (float) $log->rating : null;

            if ($r !== null) {
                DB::table('tasks')
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
```
