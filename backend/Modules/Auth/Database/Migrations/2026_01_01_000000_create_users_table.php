<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('username')->unique();
            $table->string('password');
            
            // ROLE: Kept as a simple string column for single-role-per-user design.
            $table->string('role'); 
            
            // PERMISSIONS: See my recommendation below. If we go with JSON, it would be:
            // $table->json('permissions')->nullable();

            // MODULES: JSON column recommended for simple array storage (e.g. ['dashboard', 'project-client'])
            $table->json('modules')->nullable();

            // CATEGORY: Only relevant if role = 'student'
            $table->enum('category', ['nova', 'orbit', 'spark'])->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
