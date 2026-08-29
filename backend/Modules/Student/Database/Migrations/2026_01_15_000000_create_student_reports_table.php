<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('student_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->enum('report_type', ['daily', 'weekly']);
            $table->date('report_date');
            $table->text('work_done');
            $table->text('challenges')->nullable();
            $table->text('next_plan')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('student_reports');
    }
};
