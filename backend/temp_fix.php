<?php
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

Schema::table('client_requirements', function (Blueprint $table) {
    if (!Schema::hasColumn('client_requirements', 'project_id')) {
        $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
    }
});

echo "Fixed client_requirements table.\n";
