<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('project_student', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['project_lead', 'developer', 'designer', 'tester', 'other']);
            $table->date('assigned_date');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('project_student');
    }
};
