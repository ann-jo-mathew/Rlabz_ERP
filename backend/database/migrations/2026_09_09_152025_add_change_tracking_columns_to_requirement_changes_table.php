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
            if (!Schema::hasColumn('requirement_changes', 'previous_value')) {
                $table->text('previous_value')->nullable();
            }

            if (!Schema::hasColumn('requirement_changes', 'updated_value')) {
                $table->text('updated_value')->nullable();
            }

            if (!Schema::hasColumn('requirement_changes', 'changed_by')) {
                $table->foreignId('changed_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('requirement_changes', function (Blueprint $table) {
            if (Schema::hasColumn('requirement_changes', 'changed_by')) {
                $table->dropForeign(['changed_by']);
            }

            $columns = [];

            if (Schema::hasColumn('requirement_changes', 'previous_value')) {
                $columns[] = 'previous_value';
            }

            if (Schema::hasColumn('requirement_changes', 'updated_value')) {
                $columns[] = 'updated_value';
            }

            if (Schema::hasColumn('requirement_changes', 'changed_by')) {
                $columns[] = 'changed_by';
            }

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};