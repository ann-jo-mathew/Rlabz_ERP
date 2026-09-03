<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('student_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_student_id')->constrained('project_student')->onDelete('cascade');
            // 'designation' and 'hourly_rate' act as historical payment snapshots for this record
            $table->enum('designation', ['nova', 'orbit', 'spark']);
            $table->decimal('approved_hours', 7, 2)->nullable();
            $table->decimal('hourly_rate', 10, 2)->nullable();
            // 'amount' represents the actual payment event
            $table->decimal('amount', 12, 2);
            $table->date('payment_date')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('student_payments');
    }
};
