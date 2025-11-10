<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidate_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_user_id')  // der Kandidat (User-ID)
                  ->constrained('users')
                  ->onDelete('cascade');
            $table->foreignId('reviewer_id')        // interner Reviewer (User-ID)
                  ->constrained('users')
                  ->onDelete('cascade');
            $table->unsignedTinyInteger('score')->nullable(); // 1-5
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_reviews');
    }
};
