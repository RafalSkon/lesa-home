using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

public class FixOfertaHtml {
    public static void Main() {
        string path = @"c:\LeSa.start\oferta.html";
        string text = File.ReadAllText(path, Encoding.UTF8);
        
        string oldHtml = @"        </table>\s*<!-- TOTALS -->";
        string newHtml = @"        </table>
        
        <div class=""no-print flex justify-start mb-4"">
          <button onclick=""addScopeRow()"" class=""px-4 py-2 bg-orange-100 text-orange-700 font-bold text-xs rounded hover:bg-orange-200 transition-colors flex items-center gap-2"">
            <svg class=""w-4 h-4"" fill=""none"" stroke=""currentColor"" viewBox=""0 0 24 24""><path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M12 4v16m8-8H4""/></svg>
            Dodaj pozycję
          </button>
        </div>

        <!-- TOTALS -->";
        text = Regex.Replace(text, oldHtml, newHtml);
        
        string oldJs = @"      function bindEditableEvents\(\) \{";
        string newJs = @"      function addScopeRow() {
        currentScopeItems.push({ desc: ""Nowa pozycja (kliknij by edytować)"", qty: 1, unit: ""szt."", price: 0 });
        renderScopeTable();
      }

      function bindEditableEvents() {";
        text = Regex.Replace(text, oldJs, newJs);
        
        File.WriteAllText(path, text, Encoding.UTF8);
        Console.WriteLine("Added button.");
    }
}
