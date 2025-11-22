<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CandidateEducation extends Model
{
    protected $fillable = [
        'candidate_profile_id',
        'institution',
        'degree',
        'field_of_study',
        'start_date',
        'end_date',
    ];

    public function profile()
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_profile_id');
    }
}
