@echo off
set CSC=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe
if not exist "%CSC%" set CSC=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe
set WPF=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\WPF

echo [LeSa Sync] Kompilacja aplikacji z wbudowana ikona...
"%CSC%" /nologo /target:winexe /optimize /win32icon:"%~dp0app.ico" /out:"%~dp0LeSaSync.exe" /lib:"%WPF%" /r:PresentationFramework.dll /r:PresentationCore.dll /r:WindowsBase.dll /r:System.dll /r:System.Core.dll /r:System.Xaml.dll /r:System.Xml.dll /r:System.Drawing.dll /r:System.Web.Extensions.dll "%~dp0Program.cs"

if %ERRORLEVEL% EQU 0 (
    echo [LeSa Sync] Sukces! Utworzono plik: %~dp0LeSaSync.exe
) else (
    echo [LeSa Sync] Blad kompilacji!
)
