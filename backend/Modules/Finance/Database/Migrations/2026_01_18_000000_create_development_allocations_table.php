<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('development_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_finance_id')->constrained('project_finances')->onDelete('cascade');
            $table->enum('recipient_type', ['student', 'faculty', 'rlabz']);
            $table->foreignId('recipient_id')->nullable()->constrained('users');
            $table->decimal('amount', 12, 2);
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('development_allocations');
    }
};
