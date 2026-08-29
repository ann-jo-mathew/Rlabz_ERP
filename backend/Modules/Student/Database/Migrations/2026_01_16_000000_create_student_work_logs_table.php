<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('student_work_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_student_id')->constrained('project_student')->onDelete('cascade');
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->date('work_date');
            $table->decimal('hours_worked', 5, 2);
            $table->text('description')->nullable();
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('student_work_logs');
    }
};
