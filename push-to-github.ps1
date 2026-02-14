# Push PalletMS to your GitHub "Pallet" repo
# 1. Set your repo URL below (from GitHub: Code -> HTTPS)
#    Example: https://github.com/YourUsername/Pallet.git
# 2. Run: .\push-to-github.ps1

$repoUrl = "https://github.com/rithesh-bcr/Pallet.git"

Set-Location $PSScriptRoot
git remote add origin $repoUrl 2>$null
git remote set-url origin $repoUrl 2>$null
git push -u origin main
