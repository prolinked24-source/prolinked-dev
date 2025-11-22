<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CvTemplate extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'industry',
        'language',
        'layout_type',
        'description',
    ];
}
