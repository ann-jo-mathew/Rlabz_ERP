<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('student_reports', function (Blueprint $table) {
            $table->string('report_file', 255)->nullable()->after('work_done');
        });
    }

    public function down()
    {
        Schema::table('student_reports', function (Blueprint $table) {
            $table->dropColumn('report_file');
        });
    }
};
