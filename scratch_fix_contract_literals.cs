using System;
using System.IO;
using System.Text;

public class FixContractJs {
    public static void Main() {
        string path = @"c:\LeSa.start\js\contract-generator.js";
        string text = File.ReadAllText(path, Encoding.UTF8);
        
        text = text.Replace(@"this.updateDraftsBadge();\n    this.initDbProjectSelector();\n  },", "this.updateDraftsBadge();\r\n    this.initDbProjectSelector();\r\n  },");
        
        // Let's also restore the 'Zapisano umowę dla: ' which was corrupted earlier today by my bad encoding script
        text = text.Replace(@"this.showToast(Zapisano umow dla: );", "this.showToast(`Zapisano umowę dla: ${this.data.clientName}`);");
        text = text.Replace(@"this.showToast('Wyczyszczono histori umw.');", "this.showToast('Wyczyszczono historię umów.');");
        text = text.Replace(@"this.showToast('?? Skopiowano tre umowy do schowka!');", "this.showToast('📋 Skopiowano treść umowy do schowka!');");
        text = text.Replace(@"this.showToast('Nie udao si skopiowa automatycznie.');", "this.showToast('Nie udało się skopiować automatycznie.');");
        
        File.WriteAllText(path, text, Encoding.UTF8);
    }
}
