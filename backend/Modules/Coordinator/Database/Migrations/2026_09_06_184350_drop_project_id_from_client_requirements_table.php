<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // project_id is required by the Coordinator requirements workflow.
        // This migration intentionally does not remove it.
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Nothing to reverse because the up() method makes no changes.
    }
};
