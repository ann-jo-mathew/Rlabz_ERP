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
        Schema::table('requirement_changes', function (Blueprint $table) {
            $table->text('previous_value')->nullable();
            $table->text('updated_value')->nullable();
            $table->foreignId('changed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('requirement_changes', function (Blueprint $table) {
            $table->dropForeign(['changed_by']);
            $table->dropColumn([
                'previous_value',
                'updated_value',
                'changed_by',
            ]);
        });
    }
};
