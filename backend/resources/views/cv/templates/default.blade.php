<!doctype html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>Lebenslauf</title>
    <style>
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 11px;
            color: #111827;
            margin: 0;
            padding: 24px;
        }
        h1 {
            font-size: 20px;
            margin-bottom: 4px;
        }
        h2 {
            font-size: 13px;
            margin-top: 16px;
            margin-bottom: 4px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 2px;
        }
        .headline {
            font-size: 12px;
            color: #374151;
            margin-bottom: 8px;
        }
        .section {
            margin-bottom: 10px;
        }
        .item-title {
            font-weight: bold;
        }
        .muted {
            color: #6b7280;
        }
        ul {
            margin: 0;
            padding-left: 16px;
        }
        .two-col {
            display: flex;
            gap: 24px;
        }
        .col-left {
            flex: 2;
        }
        .col-right {
            flex: 1;
        }
    </style>
</head>
<body>
    <h1>{{ $fullName }}</h1>
    <div class="headline">{{ $headline }}</div>

    @if($summary)
        <div class="section">
            <p>{{ $summary }}</p>
        </div>
    @endif

    <div class="two-col">
        <div class="col-left">
            {{-- Berufserfahrung --}}
            @if($experiences->count() > 0)
                <div class="section">
                    <h2>Berufserfahrung</h2>
                    @foreach($experiences as $exp)
                        <div style="margin-bottom: 6px;">
                            <div class="item-title">
                                {{ $exp->position }} – {{ $exp->company_name }}
                            </div>
                            <div class="muted">
                                @if($exp->start_date)
                                    {{ \Carbon\Carbon::parse($exp->start_date)->format('m/Y') }}
                                    –
                                    @if($exp->is_current)
                                        heute
                                    @elseif($exp->end_date)
                                        {{ \Carbon\Carbon::parse($exp->end_date)->format('m/Y') }}
                                    @else
                                        —
                                    @endif
                                @endif
                            </div>
                            @if($exp->description)
                                <div>
                                    {!! nl2br(e($exp->description)) !!}
                                </div>
                            @endif
                        </div>
                    @endforeach
                </div>
            @endif

            {{-- Ausbildung --}}
            @if($educations->count() > 0)
                <div class="section">
                    <h2>Ausbildung</h2>
                    @foreach($educations as $edu)
                        <div style="margin-bottom: 6px;">
                            <div class="item-title">
                                {{ $edu->degree ?? 'Abschluss' }} – {{ $edu->institution }}
                            </div>
                            <div class="muted">
                                @if($edu->start_date)
                                    {{ \Carbon\Carbon::parse($edu->start_date)->format('m/Y') }}
                                    –
                                    @if($edu->end_date)
                                        {{ \Carbon\Carbon::parse($edu->end_date)->format('m/Y') }}
                                    @else
                                        —
                                    @endif
                                @endif
                            </div>
                            @if($edu->field_of_study)
                                <div>{{ $edu->field_of_study }}</div>
                            @endif
                        </div>
                    @endforeach
                </div>
            @endif
        </div>

        <div class="col-right">
            {{-- Persönliche Daten (sehr basic) --}}
            <div class="section">
                <h2>Profil</h2>
                <div>{{ $fullName }}</div>
                @if($profile->country_of_origin)
                    <div class="muted">
                        Herkunftsland: {{ $profile->country_of_origin }}
                    </div>
                @endif
                @if($profile->target_country)
                    <div class="muted">
                        Ziel: {{ $profile->target_country }}
                    </div>
                @endif
                <div class="muted">
                    E-Mail: {{ $user->email }}
                </div>
            </div>

            {{-- Sprachen --}}
            @if($languages->count() > 0)
                <div class="section">
                    <h2>Sprachkenntnisse</h2>
                    <ul>
                        @foreach($languages as $lang)
                            <li>{{ $lang->language }} – {{ $lang->level }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            {{-- Skills --}}
            @if($skills->count() > 0)
                <div class="section">
                    <h2>Fachliche Kompetenzen</h2>
                    <ul>
                        @foreach($skills as $skill)
                            <li>{{ $skill->name }}@if($skill->level) ({{ $skill->level }})@endif</li>
                        @endforeach
                    </ul>
                </div>
            @endif
        </div>
    </div>
</body>
</html>
