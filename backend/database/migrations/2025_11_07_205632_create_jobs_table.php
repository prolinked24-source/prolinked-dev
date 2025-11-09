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
    Schema::create('jobs', function (Blueprint $table) {
        $table->id();
        $table->foreignId('employer_id')->constrained()->onDelete('cascade');
        $table->string('title');
        $table->string('location')->nullable();
        $table->string('employment_type')->nullable(); // full-time, part-time, etc.
        $table->text('description');
        $table->text('requirements')->nullable();
        $table->string('language_requirement')->nullable(); // z.B. B2 Deutsch
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('jobs');
}

};
