<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('faculty_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_faculty_id')->constrained('project_faculty')->onDelete('cascade');
            $table->foreignId('project_finance_id')->constrained('project_finances')->onDelete('cascade');
            $table->foreignId('faculty_id')->constrained('users')->onDelete('cascade');
            $table->decimal('amount', 12, 2);
            $table->enum('status', ['calculated', 'approved', 'processing', 'paid', 'failed']);
            $table->date('payment_date')->nullable();
            $table->string('payment_method', 50)->nullable();
            $table->string('payment_reference', 255)->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('faculty_payments');
    }
};
