<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('tasks', 'github_repository_id')) {
                $table->foreignId('github_repository_id')->nullable()->after('assigned_to')->constrained('github_repositories')->nullOnDelete();
            }
            if (!Schema::hasColumn('tasks', 'github_pr_url')) {
                $table->string('github_pr_url', 500)->nullable()->after('github_repository_id');
            }
        });
    }

    public function down()
    {
        Schema::table('tasks', function (Blueprint $table) {
            if (Schema::hasColumn('tasks', 'github_repository_id')) {
                $table->dropForeign(['github_repository_id']);
                $table->dropColumn('github_repository_id');
            }
            if (Schema::hasColumn('tasks', 'github_pr_url')) {
                $table->dropColumn('github_pr_url');
            }
        });
    }
};
