using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

public class FixDb {
    public static void Main() {
        string path = @"c:\LeSa.start\api\db.php";
        string text = File.ReadAllText(path, Encoding.UTF8);
        
        string oldText = @"    // Migration: Add cad_data to projects table if missing
    $columns = $db->query(""PRAGMA table_info(projects)"")->fetchAll(PDO::FETCH_ASSOC);
    $hasCadData = false;
    foreach ($columns as $col) {
        if ($col['name'] === 'cad_data') {
            $hasCadData = true;
            break;
        }
    }
    if (!$hasCadData) {
        $db->exec(""ALTER TABLE projects ADD COLUMN cad_data TEXT DEFAULT ''"");
    }";
        
        string newText = @"    // Migration: Add cad_data and cad_file to projects table if missing
    $columns = $db->query(""PRAGMA table_info(projects)"")->fetchAll(PDO::FETCH_ASSOC);
    $hasCadData = false;
    $hasCadFile = false;
    foreach ($columns as $col) {
        if ($col['name'] === 'cad_data') {
            $hasCadData = true;
        }
        if ($col['name'] === 'cad_file') {
            $hasCadFile = true;
        }
    }
    if (!$hasCadData) {
        $db->exec(""ALTER TABLE projects ADD COLUMN cad_data TEXT DEFAULT ''"");
    }
    if (!$hasCadFile) {
        $db->exec(""ALTER TABLE projects ADD COLUMN cad_file TEXT DEFAULT ''"");
    }";
    
        text = text.Replace(oldText, newText);
        File.WriteAllText(path, text, Encoding.UTF8);
        Console.WriteLine("Done.");
    }
}
