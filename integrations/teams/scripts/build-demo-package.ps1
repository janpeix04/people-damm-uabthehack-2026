$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$packageDir = Join-Path $root 'appPackage'
$staging = Join-Path $root '.package-demo'
$output = Join-Path $root 'escolta-damm-teams-demo.zip'

if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null
Copy-Item -LiteralPath (Join-Path $packageDir 'manifest.demo.json') -Destination (Join-Path $staging 'manifest.json')
Copy-Item -LiteralPath (Join-Path $packageDir 'color.png') -Destination $staging
Copy-Item -LiteralPath (Join-Path $packageDir 'outline.png') -Destination $staging
if (Test-Path -LiteralPath $output) { Remove-Item -LiteralPath $output -Force }
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $output
Remove-Item -LiteralPath $staging -Recurse -Force
Write-Host "Built $output"
