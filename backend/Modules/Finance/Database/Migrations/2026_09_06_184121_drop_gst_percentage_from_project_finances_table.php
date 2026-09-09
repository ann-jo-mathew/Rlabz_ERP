<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasColumn('project_finances', 'gst_percentage')) {
            Schema::table('project_finances', function (Blueprint $table) {
                $table->dropColumn('gst_percentage');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('project_finances', function (Blueprint $table) {
            $table->decimal('gst_percentage', 5, 2)->default(18.00);
        });
    }
};
