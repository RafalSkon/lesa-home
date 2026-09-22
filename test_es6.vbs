Dim sc
Set sc = CreateObject("MSScriptControl.ScriptControl")
sc.Language = "JScript"
On Error Resume Next
sc.AddCode "function test(a = 1) {}"
If Err.Number <> 0 Then
  WScript.Echo "Error: " & Err.Description
Else
  WScript.Echo "Valid syntax"
End If
