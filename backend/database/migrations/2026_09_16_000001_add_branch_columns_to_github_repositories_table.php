<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('github_repositories', function (Blueprint $table) {
            if (!Schema::hasColumn('github_repositories', 'student_id')) {
                $table->foreignId('student_id')->nullable()->after('project_id')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('github_repositories', 'link_type')) {
                $table->enum('link_type', ['main', 'branch'])->default('main')->after('student_id');
            }
            if (!Schema::hasColumn('github_repositories', 'branch_name')) {
                $table->string('branch_name', 255)->nullable()->after('repository_name');
            }
            if (!Schema::hasColumn('github_repositories', 'branch_url')) {
                $table->string('branch_url', 500)->nullable()->after('repository_url');
            }
        });
    }

    public function down()
    {
        Schema::table('github_repositories', function (Blueprint $table) {
            if (Schema::hasColumn('github_repositories', 'student_id')) {
                $table->dropForeign(['student_id']);
                $table->dropColumn('student_id');
            }
            if (Schema::hasColumn('github_repositories', 'link_type')) {
                $table->dropColumn('link_type');
            }
            if (Schema::hasColumn('github_repositories', 'branch_name')) {
                $table->dropColumn('branch_name');
            }
            if (Schema::hasColumn('github_repositories', 'branch_url')) {
                $table->dropColumn('branch_url');
            }
        });
    }
};
