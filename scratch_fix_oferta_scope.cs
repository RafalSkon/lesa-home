using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

public class FixOfertaScope {
    public static void Main() {
        string path = @"c:\LeSa.start\oferta.html";
        string text = File.ReadAllText(path, Encoding.UTF8);
        
        string oldJs = @"      // Inicjalizacja domy(ś|)lnego zakresu prac
      let currentScopeItems = \[
        \{ desc: ""Wykonanie izolacji cieplnej ze styropianu EPS \(uk(ł|)adu"", qty: 1, unit: ""us(ł|)uga"", price: 500 \}
      \];";
      
        string newJs = @"      // Inicjalizacja domyślnego zakresu prac
      let currentScopeItems = [
        { desc: ""Wykonanie izolacji cieplnej ze styropianu EPS (układanie)"", qty: 140, unit: ""m²"", price: 20 },
        { desc: ""Dostawa i montaż folii refleksyjnej oraz siatki Tacker"", qty: 140, unit: ""m²"", price: 10 },
        { desc: ""Ułożenie rur ogrzewania podłogowego (wg projektu CAD)"", qty: 1200, unit: ""mb"", price: 5 },
        { desc: ""Dostawa i montaż rozdzielaczy ogrzewania podłogowego + szafki"", qty: 2, unit: ""kpl"", price: 1250 },
        { desc: ""Próba ciśnieniowa i odpowietrzenie układu"", qty: 1, unit: ""usługa"", price: 500 }
      ];";
        
        text = Regex.Replace(text, oldJs, newJs);
        File.WriteAllText(path, text, Encoding.UTF8);
        Console.WriteLine("Fixed currentScopeItems.");
    }
}
