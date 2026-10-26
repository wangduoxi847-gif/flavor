param([string]$Path = '.')

Get-ChildItem -LiteralPath $Path -File -ErrorAction Stop |
    Sort-Object Name |
    Select-Object Name, Length
