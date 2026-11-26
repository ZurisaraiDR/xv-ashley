# Renders tools/og-card.html to assets/og.jpg (1200x630 share card for WhatsApp and social apps).
# Needs the preview server running: python tools/serve.py 8090
# Edge headless: https://learn.microsoft.com/en-us/deployedge/microsoft-edge-headless
param([int]$Port = 8090)

$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
$projectRoot = Split-Path $PSScriptRoot -Parent
$screenshot = Join-Path $env:TEMP 'xv-og-card.png'
$profileDir = Join-Path $env:TEMP 'xv-og-edge-profile'   # separate profile: never touches the owner's Edge
$output = Join-Path $projectRoot 'assets\og.jpg'

# --virtual-time-budget gives the Google Fonts time to load before the shot is taken.
& $edge --headless=new --disable-gpu --hide-scrollbars --window-size=1200,630 --virtual-time-budget=8000 `
  "--user-data-dir=$profileDir" "--screenshot=$screenshot" "http://localhost:$Port/tools/og-card.html" | Out-Null

python -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=86, optimize=True)" $screenshot $output
Remove-Item $screenshot
Get-Item $output | Select-Object Name, Length
