<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('project_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('report_title', 200);
            $table->string('report_file', 500);
            $table->foreignId('uploaded_by')->constrained('users');
            $table->dateTime('upload_date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('project_reports');
    }
};
