<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')      // Kandidat (User)
                  ->constrained()
                  ->onDelete('cascade');
            $table->string('type');           // z.B. cv, certificate, reference
            $table->string('original_name');  // originaler Dateiname
            $table->string('path');           // Pfad im Storage
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size')->nullable(); // Bytes
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
