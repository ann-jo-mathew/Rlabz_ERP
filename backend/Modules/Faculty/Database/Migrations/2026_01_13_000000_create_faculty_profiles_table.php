<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('faculty_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('department', 150);
            $table->string('designation', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('faculty_profiles');
    }
};
