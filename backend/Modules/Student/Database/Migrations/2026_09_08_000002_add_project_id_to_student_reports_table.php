<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasColumn('student_reports', 'project_id')) {
            Schema::table('student_reports', function (Blueprint $table) {
                $table->foreignId('project_id')->nullable()->after('student_id')->constrained('projects')->nullOnDelete();
            });
        }
    }

    public function down()
    {
        Schema::table('student_reports', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->dropColumn('project_id');
        });
    }
};
