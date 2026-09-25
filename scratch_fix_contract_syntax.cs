using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

public class FixContractJsAgain {
    public static void Main() {
        string path = @"c:\LeSa.start\js\contract-generator.js";
        string text = File.ReadAllText(path, Encoding.UTF8);
        
        text = Regex.Replace(text, @"this\.showToast\(Zapisano umow.*? dla: \);", "this.showToast(`Zapisano umowę dla: ${this.data.clientName}`);");
        
        File.WriteAllText(path, text, Encoding.UTF8);
        Console.WriteLine("Fixed.");
    }
}
