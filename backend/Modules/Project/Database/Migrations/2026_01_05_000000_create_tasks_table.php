<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->foreignId('assigned_to')->constrained('users');
            $table->enum('status', ['todo', 'in_progress', 'completed', 'blocked']);
            $table->date('due_date')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->enum('review_status', ['pending', 'approved', 'rejected'])->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('tasks');
    }
};
