<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = [
        'candidate_profile_id',
        'job_id',
        'status',
        'notes',
    ];

    public function candidateProfile()
    {
        return $this->belongsTo(CandidateProfile::class);
    }

    public function job()
    {
        return $this->belongsTo(Job::class);
    }
}

