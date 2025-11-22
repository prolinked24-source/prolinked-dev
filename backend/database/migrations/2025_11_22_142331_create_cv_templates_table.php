<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cv_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');      // z.B. "Pflege – Klassisch"
            $table->string('slug')->unique(); // z.B. "nursing_classic"
            $table->string('industry')->nullable(); // "nursing", "it", ...
            $table->string('language', 5)->default('de'); // "de", "en", ...
            $table->string('layout_type')->default('one_column'); // "one_column", "two_column"
            // Optional: später eigene HTML-Basis je Template
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cv_templates');
    }
};
