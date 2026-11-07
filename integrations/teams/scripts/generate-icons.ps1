$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$packageDir = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\appPackage'))

function New-ColorIcon {
  param([string]$Path)
  $bitmap = New-Object System.Drawing.Bitmap 192, 192
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $red = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(215, 25, 32))
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $graphics.FillEllipse($red, 8, 8, 176, 176)

  $points = New-Object 'System.Collections.Generic.List[System.Drawing.PointF]'
  for ($i = 0; $i -lt 10; $i++) {
    $angle = (-90 + $i * 36) * [Math]::PI / 180
    $radius = if ($i % 2 -eq 0) { 63 } else { 27 }
    $points.Add([System.Drawing.PointF]::new(96 + $radius * [Math]::Cos($angle), 96 + $radius * [Math]::Sin($angle)))
  }
  $graphics.FillPolygon($white, $points.ToArray())
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose(); $bitmap.Dispose(); $red.Dispose(); $white.Dispose()
}

function New-OutlineIcon {
  param([string]$Path)
  $bitmap = New-Object System.Drawing.Bitmap 32, 32
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), 2.2
  $points = New-Object 'System.Collections.Generic.List[System.Drawing.PointF]'
  for ($i = 0; $i -lt 10; $i++) {
    $angle = (-90 + $i * 36) * [Math]::PI / 180
    $radius = if ($i % 2 -eq 0) { 12 } else { 5.2 }
    $points.Add([System.Drawing.PointF]::new(16 + $radius * [Math]::Cos($angle), 16 + $radius * [Math]::Sin($angle)))
  }
  $graphics.DrawPolygon($pen, $points.ToArray())
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose(); $bitmap.Dispose(); $pen.Dispose()
}

New-ColorIcon (Join-Path $packageDir 'color.png')
New-OutlineIcon (Join-Path $packageDir 'outline.png')
Write-Host "Generated Teams icons in $packageDir"
