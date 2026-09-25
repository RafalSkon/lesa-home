using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

public class FixContractGenClient {
    public static void Main() {
        string path = @"c:\LeSa.start\js\contract-generator.js";
        string text = File.ReadAllText(path, Encoding.UTF8);
        
        string oldContent = @"          this\.data\.clientName = project\.clientName \|\| '';\s+this\.data\.clientAddress = project\.clientAddress \|\| '';\s+this\.data\.investmentAddress = project\.investmentAddress \|\| project\.clientAddress \|\| '';";
        string newContent = @"          this.data.clientName = project.clientName || '';
          this.data.clientAddress = project.clientAddress || '';
          this.data.investmentAddress = project.investmentAddress || project.clientAddress || '';
          this.data.clientNip = project.clientNip ? `NIP: ${project.clientNip}` : '';
          this.data.clientPesel = project.clientPesel || '';
          this.data.clientIdCard = project.clientIdCard || '';
          this.data.clientPhone = project.clientPhone || '';
          this.data.clientEmail = project.clientEmail || '';
          if (project.clientNip) {
              this.data.contractType = 'B2B';
          } else {
              this.data.contractType = 'B2C';
          }";

        string replaced = Regex.Replace(text, oldContent, newContent);
        
        File.WriteAllText(path, replaced, Encoding.UTF8);
        Console.WriteLine("Client map fixed.");
    }
}
