# Saves a screenshot of a screen region to a PNG, without touching any window
# (unlike screenshot tools that hide or activate windows first).
#
#   powershell -NoProfile -File scripts/screenshot.ps1 -Out shot.png [-X -2560 -Y 0 -Width 2560 -Height 1440]

param(
  [Parameter(Mandatory)] [string]$Out,
  [int]$X = 0,
  [int]$Y = 0,
  [int]$Width = 0,
  [int]$Height = 0
)

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

if ($Width -eq 0 -or $Height -eq 0) {
  $bounds = [Windows.Forms.SystemInformation]::VirtualScreen
  $X = $bounds.X; $Y = $bounds.Y; $Width = $bounds.Width; $Height = $bounds.Height
}

$bitmap = New-Object Drawing.Bitmap($Width, $Height)
$graphics = [Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($X, $Y, 0, 0, $bitmap.Size)
$bitmap.Save($Out, [Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose(); $bitmap.Dispose()
"saved $Out ($Width x $Height at $X,$Y)"
