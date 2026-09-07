<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * certificates.description was sized for a short, manually-typed blurb (varchar(100)).
 * Descriptions are now generated server-side from the student/module/project names and
 * can exceed 100 characters, so the column is widened to TEXT. Raw SQL is used because
 * doctrine/dbal (required by Schema::table()->change()) is not installed in this project.
 */
return new class extends Migration
{
    public function up()
    {
        DB::statement('ALTER TABLE certificates MODIFY description TEXT NOT NULL');
    }

    public function down()
    {
        DB::statement("ALTER TABLE certificates MODIFY description VARCHAR(100) NOT NULL");
    }
};
