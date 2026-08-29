<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('client_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_finance_id')->constrained('project_finances')->onDelete('cascade');
            $table->decimal('amount', 12, 2);
            $table->date('payment_date')->nullable();
            $table->string('payment_method', 50)->nullable();
            $table->enum('payment_type', ['advance', 'partial', 'full']);
            $table->string('payment_reference', 255)->nullable();
            $table->enum('status', ['pending', 'received', 'failed']);
            $table->text('remarks')->nullable();
            $table->foreignId('recorded_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('client_payments');
    }
};
