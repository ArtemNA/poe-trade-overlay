# Stand-in "game" window for testing the overlay without Path of Exile.
# Ctrl+C puts item text on the clipboard, like the game does for a hovered item; nothing else
# reacts to keys, so stray test input cannot change anything.
#
#   powershell -STA -File scripts/fake-game.ps1 [-ItemFile <path>] [-X <left>] [-Y <top>]
#   then run the app with POE_GAME_TITLE="PoE Fake Game" (see src-tauri/src/constants.rs).

param(
  [string]$ItemFile = (Join-Path $PSScriptRoot 'fake-game-item.txt'),
  [int]$X = 100,
  [int]$Y = 100,
  [int]$Width = 1600,
  [int]$Height = 900
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$item = [IO.File]::ReadAllText($ItemFile)

$form = New-Object Windows.Forms.Form
$form.Text = 'PoE Fake Game'
$form.StartPosition = 'Manual'
$form.Location = New-Object Drawing.Point($X, $Y)
$form.Size = New-Object Drawing.Size($Width, $Height)
$form.BackColor = [Drawing.Color]::FromArgb(26, 19, 13)
$form.KeyPreview = $true

$label = New-Object Windows.Forms.Label
$label.Dock = 'Fill'
$label.ForeColor = [Drawing.Color]::FromArgb(180, 154, 114)
$label.Font = New-Object Drawing.Font('Consolas', 11)
$label.Text = "PoE Fake Game - hover anywhere and press the price check hotkey.`r`nCtrl+C copies:`r`n`r`n$item"
$form.Controls.Add($label)

$form.Add_KeyDown({
  param($sender, $e)
  if ($e.Control -and $e.KeyCode -eq 'C') {
    [Windows.Forms.Clipboard]::SetText($item)
    $e.Handled = $true
  }
})

[Windows.Forms.Application]::Run($form)
