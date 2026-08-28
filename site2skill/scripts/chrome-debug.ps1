# Chrome dedicado pra CDP (skills /site2skill, /clubinho, /api-mapper, etc).
# Perfil isolado em $env:USERPROFILE\.chrome-cdp-profile — não afeta o Chrome principal.
# Aceita URL como argumento opcional: `chrome-debug https://exemplo.com`
#
# Instalação (1x): adicionar a function abaixo no $PROFILE do PowerShell:
#   notepad $PROFILE
# Cole e salve. Reabra o PowerShell.

function chrome-debug {
    param(
        [string]$Url = "about:blank"
    )

    # Localiza chrome.exe (caminho varia por install)
    $chromeCandidates = @(
        "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "${env:LocalAppData}\Google\Chrome\Application\chrome.exe"
    )
    $chrome = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

    if (-not $chrome) {
        Write-Error "Google Chrome não encontrado. Instale em https://www.google.com/chrome/"
        return
    }

    Start-Process $chrome -ArgumentList @(
        "--user-data-dir=$env:USERPROFILE\.chrome-cdp-profile",
        "--remote-debugging-port=0",
        "--no-first-run",
        "--no-default-browser-check",
        $Url
    )
}
