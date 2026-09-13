<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A student's single, global project role — separate from project_student.role
 * (which records the role on a specific assignment) and unrelated to
 * student_profiles.designation (nova/orbit/spark pay tier). One row per student;
 * once set, it is reused for every future project assignment instead of being
 * re-chosen per project.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('student_roles')) {
            Schema::create('student_roles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->unique()->constrained('users')->onDelete('cascade');
                $table->enum('role', ['project_lead', 'developer', 'designer', 'tester', 'other']);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('student_roles');
    }
};
