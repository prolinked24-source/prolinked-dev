<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CandidateProfile extends Model
{
    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'country_of_origin',
        'target_country',
        'primary_language',
        'secondary_language',
        'current_position',
        'desired_position',
        'cv_path',
        'summary',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function candidateProfile()
    {
        return $this->hasOne(CandidateProfile::class, 'user_id');
    }

    public function experiences()
    {
        return $this->hasMany(CandidateExperience::class);
    }

    public function educations()
    {
        return $this->hasMany(CandidateEducation::class);
    }

    public function skills()
    {
        return $this->hasMany(CandidateSkill::class);
    }

    public function languages()
    {
        return $this->hasMany(CandidateLanguage::class);
    }
}

