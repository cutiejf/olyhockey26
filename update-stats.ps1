# Olympics Stats Scraper - Updates data.json with latest player and goalie stats from QuantHockey
# Run: .\update-stats.ps1

$headers = @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
$dataPath = Join-Path $PSScriptRoot "data.json"

# Load existing data.json
$data = Get-Content $dataPath -Raw | ConvertFrom-Json

Write-Host "Fetching player stats..." -ForegroundColor Cyan

# Scrape players (sorted by points)
$playersHtml = (Invoke-WebRequest -Uri "https://www.quanthockey.com/olympics/en/seasons/olympics-players-stats.html" -Headers $headers -UseBasicParsing).Content
$players = [regex]::Matches($playersHtml, '<tr class="(odd|even)[^"]*"[^>]*>[\s\S]*?</tr>') | ForEach-Object {
    $text = $_.Value -replace '<[^>]+>', ' ' -replace '\s+', ' '
    $parts = $text.Trim() -split '\s+'
    @{
        Name = "$($parts[1]) $($parts[2])"
        Team = $parts[3]
        GP = $parts[5]
        Goals = $parts[6]
        Assists = $parts[7]
        Points = [int]$parts[8]
    }
} | Sort-Object { $_.Points } -Descending | Select-Object -First 5

Write-Host "Fetching goalie stats..." -ForegroundColor Cyan

# Scrape goalies (sorted by SV%)
$goaliesHtml = (Invoke-WebRequest -Uri "https://www.quanthockey.com/olympics/en/seasons/olympics-goalies-stats.html" -Headers $headers -UseBasicParsing).Content
$goalies = [regex]::Matches($goaliesHtml, '<tr class="(odd|even)[^"]*"[^>]*>[\s\S]*?</tr>') | ForEach-Object {
    $text = $_.Value -replace '<[^>]+>', ' ' -replace '\s+', ' '
    $parts = $text.Trim() -split '\s+'
    @{
        Name = "$($parts[1]) $($parts[2])"
        Team = $parts[3]
        GP = $parts[5]
        GAA = $parts[6]
        SVP = [double]$parts[7]
        Wins = $parts[8]
    }
} | Sort-Object { $_.SVP } -Descending | Select-Object -First 5

# Build new storedESPNStats
$rank = 1
$scorersArray = @()
foreach ($p in $players) {
    $scorersArray += @{
        rank = "$rank."
        name = $p.Name
        team = $p.Team
        gp = $p.GP
        goals = $p.Goals
        assists = $p.Assists
        points = "$($p.Points)"
    }
    $rank++
}

$rank = 1
$goaliesArray = @()
foreach ($g in $goalies) {
    $goaliesArray += @{
        rank = "$rank."
        name = $g.Name
        team = $g.Team
        gp = $g.GP
        wins = $g.Wins
        gaa = $g.GAA
        svp = ".$(($g.SVP * 1000).ToString('000'))"
    }
    $rank++
}

# Update the data object
$data.storedESPNStats = @{
    scorers = $scorersArray
    goalies = $goaliesArray
    lastFetch = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
}

# Save back to data.json
$data | ConvertTo-Json -Depth 10 | Set-Content $dataPath -Encoding UTF8

Write-Host "`nTop 5 Scorers:" -ForegroundColor Green
$scorersArray | ForEach-Object { Write-Host "  $($_.rank) $($_.name) ($($_.team)) - $($_.points) pts" }

Write-Host "`nTop 5 Goalies:" -ForegroundColor Green
$goaliesArray | ForEach-Object { Write-Host "  $($_.rank) $($_.name) ($($_.team)) - SV%: $($_.svp)" }

Write-Host "`ndata.json updated!" -ForegroundColor Yellow
