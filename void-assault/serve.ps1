# Simple HTTP Server for Void Assault
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  VOID ASSAULT - Server Running!" -ForegroundColor Green
Write-Host "  Open: http://localhost:8080" -ForegroundColor Yellow
Write-Host "  Press Ctrl+C to stop" -ForegroundColor DarkGray
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".wav"  = "audio/wav"
    ".mp3"  = "audio/mpeg"
    ".ico"  = "image/x-icon"
    ".md"   = "text/plain; charset=utf-8"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/index.html" }

        $filePath = Join-Path $root ($urlPath -replace "/", "\")

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = $mimeTypes[$ext]
            if (-not $contentType) { $contentType = "application/octet-stream" }

            $response.ContentType = $contentType
            $response.StatusCode = 200

            $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $fileBytes.Length
            $response.OutputStream.Write($fileBytes, 0, $fileBytes.Length)

            Write-Host "[200] $urlPath" -ForegroundColor Green
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentLength64 = $msg.Length
            $response.OutputStream.Write($msg, 0, $msg.Length)
            Write-Host "[404] $urlPath" -ForegroundColor Red
        }

        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
    Write-Host "Server stopped." -ForegroundColor Yellow
}
