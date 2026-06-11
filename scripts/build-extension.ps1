param(
  [ValidateSet("chrome", "firefox", "all")]
  [string]$Target = "all"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dist = Join-Path $root "dist"
$distRoot = [System.IO.Path]::GetFullPath($dist)
$targets = if ($Target -eq "all") { @("chrome", "firefox") } else { @($Target) }
$items = @("content.js", "icons", "popup", "shared", "styles")

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function New-PortableZip {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourceDirectory,
    [Parameter(Mandatory = $true)]
    [string]$DestinationPath
  )

  $sourceFull = [System.IO.Path]::GetFullPath($SourceDirectory).TrimEnd(
    [System.IO.Path]::DirectorySeparatorChar
  )
  $stream = [System.IO.File]::Open(
    $DestinationPath,
    [System.IO.FileMode]::Create,
    [System.IO.FileAccess]::ReadWrite,
    [System.IO.FileShare]::None
  )

  try {
    $archive = New-Object System.IO.Compression.ZipArchive(
      $stream,
      [System.IO.Compression.ZipArchiveMode]::Create,
      $false
    )

    try {
      foreach ($file in Get-ChildItem -LiteralPath $sourceFull -File -Recurse) {
        $entryName = $file.FullName.Substring($sourceFull.Length + 1).Replace("\", "/")
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
          $archive,
          $file.FullName,
          $entryName,
          [System.IO.Compression.CompressionLevel]::Optimal
        ) | Out-Null
      }
    } finally {
      $archive.Dispose()
    }
  } finally {
    $stream.Dispose()
  }
}

New-Item -ItemType Directory -Force -Path $dist | Out-Null

if ($Target -eq "all") {
  foreach ($oldTarget in @("chrome", "firefox")) {
    $oldStage = Join-Path $dist $oldTarget
    $oldZip = Join-Path $dist "MindFulCloud-$oldTarget.zip"

    if (Test-Path $oldStage) {
      Remove-Item -LiteralPath $oldStage -Recurse -Force
    }

    if (Test-Path $oldZip) {
      Remove-Item -LiteralPath $oldZip -Force
    }
  }
}

foreach ($currentTarget in $targets) {
  $stage = Join-Path $dist $currentTarget
  $zip = Join-Path $dist "MindFulCloud-$currentTarget.zip"
  $manifest = Join-Path $root "manifest.$currentTarget.json"
  $stageFull = [System.IO.Path]::GetFullPath($stage)

  if (-not $stageFull.StartsWith($distRoot + [System.IO.Path]::DirectorySeparatorChar)) {
    throw "Refusing to write outside dist: $stageFull"
  }

  if (-not (Test-Path $manifest)) {
    throw "Missing manifest for target '$currentTarget': $manifest"
  }

  if (Test-Path $stage) {
    Remove-Item -LiteralPath $stage -Recurse -Force
  }

  New-Item -ItemType Directory -Force -Path $stage | Out-Null
  Copy-Item -LiteralPath $manifest -Destination (Join-Path $stage "manifest.json")

  foreach ($item in $items) {
    $source = Join-Path $root $item
    if (Test-Path $source) {
      Copy-Item -LiteralPath $source -Destination $stage -Recurse
    }
  }

  if (Test-Path $zip) {
    Remove-Item -LiteralPath $zip -Force
  }

  New-PortableZip -SourceDirectory $stage -DestinationPath $zip
  Write-Host "Built $zip"
}
