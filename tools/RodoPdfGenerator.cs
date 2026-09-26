using System;
using System.IO;
using iTextSharp.text;
using iTextSharp.text.pdf;

namespace LeSaRodo
{
    public class FieldCellEvent : IPdfPCellEvent
    {
        private PdfWriter writer;
        private string fieldName;
        private string defaultValue;
        private BaseFont font;
        private float fontSize;
        private bool isMultiline;

        public FieldCellEvent(PdfWriter writer, string fieldName, string defaultValue, BaseFont font, float fontSize, bool isMultiline = false)
        {
            this.writer = writer;
            this.fieldName = fieldName;
            this.defaultValue = defaultValue ?? "";
            this.font = font;
            this.fontSize = fontSize;
            this.isMultiline = isMultiline;
        }

        public void CellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases)
        {
            Rectangle rect = new Rectangle(position.Left + 2, position.Bottom + 2, position.Right - 2, position.Top - 2);
            TextField tf = new TextField(writer, rect, fieldName);
            tf.Font = font;
            tf.FontSize = fontSize;
            tf.Text = defaultValue;
            tf.BorderColor = new BaseColor(203, 213, 225); // Slate 300
            tf.BackgroundColor = new BaseColor(248, 250, 252); // Slate 50
            tf.BorderStyle = PdfBorderDictionary.STYLE_SOLID;
            tf.BorderWidth = 1f;
            if (isMultiline)
            {
                tf.Options = TextField.MULTILINE;
            }
            try
            {
                writer.AddAnnotation(tf.GetTextField());
            }
            catch { }
        }
    }

    public class CheckBoxCellEvent : IPdfPCellEvent
    {
        private PdfWriter writer;
        private string fieldName;
        private bool isChecked;

        public CheckBoxCellEvent(PdfWriter writer, string fieldName, bool isChecked = false)
        {
            this.writer = writer;
            this.fieldName = fieldName;
            this.isChecked = isChecked;
        }

        public void CellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases)
        {
            float size = Math.Min(position.Width, position.Height) - 4f;
            if (size > 14f) size = 14f;
            float x = position.Left + (position.Width - size) / 2f;
            float y = position.Bottom + (position.Height - size) / 2f;
            Rectangle rect = new Rectangle(x, y, x + size, y + size);

            RadioCheckField chk = new RadioCheckField(writer, rect, fieldName, "Yes");
            chk.CheckType = RadioCheckField.TYPE_CHECK;
            chk.BorderColor = new BaseColor(234, 88, 12); // Brand Orange
            chk.BackgroundColor = new BaseColor(255, 255, 255);
            chk.BorderStyle = PdfBorderDictionary.STYLE_SOLID;
            chk.BorderWidth = 1.5f;
            chk.Checked = isChecked;
            try
            {
                writer.AddAnnotation(chk.CheckField);
            }
            catch { }
        }
    }

    public class SignatureCellEvent : IPdfPCellEvent
    {
        private PdfWriter writer;
        private string sigFieldName;
        private string textFieldName;
        private BaseFont font;

        public SignatureCellEvent(PdfWriter writer, string sigFieldName, string textFieldName, BaseFont font)
        {
            this.writer = writer;
            this.sigFieldName = sigFieldName;
            this.textFieldName = textFieldName;
            this.font = font;
        }

        public void CellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases)
        {
            // 1. AcroForm signature field covering top 60% of the box
            float sigHeight = position.Height * 0.65f;
            Rectangle sigRect = new Rectangle(position.Left + 4, position.Top - sigHeight, position.Right - 4, position.Top - 2);

            PdfFormField sigField = PdfFormField.CreateSignature(writer);
            sigField.SetWidget(sigRect, PdfAnnotation.HIGHLIGHT_INVERT);
            sigField.FieldName = sigFieldName;
            sigField.Flags = PdfAnnotation.FLAGS_PRINT;
            try
            {
                writer.AddAnnotation(sigField);
            }
            catch { }

            // 2. Dashed line for manual or stylus signature
            PdfContentByte cb = canvases[PdfPTable.TEXTCANVAS];
            cb.SaveState();
            cb.SetColorStroke(new BaseColor(148, 163, 184)); // Slate 400
            cb.SetLineWidth(1f);
            cb.SetLineDash(4f, 2f);
            cb.MoveTo(position.Left + 10, position.Top - sigHeight + 12);
            cb.LineTo(position.Right - 10, position.Top - sigHeight + 12);
            cb.Stroke();
            cb.RestoreState();

            // 3. Fallback / Alternative text input for typed signature on bottom 30%
            Rectangle textRect = new Rectangle(position.Left + 4, position.Bottom + 4, position.Right - 4, position.Bottom + 20);
            TextField tf = new TextField(writer, textRect, textFieldName);
            tf.Font = font;
            tf.FontSize = 8.5f;
            tf.Text = "";
            tf.BorderColor = new BaseColor(226, 232, 240); // Slate 200
            tf.BackgroundColor = new BaseColor(255, 255, 255);
            tf.BorderStyle = PdfBorderDictionary.STYLE_SOLID;
            tf.BorderWidth = 1f;
            try
            {
                writer.AddAnnotation(tf.GetTextField());
            }
            catch { }
        }
    }

    public class HeaderFooterEvent : PdfPageEventHelper
    {
        private BaseFont fontRegular;
        private BaseFont fontBold;
        private PdfTemplate totalPagesTemplate;
        private string contractNo;

        public HeaderFooterEvent(BaseFont fontRegular, BaseFont fontBold, string contractNo)
        {
            this.fontRegular = fontRegular;
            this.fontBold = fontBold;
            this.contractNo = contractNo ?? "";
        }

        public override void OnOpenDocument(PdfWriter writer, Document document)
        {
            totalPagesTemplate = writer.DirectContent.CreateTemplate(30, 16);
        }

        public override void OnEndPage(PdfWriter writer, Document document)
        {
            PdfContentByte cb = writer.DirectContent;
            int pageNum = writer.PageNumber;

            // Running Header on page 2 and later
            if (pageNum > 1)
            {
                cb.SaveState();
                cb.BeginText();
                cb.SetFontAndSize(fontBold, 8);
                cb.SetColorFill(new BaseColor(15, 23, 42)); // Slate 900
                cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, "LeSa - HOME", document.Left, document.Top + 14, 0);

                cb.SetFontAndSize(fontRegular, 8);
                cb.SetColorFill(new BaseColor(100, 116, 139)); // Slate 500
                string rightHeader = "Załącznik nr 2 do Umowy – Klauzula informacyjna RODO";
                if (!string.IsNullOrEmpty(contractNo))
                {
                    rightHeader += " (" + contractNo + ")";
                }
                cb.ShowTextAligned(PdfContentByte.ALIGN_RIGHT, rightHeader, document.Right, document.Top + 14, 0);
                cb.EndText();

                // Separator line
                cb.SetColorStroke(new BaseColor(226, 232, 240));
                cb.SetLineWidth(0.75f);
                cb.MoveTo(document.Left, document.Top + 8);
                cb.LineTo(document.Right, document.Top + 8);
                cb.Stroke();
                cb.RestoreState();
            }

            // Footer on all pages
            cb.SaveState();
            cb.SetColorStroke(new BaseColor(226, 232, 240)); // Slate 200
            cb.SetLineWidth(0.75f);
            cb.MoveTo(document.Left, document.Bottom - 10);
            cb.LineTo(document.Right, document.Bottom - 10);
            cb.Stroke();

            cb.BeginText();
            cb.SetFontAndSize(fontRegular, 7.5f);
            cb.SetColorFill(new BaseColor(100, 116, 139)); // Slate 500
            cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, "Załącznik nr 2 • Klauzula informacyjna RODO • Wykonawca: LeSa - Home", document.Left, document.Bottom - 22, 0);

            string pageText = "Strona " + pageNum + " z ";
            float len = fontRegular.GetWidthPointKerned(pageText, 7.5f);
            cb.ShowTextAligned(PdfContentByte.ALIGN_RIGHT, pageText, document.Right - 16, document.Bottom - 22, 0);
            cb.EndText();

            // Append total pages template
            cb.AddTemplate(totalPagesTemplate, document.Right - 16, document.Bottom - 22);
            cb.RestoreState();
        }

        public override void OnCloseDocument(PdfWriter writer, Document document)
        {
            totalPagesTemplate.BeginText();
            totalPagesTemplate.SetFontAndSize(fontRegular, 7.5f);
            totalPagesTemplate.SetColorFill(new BaseColor(100, 116, 139));
            totalPagesTemplate.ShowText((writer.PageNumber).ToString());
            totalPagesTemplate.EndText();
        }
    }

    public class Generator
    {
        public static void CreateRodoPdf(string outputPath, string contractNo = "", string clientName = "", string clientCity = "")
        {
            // Margins: Left: 36, Right: 36, Top: 36, Bottom: 42 (A4: 595 x 842 points)
            Document doc = new Document(PageSize.A4, 36f, 36f, 36f, 42f);
            FileStream fs = new FileStream(outputPath, FileMode.Create, FileAccess.Write);
            PdfWriter writer = PdfWriter.GetInstance(doc, fs);

            // Fonts
            BaseFont bfRegular = BaseFont.CreateFont("C:\\Windows\\Fonts\\arial.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            BaseFont bfBold = BaseFont.CreateFont("C:\\Windows\\Fonts\\arialbd.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            BaseFont bfItalic = BaseFont.CreateFont("C:\\Windows\\Fonts\\ariali.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);

            Font fTitleLarge = new Font(bfBold, 12f, Font.BOLD, new BaseColor(15, 23, 42)); // Slate 900
            Font fSubTitle = new Font(bfBold, 9.5f, Font.BOLD, new BaseColor(234, 88, 12)); // Orange 600
            Font fHeading = new Font(bfBold, 9f, Font.BOLD, new BaseColor(15, 23, 42));
            Font fBody = new Font(bfRegular, 8f, Font.NORMAL, new BaseColor(30, 41, 59));
            Font fBodyBold = new Font(bfBold, 8f, Font.BOLD, new BaseColor(30, 41, 59));
            Font fBodySmall = new Font(bfRegular, 7.2f, Font.NORMAL, new BaseColor(71, 85, 105));
            Font fTableHeader = new Font(bfBold, 7.8f, Font.BOLD, BaseColor.WHITE);
            Font fTableCell = new Font(bfRegular, 7.5f, Font.NORMAL, new BaseColor(30, 41, 59));
            Font fTableCellBold = new Font(bfBold, 7.5f, Font.BOLD, new BaseColor(30, 41, 59));

            // Attach Header/Footer Event
            HeaderFooterEvent pageEvent = new HeaderFooterEvent(bfRegular, bfBold, contractNo);
            writer.PageEvent = pageEvent;

            doc.Open();

            // ─────────────────────────────────────────────────────────────
            // PAGE 1: HEADER & BRANDING
            // ─────────────────────────────────────────────────────────────
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.WidthPercentage = 100f;
            headerTable.SetWidths(new float[] { 50f, 50f });
            headerTable.SpacingAfter = 8f;

            // Brand cell (Left)
            PdfPCell cBrand = new PdfPCell();
            cBrand.Border = Rectangle.NO_BORDER;
            cBrand.Padding = 0f;

            Paragraph pBrand = new Paragraph();
            Chunk ch1 = new Chunk("LeSa ", new Font(bfBold, 13f, Font.BOLD, new BaseColor(15, 23, 42)));
            Chunk ch2 = new Chunk("HOME", new Font(bfBold, 13f, Font.BOLD, new BaseColor(234, 88, 12)));
            pBrand.Add(ch1);
            pBrand.Add(ch2);
            cBrand.AddElement(pBrand);

            Paragraph pSlogan = new Paragraph("Nowoczesne Systemy Grzewcze • Instalacje Podłogowe HVAC", new Font(bfRegular, 7.5f, Font.NORMAL, new BaseColor(100, 116, 139)));
            pSlogan.SpacingBefore = 1f;
            cBrand.AddElement(pSlogan);
            headerTable.AddCell(cBrand);

            // Document Title (Right)
            PdfPCell cDocInfo = new PdfPCell();
            cDocInfo.Border = Rectangle.NO_BORDER;
            cDocInfo.Padding = 0f;
            cDocInfo.HorizontalAlignment = Element.ALIGN_RIGHT;

            Paragraph pAtt = new Paragraph("ZAŁĄCZNIK NR 2", new Font(bfBold, 10.5f, Font.BOLD, new BaseColor(234, 88, 12)));
            pAtt.Alignment = Element.ALIGN_RIGHT;
            cDocInfo.AddElement(pAtt);

            Paragraph pSub = new Paragraph("do Umowy o wykonanie instalacji ogrzewania podłogowego – wodnego", new Font(bfRegular, 7.5f, Font.NORMAL, new BaseColor(71, 85, 105)));
            pSub.Alignment = Element.ALIGN_RIGHT;
            cDocInfo.AddElement(pSub);
            headerTable.AddCell(cDocInfo);

            doc.Add(headerTable);

            // Accent rule line
            PdfPTable ruleTable = new PdfPTable(1);
            ruleTable.WidthPercentage = 100f;
            ruleTable.SpacingAfter = 8f;
            PdfPCell cRule = new PdfPCell();
            cRule.Border = Rectangle.NO_BORDER;
            cRule.BackgroundColor = new BaseColor(234, 88, 12);
            cRule.FixedHeight = 2f;
            ruleTable.AddCell(cRule);
            doc.Add(ruleTable);

            // Contract Number Bar (Editable if blank)
            PdfPTable numTable = new PdfPTable(2);
            numTable.WidthPercentage = 100f;
            numTable.SetWidths(new float[] { 22f, 78f });
            numTable.SpacingAfter = 8f;

            PdfPCell cNumLbl = new PdfPCell(new Phrase("Numer Umowy:", new Font(bfBold, 8f, Font.BOLD, new BaseColor(71, 85, 105))));
            cNumLbl.Border = Rectangle.NO_BORDER;
            cNumLbl.VerticalAlignment = Element.ALIGN_MIDDLE;
            numTable.AddCell(cNumLbl);

            PdfPCell cNumInp = new PdfPCell();
            cNumInp.Border = Rectangle.NO_BORDER;
            cNumInp.FixedHeight = 18f;
            cNumInp.CellEvent = new FieldCellEvent(writer, "Numer_Umowy", contractNo, bfBold, 8.5f);
            numTable.AddCell(cNumInp);
            doc.Add(numTable);

            // Document Title Banner
            Paragraph pMainTitle = new Paragraph("KLAUZULA INFORMACYJNA DOTYCZĄCA PRZETWARZANIA DANYCH OSOBOWYCH", fTitleLarge);
            pMainTitle.Alignment = Element.ALIGN_CENTER;
            pMainTitle.SpacingAfter = 6f;
            doc.Add(pMainTitle);

            // Preamble
            Paragraph pPreamble = new Paragraph("Zgodnie z art. 13 Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (dalej: „RODO”), informujemy, że:", fBody);
            pPreamble.SpacingAfter = 8f;
            doc.Add(pPreamble);

            // ─────────────────────────────────────────────────────────────
            // 1. ADMINISTRATOR DANYCH OSOBOWYCH (DANE FIRMY)
            // ─────────────────────────────────────────────────────────────
            Paragraph pSec1 = new Paragraph("1. Administrator danych osobowych", fHeading);
            pSec1.SpacingAfter = 3f;
            doc.Add(pSec1);

            Paragraph pAdmIntro = new Paragraph("Administratorem Państwa danych osobowych jest Wykonawca:", fBody);
            pAdmIntro.SpacingAfter = 4f;
            doc.Add(pAdmIntro);

            // Box with Company Data (pre-filled, professional styling)
            PdfPTable admBox = new PdfPTable(2);
            admBox.WidthPercentage = 100f;
            admBox.SetWidths(new float[] { 50f, 50f });
            admBox.SpacingAfter = 8f;

            // Left Col: Nazwa firmy & Adres
            PdfPCell cAdmLeft = new PdfPCell();
            cAdmLeft.BackgroundColor = new BaseColor(248, 250, 252); // Slate 50
            cAdmLeft.BorderColor = new BaseColor(203, 213, 225); // Slate 300
            cAdmLeft.BorderWidth = 1f;
            cAdmLeft.Padding = 7f;

            Paragraph pCompNameLbl = new Paragraph("NAZWA FIRMY (WYKONAWCA):", new Font(bfBold, 6.8f, Font.BOLD, new BaseColor(234, 88, 12)));
            cAdmLeft.AddElement(pCompNameLbl);
            Paragraph pCompName = new Paragraph("LeSa - Home | Rafał Skowroński", new Font(bfBold, 8.5f, Font.BOLD, new BaseColor(15, 23, 42)));
            pCompName.SpacingAfter = 5f;
            cAdmLeft.AddElement(pCompName);

            Paragraph pAddrLbl = new Paragraph("ADRES SIEDZIBY:", new Font(bfBold, 6.8f, Font.BOLD, new BaseColor(234, 88, 12)));
            cAdmLeft.AddElement(pAddrLbl);
            Paragraph pAddr = new Paragraph("ul. Instalatorów 15, 00-001 Warszawa", new Font(bfRegular, 8f, Font.NORMAL, new BaseColor(30, 41, 59)));
            cAdmLeft.AddElement(pAddr);

            admBox.AddCell(cAdmLeft);

            // Right Col: NIP, Telefon, E-mail
            PdfPCell cAdmRight = new PdfPCell();
            cAdmRight.BackgroundColor = new BaseColor(248, 250, 252);
            cAdmRight.BorderColor = new BaseColor(203, 213, 225);
            cAdmRight.BorderWidth = 1f;
            cAdmRight.Padding = 7f;

            Paragraph pNipLbl = new Paragraph("NIP:", new Font(bfBold, 6.8f, Font.BOLD, new BaseColor(234, 88, 12)));
            cAdmRight.AddElement(pNipLbl);
            Paragraph pNip = new Paragraph("0000000000", new Font(bfBold, 8f, Font.BOLD, new BaseColor(30, 41, 59)));
            pNip.SpacingAfter = 4f;
            cAdmRight.AddElement(pNip);

            Paragraph pContactLbl = new Paragraph("DANE KONTAKTOWE:", new Font(bfBold, 6.8f, Font.BOLD, new BaseColor(234, 88, 12)));
            cAdmRight.AddElement(pContactLbl);
            Paragraph pContact = new Paragraph("Telefon: +48 790 000 000\nE-mail: kontakt@lesa-home.pl", new Font(bfRegular, 8f, Font.NORMAL, new BaseColor(30, 41, 59)));
            cAdmRight.AddElement(pContact);

            admBox.AddCell(cAdmRight);
            doc.Add(admBox);

            // ─────────────────────────────────────────────────────────────
            // 2. KONTAKT W SPRAWACH OCHRONY DANYCH OSOBOWYCH
            // ─────────────────────────────────────────────────────────────
            Paragraph pSec2 = new Paragraph("2. Kontakt w sprawach ochrony danych osobowych", fHeading);
            pSec2.SpacingAfter = 3f;
            doc.Add(pSec2);

            Paragraph pIodText = new Paragraph("We wszystkich sprawach dotyczących przetwarzania danych osobowych mogą Państwo kontaktować się z Administratorem przy użyciu danych kontaktowych wskazanych w pkt 1, a jeżeli Administrator wyznaczył Inspektora Ochrony Danych – również pod poniższym adresem:", fBody);
            pIodText.SpacingAfter = 4f;
            doc.Add(pIodText);

            // IOD interactive field
            PdfPTable iodTable = new PdfPTable(2);
            iodTable.WidthPercentage = 100f;
            iodTable.SetWidths(new float[] { 40f, 60f });
            iodTable.SpacingAfter = 8f;

            PdfPCell cIodLbl = new PdfPCell(new Phrase("Inspektor Ochrony Danych / kontakt (jeżeli dotyczy):", new Font(bfBold, 7.5f, Font.BOLD, new BaseColor(71, 85, 105))));
            cIodLbl.Border = Rectangle.NO_BORDER;
            cIodLbl.VerticalAlignment = Element.ALIGN_MIDDLE;
            iodTable.AddCell(cIodLbl);

            PdfPCell cIodInp = new PdfPCell();
            cIodInp.Border = Rectangle.NO_BORDER;
            cIodInp.FixedHeight = 18f;
            cIodInp.CellEvent = new FieldCellEvent(writer, "IOD_Kontakt", "Nie dotyczy – kontakt bezpośredni z Administratorem", bfRegular, 8f);
            iodTable.AddCell(cIodInp);
            doc.Add(iodTable);

            // ─────────────────────────────────────────────────────────────
            // 3. CELE, PODSTAWY PRAWNE I OKRESY PRZETWARZANIA DANYCH
            // ─────────────────────────────────────────────────────────────
            Paragraph pSec3 = new Paragraph("3. Cele, podstawy prawne i okresy przetwarzania danych", fHeading);
            pSec3.SpacingAfter = 3f;
            doc.Add(pSec3);

            Paragraph pTableIntro = new Paragraph("Państwa dane osobowe przetwarzane są w następujących celach:", fBody);
            pTableIntro.SpacingAfter = 4f;
            doc.Add(pTableIntro);

            // Table with 3 columns
            PdfPTable rodoTable = new PdfPTable(3);
            rodoTable.WidthPercentage = 100f;
            rodoTable.SetWidths(new float[] { 38f, 32f, 30f });
            rodoTable.SpacingAfter = 8f;

            // Headers
            string[] headers = { "Cel przetwarzania", "Podstawa prawna", "Okres przechowywania" };
            foreach (string h in headers)
            {
                PdfPCell th = new PdfPCell(new Phrase(h, fTableHeader));
                th.BackgroundColor = new BaseColor(15, 23, 42); // Slate 900
                th.BorderColor = new BaseColor(30, 41, 59);
                th.Padding = 5f;
                th.HorizontalAlignment = Element.ALIGN_LEFT;
                rodoTable.AddCell(th);
            }

            // Row 1
            AddTableRow(rodoTable,
                "Zawarcie i wykonanie umowy o wykonanie instalacji ogrzewania podłogowego – wodnego, w tym kontakt w sprawach realizacji umowy",
                "art. 6 ust. 1 lit. b) RODO – przetwarzanie niezbędne do wykonania umowy",
                "przez okres obowiązywania umowy oraz do upływu terminu przedawnienia wzajemnych roszczeń",
                fTableCell, false);

            // Row 2
            AddTableRow(rodoTable,
                "Wypełnienie obowiązków prawnych ciążących na Wykonawcy, w tym obowiązków podatkowych i rachunkowych (np. wystawienie i przechowywanie faktur)",
                "art. 6 ust. 1 lit. c) RODO w zw. z przepisami prawa podatkowego i ustawy o rachunkowości",
                "przez okres wymagany właściwymi przepisami prawa (co do zasady 5 lat licząc od końca roku podatkowego, w którym powstał obowiązek podatkowy)",
                fTableCell, true);

            // Row 3
            AddTableRow(rodoTable,
                "Ustalenie, dochodzenie lub obrona przed roszczeniami związanymi z realizacją umowy, w tym z tytułu gwarancji i rękojmi",
                "art. 6 ust. 1 lit. f) RODO – prawnie uzasadniony interes Administratora",
                "do czasu upływu terminu przedawnienia ewentualnych roszczeń, a w przypadku wad objętych gwarancją – przez okres jej trwania i czas niezbędny do rozliczenia zgłoszeń",
                fTableCell, false);

            // Row 4
            AddTableRow(rodoTable,
                "Marketing bezpośredni własnych produktów i usług Wykonawcy (wyłącznie w przypadku wyrażenia odrębnej zgody)",
                "art. 6 ust. 1 lit. a) RODO – zgoda osoby, której dane dotyczą",
                "do czasu wycofania zgody",
                fTableCell, true);

            doc.Add(rodoTable);

            // ─────────────────────────────────────────────────────────────
            // 4. ODBIORCY DANYCH OSOBOWYCH
            // ─────────────────────────────────────────────────────────────
            Paragraph pSec4 = new Paragraph("4. Odbiorcy danych osobowych", fHeading);
            pSec4.SpacingAfter = 3f;
            doc.Add(pSec4);

            Paragraph pRecIntro = new Paragraph("Państwa dane osobowe mogą zostać ujawnione następującym kategoriom odbiorców, w zakresie niezbędnym do realizacji celów wskazanych powyżej:", fBody);
            pRecIntro.SpacingAfter = 3f;
            doc.Add(pRecIntro);

            string[] recipients = {
                "podwykonawcom i innym podmiotom współpracującym przy realizacji umowy (np. ekipom montującym instalację, wykonawcy jastrychu, dostawcom materiałów);",
                "podmiotom świadczącym na rzecz Administratora usługi księgowe, rachunkowe i podatkowe;",
                "podmiotom świadczącym usługi informatyczne, hostingowe oraz obsługującym systemy i oprogramowanie wykorzystywane przez Administratora;",
                "bankom i instytucjom płatniczym – w zakresie niezbędnym do obsługi płatności;",
                "ubezpieczycielowi Administratora – w przypadku zgłoszenia lub likwidacji szkody;",
                "organom publicznym uprawnionym do uzyskania danych na podstawie obowiązujących przepisów prawa (np. organom podatkowym)."
            };

            PdfPTable bulletTable = new PdfPTable(2);
            bulletTable.WidthPercentage = 100f;
            bulletTable.SetWidths(new float[] { 3f, 97f });
            bulletTable.SpacingAfter = 4f;

            foreach (string item in recipients)
            {
                PdfPCell cDot = new PdfPCell(new Phrase("•", new Font(bfBold, 8f, Font.BOLD, new BaseColor(234, 88, 12))));
                cDot.Border = Rectangle.NO_BORDER;
                cDot.PaddingTop = 0f;
                cDot.PaddingBottom = 2f;
                bulletTable.AddCell(cDot);

                PdfPCell cTxt = new PdfPCell(new Phrase(item, fBody));
                cTxt.Border = Rectangle.NO_BORDER;
                cTxt.PaddingTop = 0f;
                cTxt.PaddingBottom = 2f;
                bulletTable.AddCell(cTxt);
            }
            doc.Add(bulletTable);

            Paragraph pThird = new Paragraph("Dane osobowe nie są przekazywane do państw trzecich (poza Europejski Obszar Gospodarczy) ani do organizacji międzynarodowych.", new Font(bfItalic, 7.8f, Font.ITALIC, new BaseColor(71, 85, 105)));
            pThird.SpacingAfter = 4f;
            doc.Add(pThird);

            // ─────────────────────────────────────────────────────────────
            // PAGE 2: RIGHTS, CONSENTS & SIGNATURES
            // ─────────────────────────────────────────────────────────────
            doc.NewPage();

            // 5. PRAWA OSOBY, KTÓREJ DANE DOTYCZĄ
            Paragraph pSec5 = new Paragraph("5. Prawa osoby, której dane dotyczą", fHeading);
            pSec5.SpacingAfter = 3f;
            doc.Add(pSec5);

            Paragraph pRightsIntro = new Paragraph("Przysługuje Państwu prawo do:", fBody);
            pRightsIntro.SpacingAfter = 3f;
            doc.Add(pRightsIntro);

            string[] rights = {
                "dostępu do treści swoich danych osobowych;",
                "sprostowania (poprawiania) danych;",
                "żądania usunięcia danych, w zakresie w jakim nie stoi to w sprzeczności z obowiązkami prawnymi Administratora;",
                "żądania ograniczenia przetwarzania danych;",
                "przenoszenia danych, w zakresie w jakim są one przetwarzane w sposób zautomatyzowany na podstawie zgody lub umowy;",
                "wniesienia sprzeciwu wobec przetwarzania danych opartego na art. 6 ust. 1 lit. f) RODO, z przyczyn związanych z Państwa szczególną sytuacją;",
                "cofnięcia zgody na przetwarzanie danych w dowolnym momencie, bez wpływu na zgodność z prawem przetwarzania dokonanego przed jej cofnięciem – w zakresie, w jakim dane przetwarzane są na podstawie zgody;",
                "wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych, jeżeli uznają Państwo, że przetwarzanie danych narusza przepisy RODO."
            };

            PdfPTable rightsTable = new PdfPTable(2);
            rightsTable.WidthPercentage = 100f;
            rightsTable.SetWidths(new float[] { 3f, 97f });
            rightsTable.SpacingAfter = 8f;

            foreach (string r in rights)
            {
                PdfPCell cDot = new PdfPCell(new Phrase("•", new Font(bfBold, 8f, Font.BOLD, new BaseColor(234, 88, 12))));
                cDot.Border = Rectangle.NO_BORDER;
                cDot.PaddingTop = 0f;
                cDot.PaddingBottom = 2.5f;
                rightsTable.AddCell(cDot);

                PdfPCell cTxt = new PdfPCell(new Phrase(r, fBody));
                cTxt.Border = Rectangle.NO_BORDER;
                cTxt.PaddingTop = 0f;
                cTxt.PaddingBottom = 2.5f;
                rightsTable.AddCell(cTxt);
            }
            doc.Add(rightsTable);

            // 6. INFORMACJA O WYMOGU PODANIA DANYCH
            Paragraph pSec6 = new Paragraph("6. Informacja o wymogu podania danych", fHeading);
            pSec6.SpacingAfter = 2f;
            doc.Add(pSec6);

            Paragraph pSec6Text = new Paragraph("Podanie danych osobowych jest dobrowolne, jednak niezbędne do zawarcia i wykonania umowy. Odmowa podania danych uniemożliwia zawarcie umowy oraz realizację wynikających z niej obowiązków.", fBody);
            pSec6Text.SpacingAfter = 7f;
            doc.Add(pSec6Text);

            // 7. ZAUTOMATYZOWANE PODEJMOWANIE DECYZJI
            Paragraph pSec7 = new Paragraph("7. Zautomatyzowane podejmowanie decyzji", fHeading);
            pSec7.SpacingAfter = 2f;
            doc.Add(pSec7);

            Paragraph pSec7Text = new Paragraph("Państwa dane osobowe nie są przetwarzane w sposób zautomatyzowany, w tym nie podlegają profilowaniu, oraz nie są wykorzystywane do podejmowania decyzji wywołujących wobec Państwa skutki prawne lub w podobny sposób istotnie na Państwa wpływających.", fBody);
            pSec7Text.SpacingAfter = 8f;
            doc.Add(pSec7Text);

            // ─────────────────────────────────────────────────────────────
            // 8. ZGODA NA PRZETWARZANIE DANYCH W CELACH MARKETINGOWYCH
            // ─────────────────────────────────────────────────────────────
            Paragraph pSec8 = new Paragraph("8. Zgoda na przetwarzanie danych w celach marketingowych (opcjonalnie)", fHeading);
            pSec8.SpacingAfter = 3f;
            doc.Add(pSec8);

            // Box with Interactive Checkboxes
            PdfPTable mktTable = new PdfPTable(2);
            mktTable.WidthPercentage = 100f;
            mktTable.SetWidths(new float[] { 5f, 95f });
            mktTable.SpacingAfter = 4f;

            // Checkbox 1: Yes
            PdfPCell cChk1 = new PdfPCell();
            cChk1.Border = Rectangle.NO_BORDER;
            cChk1.FixedHeight = 18f;
            cChk1.CellEvent = new CheckBoxCellEvent(writer, "Zgoda_Marketing_TAK", false);
            mktTable.AddCell(cChk1);

            PdfPCell cLbl1 = new PdfPCell(new Phrase("Wyrażam zgodę na przetwarzanie moich danych osobowych przez Wykonawcę w celu marketingu bezpośredniego jego własnych produktów i usług.", fBodyBold));
            cLbl1.Border = Rectangle.NO_BORDER;
            cLbl1.VerticalAlignment = Element.ALIGN_MIDDLE;
            cLbl1.PaddingBottom = 4f;
            mktTable.AddCell(cLbl1);

            // Checkbox 2: No
            PdfPCell cChk2 = new PdfPCell();
            cChk2.Border = Rectangle.NO_BORDER;
            cChk2.FixedHeight = 18f;
            cChk2.CellEvent = new CheckBoxCellEvent(writer, "Zgoda_Marketing_NIE", false);
            mktTable.AddCell(cChk2);

            PdfPCell cLbl2 = new PdfPCell(new Phrase("Nie wyrażam zgody na przetwarzanie moich danych osobowych w celach marketingowych.", fBody));
            cLbl2.Border = Rectangle.NO_BORDER;
            cLbl2.VerticalAlignment = Element.ALIGN_MIDDLE;
            cLbl2.PaddingBottom = 4f;
            mktTable.AddCell(cLbl2);

            PdfPTable mktBox = new PdfPTable(1);
            mktBox.WidthPercentage = 100f;
            mktBox.SpacingAfter = 8f;
            PdfPCell cMktWrap = new PdfPCell();
            cMktWrap.BackgroundColor = new BaseColor(254, 243, 199); // Amber 100 subtle
            cMktWrap.BorderColor = new BaseColor(245, 158, 11); // Amber 500
            cMktWrap.BorderWidth = 1f;
            cMktWrap.Padding = 6f;
            cMktWrap.AddElement(mktTable);

            Paragraph pMktNote = new Paragraph("Zgoda jest dobrowolna i może zostać w każdym czasie wycofana, bez wpływu na przetwarzanie danych w pozostałych celach wskazanych w niniejszej klauzuli.", fBodySmall);
            cMktWrap.AddElement(pMktNote);
            mktBox.AddCell(cMktWrap);
            doc.Add(mktBox);

            // ─────────────────────────────────────────────────────────────
            // 9. POTWIERDZENIE ZAPOZNANIA SIĘ Z KLAUZULĄ INFORMACYJNĄ
            // ─────────────────────────────────────────────────────────────
            Paragraph pSec9 = new Paragraph("9. Potwierdzenie zapoznania się z klauzulą informacyjną", fHeading);
            pSec9.SpacingAfter = 3f;
            doc.Add(pSec9);

            Paragraph pConfText = new Paragraph("Oświadczam, że zapoznałem/-am się z treścią powyższej klauzuli informacyjnej dotyczącej przetwarzania danych osobowych.", fBody);
            pConfText.SpacingAfter = 6f;
            doc.Add(pConfText);

            // Signature & Date Container (2 Columns)
            PdfPTable signBox = new PdfPTable(2);
            signBox.WidthPercentage = 100f;
            signBox.SetWidths(new float[] { 48f, 52f });
            signBox.SpacingAfter = 8f;

            // Left Col: Place, Date & Client Name
            PdfPCell cSignLeft = new PdfPCell();
            cSignLeft.BackgroundColor = new BaseColor(248, 250, 252);
            cSignLeft.BorderColor = new BaseColor(203, 213, 225);
            cSignLeft.BorderWidth = 1f;
            cSignLeft.Padding = 8f;

            Paragraph pPlaceLbl = new Paragraph("MIEJSCOWOŚĆ I DATA:", new Font(bfBold, 7f, Font.BOLD, new BaseColor(71, 85, 105)));
            pPlaceLbl.SpacingAfter = 2f;
            cSignLeft.AddElement(pPlaceLbl);

            string defaultPlaceDate = "";
            if (!string.IsNullOrEmpty(clientCity))
            {
                defaultPlaceDate = clientCity + ", " + DateTime.Now.ToString("dd.MM.yyyy");
            }
            else
            {
                defaultPlaceDate = "Warszawa, " + DateTime.Now.ToString("dd.MM.yyyy");
            }

            PdfPTable placeInpTable = new PdfPTable(1);
            placeInpTable.WidthPercentage = 100f;
            placeInpTable.SpacingAfter = 6f;
            PdfPCell cPlaceInp = new PdfPCell();
            cPlaceInp.FixedHeight = 20f;
            cPlaceInp.Border = Rectangle.NO_BORDER;
            cPlaceInp.CellEvent = new FieldCellEvent(writer, "Miejscowosc_i_Data", defaultPlaceDate, bfRegular, 9f);
            placeInpTable.AddCell(cPlaceInp);
            cSignLeft.AddElement(placeInpTable);

            Paragraph pClientNameLbl = new Paragraph("IMIĘ I NAZWISKO ZAMAWIAJĄCEGO:", new Font(bfBold, 7f, Font.BOLD, new BaseColor(71, 85, 105)));
            pClientNameLbl.SpacingAfter = 2f;
            cSignLeft.AddElement(pClientNameLbl);

            PdfPTable clientInpTable = new PdfPTable(1);
            clientInpTable.WidthPercentage = 100f;
            clientInpTable.SpacingAfter = 4f;
            PdfPCell cClientInp = new PdfPCell();
            cClientInp.FixedHeight = 20f;
            cClientInp.Border = Rectangle.NO_BORDER;
            cClientInp.CellEvent = new FieldCellEvent(writer, "Imie_Nazwisko_Zamawiajacego", clientName, bfBold, 9f);
            clientInpTable.AddCell(cClientInp);
            cSignLeft.AddElement(clientInpTable);

            Paragraph pMobileHint = new Paragraph("Wskazówka: Plik możesz podpisać bezpośrednio w telefonie lub na komputerze (palcem, rysikiem lub wpisując nazwisko).", new Font(bfItalic, 6.8f, Font.ITALIC, new BaseColor(100, 116, 139)));
            cSignLeft.AddElement(pMobileHint);

            signBox.AddCell(cSignLeft);

            // Right Col: Czytelny podpis Zamawiającego (Interactive Signature Field + Touch Drawing area)
            PdfPCell cSignRight = new PdfPCell();
            cSignRight.BackgroundColor = new BaseColor(255, 255, 255);
            cSignRight.BorderColor = new BaseColor(234, 88, 12); // Brand Orange highlight
            cSignRight.BorderWidth = 1.5f;
            cSignRight.Padding = 8f;
            cSignRight.FixedHeight = 105f;

            Paragraph pSignTitle = new Paragraph("CZYTELNY PODPIS ZAMAWIAJĄCEGO:", new Font(bfBold, 7f, Font.BOLD, new BaseColor(234, 88, 12)));
            pSignTitle.SpacingAfter = 2f;
            cSignRight.AddElement(pSignTitle);

            // Embedded signature layout event
            cSignRight.CellEvent = new SignatureCellEvent(writer, "Podpis_Zamawiajacego_Podpis", "Podpis_Zamawiajacego_Tekst", bfRegular);

            signBox.AddCell(cSignRight);
            doc.Add(signBox);

            // Instructions footer note for mobile signature
            Paragraph pFinalNote = new Paragraph("Instrukcja podpisania: Po wypełnieniu pól i złożeniu podpisu (np. w aplikacji Adobe Acrobat, Apple Pliki lub przeglądarce telefonu) zapisz dokument i odeślij go na adres: kontakt@lesa-home.pl", new Font(bfRegular, 7.5f, Font.NORMAL, new BaseColor(71, 85, 105)));
            pFinalNote.Alignment = Element.ALIGN_CENTER;
            doc.Add(pFinalNote);

            doc.Close();
            fs.Close();
        }

        private static void AddTableRow(PdfPTable table, string col1, string col2, string col3, Font font, bool isAlt)
        {
            BaseColor bg = isAlt ? new BaseColor(248, 250, 252) : BaseColor.WHITE;
            BaseColor borderCol = new BaseColor(226, 232, 240);

            string[] cols = { col1, col2, col3 };
            foreach (string c in cols)
            {
                PdfPCell cell = new PdfPCell(new Phrase(c, font));
                cell.BackgroundColor = bg;
                cell.BorderColor = borderCol;
                cell.BorderWidth = 0.75f;
                cell.Padding = 4.5f;
                cell.VerticalAlignment = Element.ALIGN_TOP;
                table.AddCell(cell);
            }
        }
    }
}
