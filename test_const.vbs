Dim ie
Set ie = CreateObject("InternetExplorer.Application")
ie.Navigate "c:\LeSa.start\test_const.html"
WScript.Sleep 1000
ie.Quit
