<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('requirement_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_requirement_id')->constrained('client_requirements')->onDelete('cascade');
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->text('previous_description')->nullable();
            $table->text('new_description')->nullable();
            $table->text('change_description');
            $table->text('reason')->nullable();
            $table->string('previous_document_path', 500)->nullable();
            $table->string('new_document_path', 500)->nullable();
            $table->foreignId('requested_by')->constrained('users');
            $table->enum('status', ['pending', 'approved', 'rejected']);
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->dateTime('changed_on');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('requirement_changes');
    }
};
