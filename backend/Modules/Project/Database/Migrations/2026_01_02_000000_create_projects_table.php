<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('project_type', 100)->nullable();
            $table->enum('source_type', ['faculty', 'alumni', 'institution', 'external'])->nullable();
            $table->string('brought_by', 150)->nullable();
            $table->string('client_name', 150)->nullable();
            $table->string('contact_email', 255)->nullable();
            $table->string('contact_phone', 30)->nullable();
            $table->text('requirements')->nullable();
            $table->text('deliverables')->nullable();
            $table->date('expected_timeline')->nullable();
            $table->decimal('budget', 12, 2)->nullable();
            $table->enum('priority', ['normal', 'urgent'])->default('normal');
            $table->enum('status', ['proposed', 'accepted', 'rejected', 'in_progress', 'closed']);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('projects');
    }
};
