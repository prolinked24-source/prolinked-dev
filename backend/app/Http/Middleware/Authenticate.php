protected function redirectTo(Request $request): ?string
{
    // Für API-Requests keine Redirects, sondern 401 zurückgeben
    return null;
}

