<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidate_experiences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_profile_id')->constrained()->onDelete('cascade');
            $table->string('company_name');
            $table->string('position');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_current')->default(false);
            $table->text('description')->nullable(); // Bulletpoints
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_experiences');
    }
};
