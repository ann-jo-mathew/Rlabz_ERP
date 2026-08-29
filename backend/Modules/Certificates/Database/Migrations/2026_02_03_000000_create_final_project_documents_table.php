<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('final_project_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->unique()->constrained('projects')->onDelete('cascade');
            $table->string('final_report', 500)->nullable();
            $table->string('code_handover', 500)->nullable();
            $table->text('closure_notes')->nullable();
            $table->dateTime('uploaded_on');
        });
    }

    public function down()
    {
        Schema::dropIfExists('final_project_documents');
    }
};
