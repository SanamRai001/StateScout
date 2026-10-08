param(
  [string]$Source = ".\dist\statescout-icst2027-anonymous",
  [string]$Destination = ".\dist\statescout-icst2027-anonymous.zip"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$sourcePath = (Resolve-Path -LiteralPath $Source).Path.TrimEnd("\", "/")
$destinationPath = [System.IO.Path]::GetFullPath($Destination)
$destinationDirectory = Split-Path -Parent $destinationPath

if (!(Test-Path -LiteralPath $destinationDirectory)) {
  New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
}

if (Test-Path -LiteralPath $destinationPath) {
  Remove-Item -LiteralPath $destinationPath -Force
}

$files = @(
  Get-ChildItem -LiteralPath $sourcePath -Recurse -File |
    Sort-Object FullName
)

if ($files.Count -eq 0) {
  throw "Anonymous artifact directory is empty: $sourcePath"
}

$fixedTimestamp = [DateTimeOffset]::Parse("2000-01-01T00:00:00+00:00")

$fileStream = [System.IO.File]::Open(
  $destinationPath,
  [System.IO.FileMode]::CreateNew,
  [System.IO.FileAccess]::ReadWrite,
  [System.IO.FileShare]::None
)

$archive = New-Object System.IO.Compression.ZipArchive(
  $fileStream,
  [System.IO.Compression.ZipArchiveMode]::Create,
  $false
)

try {
  foreach ($file in $files) {
    $relative = $file.FullName.Substring($sourcePath.Length).TrimStart("\", "/")
    $entryName = $relative.Replace("\", "/")

    if ($entryName.StartsWith("/") -or $entryName -match "^[A-Za-z]:" -or $entryName.Split("/") -contains "..") {
      throw "Unsafe ZIP entry name: $entryName"
    }

    $entry = $archive.CreateEntry(
      $entryName,
      [System.IO.Compression.CompressionLevel]::Optimal
    )
    $entry.LastWriteTime = $fixedTimestamp

    $input = [System.IO.File]::OpenRead($file.FullName)
    $output = $entry.Open()
    try {
      $input.CopyTo($output)
    }
    finally {
      $output.Dispose()
      $input.Dispose()
    }
  }
}
finally {
  $archive.Dispose()
  $fileStream.Dispose()
}

$readArchive = [System.IO.Compression.ZipFile]::OpenRead($destinationPath)
try {
  $badEntries = @(
    $readArchive.Entries |
      Where-Object {
        $_.FullName.Contains("\") -or
        $_.FullName.StartsWith("/") -or
        $_.FullName -match "^[A-Za-z]:" -or
        ($_.FullName.Split("/") -contains "..")
      }
  )

  if ($badEntries.Count -gt 0) {
    $names = ($badEntries | Select-Object -ExpandProperty FullName) -join ", "
    throw "Portable ZIP validation failed. Unsafe/non-portable entries: $names"
  }

  $requiredRoots = @(
    "README.md",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "src/",
    "benchmarks/",
    "tests/",
    "scripts/",
    "research/",
    "results/"
  )

  foreach ($required in $requiredRoots) {
    if ($required.EndsWith("/")) {
      $found = @($readArchive.Entries | Where-Object { $_.FullName.StartsWith($required) }).Count -gt 0
    }
    else {
      $found = @($readArchive.Entries | Where-Object { $_.FullName -eq $required }).Count -eq 1
    }

    if (!$found) {
      throw "Portable ZIP validation failed. Missing required entry/root: $required"
    }
  }

  $entryCount = $readArchive.Entries.Count
}
finally {
  $readArchive.Dispose()
}

$hash = Get-FileHash -LiteralPath $destinationPath -Algorithm SHA256
$sizeBytes = (Get-Item -LiteralPath $destinationPath).Length

Write-Host "StateScout portable anonymous artifact ZIP built"
Write-Host "Source: $sourcePath"
Write-Host "ZIP: $destinationPath"
Write-Host "Entries: $entryCount"
Write-Host "Path separators: portable forward slashes only"
Write-Host "Bytes: $sizeBytes"
Write-Host "SHA256: $($hash.Hash)"
