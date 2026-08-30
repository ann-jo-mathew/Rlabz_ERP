<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('meeting_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('meetings')->onDelete('cascade');
            $table->text('minutes');
            $table->text('important_decisions');
            $table->foreignId('uploaded_by')->constrained('users');
            $table->dateTime('uploaded_on');
        });
    }

    public function down()
    {
        Schema::dropIfExists('meeting_notes');
    }
};
