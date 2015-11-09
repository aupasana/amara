$a = Get-ChildItem .\audio 
$a | foreach { $_.Name }