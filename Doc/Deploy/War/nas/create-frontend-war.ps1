# =============================================================
# create-frontend-war.ps1
# Creates frontend.war from dist/ using forward-slash paths
# so that Linux unzip extracts correctly into subdirectories.
# =============================================================
param(
    [string]$DistDir,
    [string]$OutputWar
)

Add-Type -Assembly System.IO.Compression.FileSystem

if (Test-Path $OutputWar) {
    Remove-Item $OutputWar -Force
}

# CreateFromDirectory uses forward slashes internally -> works on Linux unzip
[System.IO.Compression.ZipFile]::CreateFromDirectory(
    $DistDir,
    $OutputWar,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false   # do not include base directory name
)

Write-Host "Created: $OutputWar"
