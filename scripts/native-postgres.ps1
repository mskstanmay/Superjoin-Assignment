param(
  [ValidateSet('start','stop')][string]$Action = 'start',
  [string]$BinDirectory = '',
  [int]$Port = 55432
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $BinDirectory) { $BinDirectory = Join-Path $projectRoot '.local-tools/pg-runtime/pgsql/bin' }
$pgBin = (Resolve-Path -LiteralPath $BinDirectory).Path
$pgData = Join-Path $projectRoot '.runtime/postgres-data'
$pgLog = Join-Path $projectRoot '.runtime/postgres.log'
if ($Action -eq 'stop') {
  & (Join-Path $pgBin 'pg_ctl.exe') -D $pgData -w stop
  if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL stop failed' }
  exit
}
$envFile = Join-Path $projectRoot '.env'
if (-not (Test-Path -LiteralPath $envFile)) { throw 'Run node scripts/init-native-env.mjs first' }
$localValues = @{}
foreach ($line in Get-Content -LiteralPath $envFile) {
  if ($line -match '^([A-Z_]+)=(.*)$') { $localValues[$Matches[1]] = $Matches[2] }
}
$pgUser = $localValues['POSTGRES_USER']
$pgDatabase = $localValues['POSTGRES_DB']
$pgPassword = $localValues['POSTGRES_PASSWORD']
if (-not $pgUser -or -not $pgDatabase -or -not $pgPassword -or $pgPassword -like 'CHANGE_ME*') { throw 'Set PostgreSQL values in .env' }
if ($pgDatabase -notmatch '^[a-z_][a-z0-9_]*$') { throw 'Native helper requires a simple lowercase database identifier' }
New-Item -ItemType Directory -Force -Path (Join-Path $projectRoot '.runtime') | Out-Null
if (-not (Test-Path -LiteralPath (Join-Path $pgData 'PG_VERSION'))) {
  $passwordFile = Join-Path $projectRoot '.runtime/initdb-password.txt'
  try {
    [IO.File]::WriteAllText($passwordFile, $pgPassword)
    & (Join-Path $pgBin 'initdb.exe') -D $pgData -U $pgUser --auth=scram-sha-256 --encoding=UTF8 --locale=C --pwfile=$passwordFile
    if ($LASTEXITCODE -ne 0) { throw 'initdb failed' }
  } finally {
    if (Test-Path -LiteralPath $passwordFile) { Remove-Item -LiteralPath $passwordFile }
  }
}
& (Join-Path $pgBin 'pg_ctl.exe') -D $pgData status *> $null
if ($LASTEXITCODE -ne 0) {
  & (Join-Path $pgBin 'pg_ctl.exe') -D $pgData -l $pgLog -o "-p $Port -h 127.0.0.1" -w start
  if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL start failed' }
}
$previousPgPassword = $env:PGPASSWORD
try {
  $env:PGPASSWORD = $pgPassword
  $databaseExists = & (Join-Path $pgBin 'psql.exe') -h 127.0.0.1 -p $Port -U $pgUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$pgDatabase'"
  if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL connectivity failed' }
  if ($databaseExists -ne '1') {
    & (Join-Path $pgBin 'createdb.exe') -h 127.0.0.1 -p $Port -U $pgUser $pgDatabase
    if ($LASTEXITCODE -ne 0) { throw 'Database creation failed' }
  }
} finally { $env:PGPASSWORD = $previousPgPassword }
Write-Output "Native PostgreSQL is ready on 127.0.0.1:$Port"
