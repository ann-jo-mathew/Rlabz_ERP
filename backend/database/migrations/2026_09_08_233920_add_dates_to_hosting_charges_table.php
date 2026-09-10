<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The live hosting_charges table diverged from its own migration
 * (2026_01_19_000000_create_hosting_charges_table) and the HostingCharge model, which both
 * already define purchase_date/expiry_date/reference_details — this table was altered
 * outside the migration system at some point and ended up with a single
 * name_or_reference column instead, with no date tracking at all. This migration restores
 * the columns the existing model already expects (needed for SSL certificate expiry
 * tracking) without touching name_or_reference, which nothing in the codebase reads.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hosting_charges', function (Blueprint $table) {
            if (!Schema::hasColumn('hosting_charges', 'purchase_date')) {
                $table->date('purchase_date')->nullable()->after('amount');
            }
            if (!Schema::hasColumn('hosting_charges', 'expiry_date')) {
                $table->date('expiry_date')->nullable()->after('purchase_date');
            }
            if (!Schema::hasColumn('hosting_charges', 'reference_details')) {
                $table->text('reference_details')->nullable()->after('expiry_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('hosting_charges', function (Blueprint $table) {
            $table->dropColumn(['purchase_date', 'expiry_date', 'reference_details']);
        });
    }
};
