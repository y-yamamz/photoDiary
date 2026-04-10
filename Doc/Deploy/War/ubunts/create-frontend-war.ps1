param(
    [string]$DistDir,
    [string]$OutputWar
)

Add-Type -Assembly System.IO.Compression
Add-Type -Assembly System.IO.Compression.FileSystem

$resolvedDist   = (Resolve-Path $DistDir).Path
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputWar)

Write-Host "DistDir : $resolvedDist"
Write-Host "Output  : $resolvedOutput"

if (Test-Path $resolvedOutput) { Remove-Item $resolvedOutput -Force }

$stream  = [System.IO.File]::Open($resolvedOutput, [System.IO.FileMode]::Create)
$archive = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create)

$base = $resolvedDist.TrimEnd('\') + '\'

Get-ChildItem -Path $resolvedDist -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($base.Length).Replace('\', '/')
    Write-Host "  Adding: $relativePath"
    if ($relativePath -eq '') { return }
    $entry       = $archive.CreateEntry($relativePath, [System.IO.Compression.CompressionLevel]::Optimal)
    $entryStream = $entry.Open()
    $fileStream  = [System.IO.File]::OpenRead($_.FullName)
    $fileStream.CopyTo($entryStream)
    $fileStream.Close()
    $entryStream.Close()
}

$archive.Dispose()
$stream.Close()

Write-Host "Created: $resolvedOutput"
