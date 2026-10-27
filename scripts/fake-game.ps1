# Stand-in "game" window for testing the overlay without Path of Exile.
# Ctrl+C puts item text on the clipboard, like the game does for a hovered item. Ctrl+F opens a
# stash search box like the game's (Enter shows what was searched); nothing else reacts to keys,
# so stray test input cannot change anything. The item file is read on every Ctrl+C: overwrite
# it to check another item without restarting.
#
#   powershell -STA -File scripts/fake-game.ps1 [-ItemFile <path>] [-X <left>] [-Y <top>]
#   then run the app with POE_GAME_TITLE="PoE Fake Game" and `npm run dev` (see src-tauri/src/constants.rs).

param(
  [string]$ItemFile = (Join-Path $PSScriptRoot 'fake-game-item.txt'),
  [int]$X = 100,
  [int]$Y = 100,
  [int]$Width = 1600,
  [int]$Height = 900
)

# Hide our own console instead of starting hidden: -WindowStyle Hidden would hide the form too.
Add-Type -Name Console -Namespace FakeGame -MemberDefinition @'
[DllImport("kernel32.dll")] public static extern IntPtr GetConsoleWindow();
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
'@
[void][FakeGame.Console]::ShowWindow([FakeGame.Console]::GetConsoleWindow(), 0)

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
$search = New-Object Windows.Forms.TextBox
$search.Dock = 'Top'
$search.Font = New-Object Drawing.Font('Consolas', 14)
$search.Visible = $false
$form.Controls.Add($label)
$form.Controls.Add($search)
$searched = ''

function Update-Label {
  $text = "PoE Fake Game - hover anywhere and press the price check hotkey.`r`nCtrl+C copies:`r`n`r`n$item"
  if ($searched) { $text = "Stash search: $searched`r`n`r`n$text" }
  $label.Text = $text
}

$search.Add_KeyDown({
  param($sender, $e)
  if ($e.KeyCode -eq 'Return') {
    $script:searched = $search.Text
    $search.Visible = $false
    $form.Focus()
    Update-Label
    $e.Handled = $true
    $e.SuppressKeyPress = $true
  }
})

$form.Add_KeyDown({
  param($sender, $e)
  if ($e.Control -and $e.KeyCode -eq 'C') {
    $script:item = [IO.File]::ReadAllText($ItemFile)
    [Windows.Forms.Clipboard]::SetText($item)
    $e.Handled = $true
  } elseif ($e.Control -and $e.KeyCode -eq 'F') {
    $search.Visible = $true
    $search.SelectAll()
    $search.Focus()
    $e.Handled = $true
  }
})

[Windows.Forms.Application]::Run($form)
