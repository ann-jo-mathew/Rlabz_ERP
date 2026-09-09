<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('ssl_renewal_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hosting_charge_id')->constrained('hosting_charges')->onDelete('cascade');
            $table->date('renewal_date');
            $table->date('previous_expiry_date')->nullable();
            $table->date('new_expiry_date');
            $table->decimal('renewal_amount', 12, 2);
            $table->string('payment_reference')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('renewed_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('ssl_renewal_history');
    }
};
