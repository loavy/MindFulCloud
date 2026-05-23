param(
  [ValidateSet("chrome", "firefox", "all")]
  [string]$Target = "all"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dist = Join-Path $root "dist"
$distRoot = [System.IO.Path]::GetFullPath($dist)
$targets = if ($Target -eq "all") { @("chrome", "firefox") } else { @($Target) }
$items = @("content.js", "preload.js", "README.md", "icons", "popup", "styles")

New-Item -ItemType Directory -Force -Path $dist | Out-Null

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

  Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zip -Force
  Write-Host "Built $zip"
}
