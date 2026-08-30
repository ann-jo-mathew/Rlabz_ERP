<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('project_closures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->unique()->constrained('projects')->onDelete('cascade');
            $table->foreignId('closed_by')->constrained('users');
            $table->dateTime('closure_date');
            $table->string('final_status', 50);
            $table->text('remarks')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('project_closures');
    }
};
