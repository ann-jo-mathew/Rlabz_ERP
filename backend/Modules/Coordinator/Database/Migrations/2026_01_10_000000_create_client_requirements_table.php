<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('client_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->text('description');
            $table->string('document_path', 500)->nullable();
            $table->foreignId('uploaded_by')->constrained('users');
            $table->dateTime('uploaded_on');
        });
    }

    public function down()
    {
        Schema::dropIfExists('client_requirements');
    }
};
