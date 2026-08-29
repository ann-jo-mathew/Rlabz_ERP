<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->string('certificate_number', 50)->unique();
            $table->string('description', 100);
            $table->date('issue_date');
            $table->string('certificate_file', 500)->nullable();
            $table->foreignId('issued_by')->constrained('users');
            // No timestamps specified in prompt, but let's add them for safety or omit? Prompt says "timestamps" for some, not for this. I will omit.
        });
    }

    public function down()
    {
        Schema::dropIfExists('certificates');
    }
};
