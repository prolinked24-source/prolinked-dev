<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidate_languages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_profile_id')->constrained()->onDelete('cascade');
            $table->string('language'); // "Deutsch", "Englisch", ...
            $table->string('level');    // "A2", "B1", "B2", "C1", ...
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_languages');
    }
};
