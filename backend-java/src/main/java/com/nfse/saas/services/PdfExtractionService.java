package com.nfse.saas.services;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.HashMap;
import java.util.Map;

@Service
public class PdfExtractionService {

    public String extractTextFromPdf(File pdfFile) throws IOException {
        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    public Map<String, Object> parseNfseData(String rawText) {
        Map<String, Object> data = new HashMap<>();
        data.put("raw_text", rawText);
        data.put("total_value", 0.0);

        String cleanText = rawText.toUpperCase();

        // Extract Invoice Number
        Pattern numberPattern = Pattern.compile("(?:N[UÚ]MERO DA NOTA|NOTA FISCAL N[°ºO]|NFS-E N[°ºO])\\s*:?\\s*(\\d+)");
        Matcher numberMatcher = numberPattern.matcher(cleanText);
        if (numberMatcher.find()) {
            data.put("invoice_number", numberMatcher.group(1));
        } else {
            Pattern danfePattern = Pattern.compile("\\b(\\d{9})\\b");
            Matcher danfeMatcher = danfePattern.matcher(cleanText);
            if (danfeMatcher.find()) {
                data.put("invoice_number", danfeMatcher.group(1));
            }
        }

        // Extract CNPJ
        Pattern cnpjPattern = Pattern.compile("\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}");
        Matcher cnpjMatcher = cnpjPattern.matcher(cleanText);
        if (cnpjMatcher.find()) {
            data.put("issuer_cnpj", cnpjMatcher.group());
        }

        // Extract Total Value
        Pattern valuePattern = Pattern.compile("\\b(\\d{1,3}(?:\\.\\d{3})*,\\d{2})\\b");
        Matcher valueMatcher = valuePattern.matcher(cleanText);
        double maxVal = 0.0;
        while (valueMatcher.find()) {
            String valStr = valueMatcher.group(1).replace(".", "").replace(",", ".");
            try {
                double val = Double.parseDouble(valStr);
                if (val > maxVal) maxVal = val;
            } catch (Exception e) {}
        }
        if (maxVal > 0.0) data.put("total_value", maxVal);

        // Extract Date
        Pattern datePattern = Pattern.compile("\\b(\\d{2}/\\d{2}/\\d{4})\\b");
        Matcher dateMatcher = datePattern.matcher(cleanText);
        if (dateMatcher.find()) {
            data.put("issue_date", dateMatcher.group(1));
        }

        // Extract Description
        if (cleanText.contains("NATUREZA DA OPERA")) {
            String[] split = cleanText.split("NATUREZA DA OPERA");
            if (split.length > 1) {
                String[] lines = split[1].split("\n");
                for (String line : lines) {
                    if (line.trim().length() > 3 && !line.contains("ÇÃO")) {
                        data.put("description", line.trim().substring(0, Math.min(line.trim().length(), 100)));
                        break;
                    }
                }
            }
        } else if (cleanText.contains("DESCRI")) {
            String[] split = cleanText.split("DESCRI");
            if (split.length > 1) {
                String[] lines = split[1].split("\n");
                for (String line : lines) {
                    if (line.trim().length() > 3 && !line.contains("ÇÃO")) {
                        data.put("description", line.trim().substring(0, Math.min(line.trim().length(), 100)));
                        break;
                    }
                }
            }
        }

        return data;
    }
}
