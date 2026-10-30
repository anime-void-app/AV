$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
Set-Location -LiteralPath $root
if (!(Test-Path -LiteralPath (Join-Path $root 'profile-catalog.json'))) { throw 'Run this tool inside the AV website folder after installing v17.3.' }
$catalogText = Get-Content -LiteralPath (Join-Path $root 'profile-catalog.json') -Raw -Encoding UTF8
$catalog = $catalogText | ConvertFrom-Json
if ($catalog.version -ne '17.3') { throw 'The new v17.3 catalog is not installed. Nothing deleted.' }
$galleryText = Get-Content -LiteralPath (Join-Path $root 'visual-gallery.json') -Raw -Encoding UTF8
$avatarText = Get-Content -LiteralPath (Join-Path $root 'visual-avatars.json') -Raw -Encoding UTF8
if (!(Test-Path -LiteralPath (Join-Path $root 'studio/atelier/healer.webp'))) { throw 'New artwork files are missing. Nothing deleted.' }
$obsolete = @'
[
  "studio/aurora.svg",
  "studio/banners/autumn-letter.svg",
  "studio/banners/cosmic-pilot.svg",
  "studio/banners/dusk-duo.webp",
  "studio/banners/ember-knight.svg",
  "studio/banners/immortal-promise.webp",
  "studio/banners/lantern-road.svg",
  "studio/banners/moon-witch.svg",
  "studio/banners/neon-heart.svg",
  "studio/banners/ocean-singer.svg",
  "studio/banners/rainy-window.svg",
  "studio/banners/red-ronin.svg",
  "studio/banners/sakura-muse.svg",
  "studio/banners/sky-dragon.svg",
  "studio/banners/star-promise.svg",
  "studio/cinema/alley-thumb.jpg",
  "studio/cinema/alley.webp",
  "studio/cinema/balcony-thumb.jpg",
  "studio/cinema/balcony.webp",
  "studio/cinema/bamboo-thumb.jpg",
  "studio/cinema/bamboo.webp",
  "studio/cinema/beach-thumb.jpg",
  "studio/cinema/beach.webp",
  "studio/cinema/bridge-thumb.jpg",
  "studio/cinema/bridge.webp",
  "studio/cinema/cafe-thumb.jpg",
  "studio/cinema/cafe.webp",
  "studio/cinema/celestial.svg",
  "studio/cinema/city-thumb.jpg",
  "studio/cinema/city.webp",
  "studio/cinema/clouds-thumb.jpg",
  "studio/cinema/clouds.webp",
  "studio/cinema/crossing-thumb.jpg",
  "studio/cinema/crossing.webp",
  "studio/cinema/eclipse.svg",
  "studio/cinema/emerald.svg",
  "studio/cinema/gazebo-thumb.jpg",
  "studio/cinema/gazebo.webp",
  "studio/cinema/glacier.svg",
  "studio/cinema/inferno.svg",
  "studio/cinema/konbini-thumb.jpg",
  "studio/cinema/konbini.webp",
  "studio/cinema/lake-thumb.jpg",
  "studio/cinema/lake.webp",
  "studio/cinema/matrix.svg",
  "studio/cinema/paddy-thumb.jpg",
  "studio/cinema/paddy.webp",
  "studio/cinema/railway-thumb.jpg",
  "studio/cinema/railway.webp",
  "studio/cinema/rooftop-thumb.jpg",
  "studio/cinema/rooftop.webp",
  "studio/cinema/sakura-thumb.jpg",
  "studio/cinema/sakura.webp",
  "studio/cinema/sea-thumb.jpg",
  "studio/cinema/sea.webp",
  "studio/cinema/shrine-thumb.jpg",
  "studio/cinema/shrine.webp",
  "studio/cinema/singularity.svg",
  "studio/cinema/snowlamp-thumb.jpg",
  "studio/cinema/snowlamp.webp",
  "studio/cinema/spring-thumb.jpg",
  "studio/cinema/spring.webp",
  "studio/cinema/stairs-thumb.jpg",
  "studio/cinema/stairs.webp",
  "studio/cinema/station-thumb.jpg",
  "studio/cinema/station.webp",
  "studio/cinema/synthwave.svg",
  "studio/cinema/temple-thumb.jpg",
  "studio/cinema/temple.webp",
  "studio/cinema/torii-thumb.jpg",
  "studio/cinema/torii.webp",
  "studio/city.svg",
  "studio/forest.svg",
  "studio/library.svg",
  "studio/ocean.svg",
  "studio/orbit.svg",
  "studio/sakura.svg",
  "studio/shrine.svg",
  "studio/void.svg"
]
'@ | ConvertFrom-Json
Write-Host 'This removes ONLY 79 obsolete decorative image files. It does not remove avatars, code or user progress.'
Write-Host 'Install and test v17.3 first. After cleanup, commit the deletions to GitHub.'
$answer = Read-Host 'Type DELETE to continue, anything else cancels'
if ($answer -cne 'DELETE') { Write-Host 'Cancelled. Nothing deleted.'; exit 0 }
$count = 0
foreach ($rel in $obsolete) {
 if ($rel -notmatch '^studio/([a-zA-Z0-9_-]+/)?[a-zA-Z0-9_-]+\.(svg|webp|jpg)$' -or $rel -match 'avatars') { throw 'Unexpected filename. Stopping.' }
 if ($catalogText.Contains($rel) -or $galleryText.Contains($rel) -or $avatarText.Contains($rel)) { throw ('File still referenced; stopping: ' + $rel) }
 $target = Join-Path $root $rel
 if (Test-Path -LiteralPath $target -PathType Leaf) { Remove-Item -LiteralPath $target -Force; $count++ }
}
Write-Host ('Removed files: ' + $count)
Write-Host 'Now commit deleted files in VS Code. Do not clear browser site data.'
