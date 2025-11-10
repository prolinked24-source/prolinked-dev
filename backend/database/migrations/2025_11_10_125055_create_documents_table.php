<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Falls die Tabelle noch nicht existiert -> neu erstellen
        if (!Schema::hasTable('documents')) {
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
        } else {
            // Falls sie schon existiert (so wie bei dir gerade),
            // ergänzen wir nur die fehlenden Spalten.
            Schema::table('documents', function (Blueprint $table) {
                if (!Schema::hasColumn('documents', 'user_id')) {
                    $table->foreignId('user_id')
                          ->after('id')
                          ->constrained()
                          ->onDelete('cascade');
                }
                if (!Schema::hasColumn('documents', 'type')) {
                    $table->string('type')->after('user_id');
                }
                if (!Schema::hasColumn('documents', 'original_name')) {
                    $table->string('original_name')->after('type');
                }
                if (!Schema::hasColumn('documents', 'path')) {
                    $table->string('path')->after('original_name');
                }
                if (!Schema::hasColumn('documents', 'mime_type')) {
                    $table->string('mime_type')->nullable()->after('path');
                }
                if (!Schema::hasColumn('documents', 'size')) {
                    $table->unsignedBigInteger('size')->nullable()->after('mime_type');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};

