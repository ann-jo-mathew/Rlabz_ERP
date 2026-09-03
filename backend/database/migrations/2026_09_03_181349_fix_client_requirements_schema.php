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
        Schema::table('client_requirements', function (Blueprint $table) {
            $table->dropForeign(['task_id']);
            $table->dropForeign(['uploaded_by']);
            $table->dropColumn(['task_id', 'document_path', 'uploaded_by', 'uploaded_on']);
            
            $table->string('title')->after('project_id');
            $table->string('status')->default('new')->after('description');
            $table->timestamps();
        });

        Schema::table('requirement_changes', function (Blueprint $table) {
            // we can drop the old columns and add the ones expected by the controller
            $table->dropForeign(['requested_by']);
            $table->dropForeign(['approved_by']);
            $table->dropColumn([
                'previous_description', 'new_description', 'change_description', 
                'reason', 'previous_document_path', 'new_document_path', 
                'status', 'approved_by', 'approved_at', 'changed_on', 'requested_by'
            ]);

            $table->text('previous_value')->nullable();
            $table->text('updated_value')->nullable();
            $table->foreignId('changed_by')->constrained('users');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Not implementing down for this fix migration as it's a structural rewrite
    }
};
