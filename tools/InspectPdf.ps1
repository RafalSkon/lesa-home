Add-Type -Path 'c:\LeSa.start\tools\bin\itextsharp.dll'
$pdf = New-Object iTextSharp.text.pdf.PdfReader('c:\LeSa.start\edge_test.pdf')
Write-Host "Total Pages: $($pdf.NumberOfPages)"
for ($i = 1; $i -le $pdf.NumberOfPages; $i++) {
    $strategy = New-Object iTextSharp.text.pdf.parser.SimpleTextExtractionStrategy
    $text = [iTextSharp.text.pdf.parser.PdfTextExtractor]::GetTextFromPage($pdf, $i, $strategy)
    Write-Host "=== PAGE $i (chars: $($text.Trim().Length)) ==="
    $lines = $text.Trim().Split("`n") | Where-Object { $_.Trim().Length -gt 0 }
    Write-Host "START: $(($lines | Select-Object -First 2) -join ' // ')"
    Write-Host "END:   $(($lines | Select-Object -Last 2) -join ' // ')"
}
$pdf.Close()