<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('title', 255);
            $table->dateTime('scheduled_at');
            $table->string('location', 255)->nullable();
            $table->string('meeting_link', 500)->nullable();
            $table->text('agenda')->nullable();
            $table->enum('status', ['scheduled', 'completed', 'cancelled']);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('meetings');
    }
};
