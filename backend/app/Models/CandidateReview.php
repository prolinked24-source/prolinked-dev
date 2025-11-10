<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CandidateReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'candidate_user_id',
        'reviewer_id',
        'score',
        'notes',
    ];

    public function candidate()
    {
        return $this->belongsTo(User::class, 'candidate_user_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
