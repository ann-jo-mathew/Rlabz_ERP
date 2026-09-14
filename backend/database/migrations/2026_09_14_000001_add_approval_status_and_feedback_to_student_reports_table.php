<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('student_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('student_reports', 'approval_status')) {
                $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending')->after('report_file');
            }
            if (!Schema::hasColumn('student_reports', 'feedback')) {
                $table->text('feedback')->nullable()->after('approval_status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_reports', function (Blueprint $table) {
            if (Schema::hasColumn('student_reports', 'feedback')) {
                $table->dropColumn('feedback');
            }
            if (Schema::hasColumn('student_reports', 'approval_status')) {
                $table->dropColumn('approval_status');
            }
        });
    }
};
