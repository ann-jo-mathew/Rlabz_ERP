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
        if (!Schema::hasColumn('requirement_changes', 'previous_value')) {
            Schema::table('requirement_changes', function (Blueprint $table) {
                $table->text('previous_value')->nullable();
            });
        }

        if (!Schema::hasColumn('requirement_changes', 'updated_value')) {
            Schema::table('requirement_changes', function (Blueprint $table) {
                $table->text('updated_value')->nullable();
            });
        }

        if (!Schema::hasColumn('requirement_changes', 'changed_by')) {
            Schema::table('requirement_changes', function (Blueprint $table) {
                $table->foreignId('changed_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('requirement_changes', 'changed_by')) {
            Schema::table('requirement_changes', function (Blueprint $table) {
                $table->dropForeign(['changed_by']);
                $table->dropColumn('changed_by');
            });
        }

        if (Schema::hasColumn('requirement_changes', 'previous_value')) {
            Schema::table('requirement_changes', function (Blueprint $table) {
                $table->dropColumn('previous_value');
            });
        }

        if (Schema::hasColumn('requirement_changes', 'updated_value')) {
            Schema::table('requirement_changes', function (Blueprint $table) {
                $table->dropColumn('updated_value');
            });
        }
    }
};