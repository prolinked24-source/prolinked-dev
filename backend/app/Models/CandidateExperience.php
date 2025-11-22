<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CandidateExperience extends Model
{
    protected $fillable = [
        'candidate_profile_id',
        'company_name',
        'position',
        'start_date',
        'end_date',
        'is_current',
        'description',
    ];

    public function profile()
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_profile_id');
    }
}
