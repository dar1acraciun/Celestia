param(
    [string]$BaseUrl = "http://localhost:8080"
)

$ImagesDir = "C:\Users\Asus-pc\OneDrive\Pictures\poze site"
$success = 0
$failed = 0

# Map filename names to DB names where they differ
$nameMap = @{
    "Bootes" = "Boötes"
}

Add-Type -AssemblyName System.Net.Http

$client = New-Object System.Net.Http.HttpClient
$client.Timeout = [System.TimeSpan]::FromSeconds(60)

Get-ChildItem "$ImagesDir\Const_*_lines001.png" | ForEach-Object {
    $linesFile = $_.FullName
    $filename = $_.Name

    $namePart = $filename -replace '^Const_', '' -replace '_lines001\.png$', ''
    $name = $namePart -replace '_', ' '
    if ($nameMap.ContainsKey($name)) { $name = $nameMap[$name] }
    $nolinesFile = $linesFile -replace '_lines001\.png$', '_nolines001.png'

    if (-not (Test-Path $nolinesFile)) {
        Write-Host "WARNING: missing nolines for '$name', skipping"
        $script:failed++
        return
    }

    Write-Host -NoNewline "Uploading '$name'... "

    try {
        $encodedName = [Uri]::EscapeDataString($name)
        $url = "$BaseUrl/constellations/$encodedName/images"

        $content = New-Object System.Net.Http.MultipartFormDataContent

        $linesBytes = [System.IO.File]::ReadAllBytes($linesFile)
        $linesContent = New-Object System.Net.Http.ByteArrayContent($linesBytes, 0, $linesBytes.Length)
        $linesContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
        $content.Add($linesContent, "linesImage", [System.IO.Path]::GetFileName($linesFile))

        $nolinesBytes = [System.IO.File]::ReadAllBytes($nolinesFile)
        $nolinesContent = New-Object System.Net.Http.ByteArrayContent($nolinesBytes, 0, $nolinesBytes.Length)
        $nolinesContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
        $content.Add($nolinesContent, "nolinesImage", [System.IO.Path]::GetFileName($nolinesFile))

        $response = $client.PostAsync($url, $content).Result
        if ($response.IsSuccessStatusCode) {
            Write-Host "OK"
            $script:success++
        } else {
            Write-Host "FAILED (HTTP $($response.StatusCode))"
            $script:failed++
        }
    } catch {
        Write-Host "FAILED ($_)"
        $script:failed++
    }
}

$client.Dispose()
Write-Host ""
Write-Host "Done: $success uploaded, $failed failed"
