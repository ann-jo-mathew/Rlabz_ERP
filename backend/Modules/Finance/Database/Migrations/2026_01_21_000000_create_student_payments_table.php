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
            $table->foreignId('task_id')->nullable()->constrained('tasks')->onDelete('set null');
            $table->foreignId('project_finance_id')->constrained('project_finances')->onDelete('cascade');
            $table->enum('designation', ['nova', 'orbit', 'spark']);
            $table->decimal('approved_hours', 7, 2)->nullable();
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->decimal('amount', 12, 2);
            $table->date('payment_period_start')->nullable();
            $table->date('payment_period_end')->nullable();
            $table->enum('status', ['calculated', 'approved', 'processing', 'paid', 'failed']);
            $table->date('payment_date')->nullable();
            $table->string('payment_method', 50)->nullable();
            $table->string('payment_reference', 255)->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('student_payments');
    }
};
