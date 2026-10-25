# Sync development files to global Antigravity plugin directory
param(
    [string]$PluginDir = "$env:USERPROFILE\.gemini\config\plugins\fullstack-audit"
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path "$PSScriptRoot\.."

if (-not (Test-Path $PluginDir)) {
    Write-Error "Global plugin directory not found at $PluginDir"
    exit 1
}

# Directories to synchronize
$dirsToSync = @("bin", "scripts", "rules", "skills")
foreach ($dir in $dirsToSync) {
    $srcPath = Join-Path $repoRoot $dir
    $dstPath = Join-Path $PluginDir $dir
    if (Test-Path $srcPath) {
        if (-not (Test-Path $dstPath)) {
            New-Item -ItemType Directory -Path $dstPath -Force | Out-Null
        }
        Copy-Item -Path "$srcPath\*" -Destination $dstPath -Recurse -Force
    }
}

# Root manifests and metadata files
$filesToSync = @("package.json", "gemini-extension.json", "hooks.json", "README.md", "LICENSE")
foreach ($file in $filesToSync) {
    $srcFile = Join-Path $repoRoot $file
    if (Test-Path $srcFile) {
        Copy-Item -Path $srcFile -Destination (Join-Path $PluginDir $file) -Force
    }
}

$pkgJson = Get-Content (Join-Path $repoRoot "package.json") -Raw | ConvertFrom-Json
Write-Output "Successfully synchronized fullstack-audit v$($pkgJson.version) to $PluginDir"
