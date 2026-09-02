<?php

namespace Modules\Finance\Models;

use Illuminate\Database\Eloquent\Model;

class DevelopmentAllocation extends Model
{
    protected $fillable = [
        'project_finance_id',
        'category',
        'amount',
    ];

    public function projectFinance()
    {
        return $this->belongsTo(ProjectFinance::class);
    }
}
