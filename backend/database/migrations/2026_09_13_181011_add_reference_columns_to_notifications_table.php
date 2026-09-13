<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extends the existing notifications table (user_id, type, message, is_read) with
 * the two fields needed to power a generic bell-icon notification panel: which
 * project a notification relates to, and its urgency. Additive/guarded so it's
 * safe regardless of which existing ad-hoc notification inserts (Faculty/Student
 * controllers) have already run.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            if (!Schema::hasColumn('notifications', 'project_id')) {
                $table->foreignId('project_id')->nullable()->after('user_id')->constrained('projects')->nullOnDelete();
            }
            if (!Schema::hasColumn('notifications', 'urgency')) {
                $table->string('urgency', 20)->nullable()->after('type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->dropColumn(['project_id', 'urgency']);
        });
    }
};
