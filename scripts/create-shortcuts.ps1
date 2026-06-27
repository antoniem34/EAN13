param(
  [switch]$StartMenuOnly,
  [switch]$DesktopOnly
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$launcherPath = Join-Path $projectRoot "iniciar-ean13.bat"
$assetsDir = Join-Path $projectRoot "assets"
$iconPath = Join-Path $assetsDir "ean13.ico"
$shortcutName = "Generador EAN-13 SVG.lnk"

if (-not (Test-Path $launcherPath)) {
  throw "No se encontro el lanzador: $launcherPath"
}

New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null

function New-Ean13Icon {
  param([string]$OutputPath)

  Add-Type -AssemblyName System.Drawing

  $bitmap = New-Object System.Drawing.Bitmap 256, 256
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::FromArgb(18, 107, 100))

  $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $blackBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(18, 18, 18))
  $goldBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200, 157, 45))
  $font = New-Object System.Drawing.Font "Arial", 28, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)

  $graphics.FillRectangle($whiteBrush, 34, 38, 188, 180)
  $graphics.FillRectangle($goldBrush, 34, 38, 188, 14)

  $bars = @(8, 3, 2, 6, 2, 4, 7, 2, 2, 5, 3, 8, 2, 6, 3, 3, 8, 2, 4, 6, 2, 7, 3, 4)
  $x = 52
  foreach ($barWidth in $bars) {
    $graphics.FillRectangle($blackBrush, $x, 72, $barWidth, 94)
    $x += $barWidth + 4
  }

  $graphics.DrawString("EAN", $font, $blackBrush, 73, 174)

  $pngStream = New-Object System.IO.MemoryStream
  $bitmap.Save($pngStream, [System.Drawing.Imaging.ImageFormat]::Png)
  $pngBytes = $pngStream.ToArray()

  $fileStream = [System.IO.File]::Create($OutputPath)
  $writer = New-Object System.IO.BinaryWriter $fileStream
  $writer.Write([UInt16]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]1)
  $writer.Write([byte]0)
  $writer.Write([byte]0)
  $writer.Write([byte]0)
  $writer.Write([byte]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]32)
  $writer.Write([UInt32]$pngBytes.Length)
  $writer.Write([UInt32]22)
  $writer.Write($pngBytes)
  $writer.Close()

  $pngStream.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

function New-AppShortcut {
  param(
    [string]$Path,
    [string]$TargetPath,
    [string]$WorkingDirectory,
    [string]$IconPath
  )

  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($Path)
  $shortcut.TargetPath = $TargetPath
  $shortcut.WorkingDirectory = $WorkingDirectory
  $shortcut.IconLocation = "$IconPath,0"
  $shortcut.Description = "Generador de codigos de barras EAN-13 en SVG"
  $shortcut.Save()
}

New-Ean13Icon -OutputPath $iconPath

$created = @()

if (-not $StartMenuOnly) {
  $desktopPath = [Environment]::GetFolderPath("Desktop")
  if ([string]::IsNullOrWhiteSpace($desktopPath)) {
    $desktopPath = Join-Path $env:USERPROFILE "Desktop"
  }

  $desktopShortcut = Join-Path $desktopPath $shortcutName
  New-AppShortcut -Path $desktopShortcut -TargetPath $launcherPath -WorkingDirectory $projectRoot -IconPath $iconPath
  $created += $desktopShortcut
}

if (-not $DesktopOnly) {
  $startMenuPath = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs"
  New-Item -ItemType Directory -Path $startMenuPath -Force | Out-Null

  $startMenuShortcut = Join-Path $startMenuPath $shortcutName
  New-AppShortcut -Path $startMenuShortcut -TargetPath $launcherPath -WorkingDirectory $projectRoot -IconPath $iconPath
  $created += $startMenuShortcut
}

$created | ForEach-Object { "Creado: $_" }
