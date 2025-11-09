<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('applications', function (Blueprint $table) {
        $table->id();
        $table->foreignId('candidate_profile_id')->constrained()->onDelete('cascade');
        $table->foreignId('job_id')->constrained()->onDelete('cascade');
        $table->string('status')->default('submitted'); 
        // submitted, in_review, accepted, rejected, on_hold
        $table->text('notes')->nullable(); // interne Notizen von PROLINKED
        $table->timestamps();

        $table->unique(['candidate_profile_id', 'job_id']);
    });
}

public function down(): void
{
    Schema::dropIfExists('applications');
}

};
