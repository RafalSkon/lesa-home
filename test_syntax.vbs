Dim sc, fso, f, code
Set fso = CreateObject("Scripting.FileSystemObject")
Set f = fso.OpenTextFile("c:\LeSa.start\test_syntax.js", 1)
code = f.ReadAll()
f.Close()
Set sc = CreateObject("MSScriptControl.ScriptControl")
sc.Language = "JScript"
On Error Resume Next
sc.AddCode code
If Err.Number <> 0 Then
  WScript.Echo "Error line " & Err.Line & ", char " & Err.Column & ": " & Err.Description
Else
  WScript.Echo "Valid syntax"
End If
