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
            $table->decimal('amount', 12, 2);
            $table->date('payment_date')->nullable();
            $table->enum('status', ['calculated', 'approved', 'processing', 'paid', 'failed']);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('faculty_payments');
    }
};
