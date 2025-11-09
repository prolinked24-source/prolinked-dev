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
    Schema::create('candidate_profiles', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->string('first_name');
        $table->string('last_name');
        $table->string('country_of_origin')->nullable();
        $table->string('target_country')->default('DE');
        $table->string('primary_language')->nullable();
        $table->string('secondary_language')->nullable();
        $table->string('current_position')->nullable();
        $table->string('desired_position')->nullable();
        $table->string('cv_path')->nullable(); // Pfad zur hochgeladenen CV-Datei
        $table->text('summary')->nullable();   // Kurzprofil
        $table->timestamps();
    });
  }

    public function down(): void
    {
    Schema::dropIfExists('candidate_profiles');
    }

};
