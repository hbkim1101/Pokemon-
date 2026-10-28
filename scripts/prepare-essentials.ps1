[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $BaseProjectPath,

    [Parameter(Mandatory = $true)]
    [string] $DestinationPath,

    [string] $EssentialsSourcePath
)

$ErrorActionPreference = 'Stop'
$officialRepo = 'https://github.com/Maruno17/pokemon-essentials.git'
$base = (Resolve-Path -LiteralPath $BaseProjectPath).Path
$required = @('Game.exe', 'Game.rxproj', 'mkxp.json', 'Data', 'Graphics', 'Audio')
$missing = @($required | Where-Object { -not (Test-Path -LiteralPath (Join-Path $base $_)) })
if ($missing.Count -gt 0) {
    throw "Base project is missing required Essentials v21.1 items: $($missing -join ', '). Select a complete, runnable project folder."
}
$destinationParent = Split-Path -Parent $DestinationPath
if (-not $destinationParent) { $destinationParent = (Get-Location).Path }
if (-not (Test-Path -LiteralPath $destinationParent)) {
    New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
}
$parent = (Resolve-Path -LiteralPath $destinationParent).Path
$leaf = Split-Path -Leaf $DestinationPath
if (-not $leaf) { throw 'DestinationPath must name a new project folder.' }
$destination = Join-Path $parent $leaf
if (Test-Path -LiteralPath $destination) {
    throw "Destination already exists; choose a new folder to avoid overwriting it: $destination"
}

$source = $null
$tempSource = $null
$stage = Join-Path $parent ('.' + $leaf + '.setup-' + [guid]::NewGuid().ToString('N'))
if ($EssentialsSourcePath) {
    $source = (Resolve-Path -LiteralPath $EssentialsSourcePath).Path
    if (-not (Test-Path -LiteralPath (Join-Path $source 'README.md'))) {
        throw 'EssentialsSourcePath must point to the official pokemon-essentials repository checkout.'
    }
} else {
    $git = Get-Command git -ErrorAction SilentlyContinue
    if (-not $git) { throw 'Git is required to fetch the official Essentials scripts. Install Git or pass -EssentialsSourcePath.' }
    $tempSource = Join-Path ([IO.Path]::GetTempPath()) ('pokemon-essentials-' + [guid]::NewGuid().ToString('N'))
    & $git.Source clone --depth 1 $officialRepo $tempSource
    if ($LASTEXITCODE -ne 0) { throw 'Could not clone the official Essentials source. Retry with -EssentialsSourcePath pointing to a local checkout.' }
    $source = $tempSource
}

try {
    New-Item -ItemType Directory -Path $stage | Out-Null
    & robocopy $base $stage /E /COPY:DAT /DCOPY:DAT /R:2 /W:1 /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "Could not copy the base project (robocopy exit $LASTEXITCODE)." }
    & robocopy $source $stage /E /XD (Join-Path $source '.git') /COPY:DAT /DCOPY:DAT /R:2 /W:1 /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "Could not merge Essentials source files (robocopy exit $LASTEXITCODE)." }
    if (Test-Path -LiteralPath $destination) {
        throw "Destination appeared during setup; no files were written there: $destination"
    }
    Move-Item -LiteralPath $stage -Destination $destination
    Write-Host "Created Essentials project: $destination"
    Write-Host 'Base project was copied; its original files were not changed.'
    Write-Host 'Open Game.rxproj in RPG Maker XP and run Game.exe to check the project.'
} finally {
    if (Test-Path -LiteralPath $stage) {
        Remove-Item -LiteralPath $stage -Recurse -Force
    }
    if ($tempSource -and (Test-Path -LiteralPath $tempSource)) {
        Remove-Item -LiteralPath $tempSource -Recurse -Force
    }
}
