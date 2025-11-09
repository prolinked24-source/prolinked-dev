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
    Schema::create('employers', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->string('company_name');
        $table->string('contact_person')->nullable();
        $table->string('country')->nullable();
        $table->string('city')->nullable();
        $table->string('industry')->nullable();
        $table->string('website')->nullable();
        $table->text('company_description')->nullable();
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('employers');
}

};
