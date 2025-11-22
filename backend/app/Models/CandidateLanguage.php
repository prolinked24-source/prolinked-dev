<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CandidateLanguage extends Model
{
    protected $fillable = [
        'candidate_profile_id',
        'language',
        'level',
    ];

    public function profile()
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_profile_id');
    }
}
