package com.rbz.licensingsystem.service;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * Security helpers for uploaded files.
 *
 * Responsibilities:
 *  - Sanitize user-supplied filenames so they cannot escape the upload directory
 *    or inject control characters.
 *  - Validate the file content via magic bytes against the claimed extension.
 *    The file extension on its own is untrusted because it is user-controlled.
 *  - Compute SHA-256 over the bytes for tamper detection and dedup.
 */
@Component
public class FileSecurityHelper {

    public static final long MAX_FILE_SIZE_BYTES = 25L * 1024L * 1024L; // 25 MB

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "png", "jpg", "jpeg", "doc", "docx", "xls", "xlsx"
    );

    /** Magic-byte signatures we accept. Each entry maps an extension to one or more byte prefixes. */
    private static final Map<String, byte[][]> MAGIC_BYTES = Map.of(
            "pdf",  new byte[][]{ {0x25, 0x50, 0x44, 0x46} },                              // %PDF
            "png",  new byte[][]{ {(byte)0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A} }, // PNG
            "jpg",  new byte[][]{ {(byte)0xFF, (byte)0xD8, (byte)0xFF} },                  // JPEG
            "jpeg", new byte[][]{ {(byte)0xFF, (byte)0xD8, (byte)0xFF} },
            "docx", new byte[][]{ {0x50, 0x4B, 0x03, 0x04} },                              // ZIP container
            "xlsx", new byte[][]{ {0x50, 0x4B, 0x03, 0x04} },
            "doc",  new byte[][]{ {(byte)0xD0, (byte)0xCF, 0x11, (byte)0xE0, (byte)0xA1, (byte)0xB1, 0x1A, (byte)0xE1} }, // OLE2
            "xls",  new byte[][]{ {(byte)0xD0, (byte)0xCF, 0x11, (byte)0xE0, (byte)0xA1, (byte)0xB1, 0x1A, (byte)0xE1} }
    );

    public static class FileValidationException extends RuntimeException {
        public FileValidationException(String message) { super(message); }
    }

    /**
     * Strips path separators, control characters, and other unsafe characters from
     * a user-supplied filename. Caps length at 120 chars. Always returns a non-blank
     * value; falls back to "document" if the input is null/blank/empty after stripping.
     */
    public String sanitizeFilename(String raw) {
        if (raw == null) return "document";
        // Strip any directory portion the browser may have included
        String name = raw;
        int slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        if (slash >= 0) name = name.substring(slash + 1);
        // Replace anything not in a safe whitelist
        name = name.replaceAll("[^a-zA-Z0-9._\\-]", "_");
        // Collapse runs of dots so ".." cannot survive
        name = name.replaceAll("\\.{2,}", ".");
        // Trim leading dots so files cannot become hidden
        name = name.replaceAll("^\\.+", "");
        if (name.isBlank()) name = "document";
        if (name.length() > 120) name = name.substring(0, 120);
        return name;
    }

    public String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) return "";
        return filename.substring(dot + 1).toLowerCase();
    }

    /**
     * Validates the file:
     *  - non-empty
     *  - within size cap
     *  - extension is in the allowlist
     *  - magic bytes match the claimed extension
     *
     * Throws FileValidationException with a user-safe message if any check fails.
     */
    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileValidationException("File is empty.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new FileValidationException("File exceeds 25 MB limit.");
        }
        String ext = extractExtension(file.getOriginalFilename());
        if (ext.isEmpty() || !ALLOWED_EXTENSIONS.contains(ext)) {
            throw new FileValidationException(
                    "File type not allowed. Accepted: PDF, DOCX, XLSX, PNG, JPG.");
        }
        byte[] head = readHead(file, 16);
        if (!matchesMagic(ext, head)) {
            throw new FileValidationException(
                    "File contents do not match the claimed type. Upload rejected for safety.");
        }
    }

    private byte[] readHead(MultipartFile file, int n) {
        try (var in = file.getInputStream()) {
            byte[] buf = new byte[n];
            int read = in.read(buf);
            if (read < 0) return new byte[0];
            if (read < n) {
                byte[] tight = new byte[read];
                System.arraycopy(buf, 0, tight, 0, read);
                return tight;
            }
            return buf;
        } catch (IOException e) {
            throw new FileValidationException("Could not read uploaded file.");
        }
    }

    private boolean matchesMagic(String ext, byte[] head) {
        byte[][] sigs = MAGIC_BYTES.get(ext);
        if (sigs == null) return false;
        for (byte[] sig : sigs) {
            if (head.length < sig.length) continue;
            boolean match = true;
            for (int i = 0; i < sig.length; i++) {
                if (head[i] != sig[i]) { match = false; break; }
            }
            if (match) return true;
        }
        return false;
    }

    public String sha256(byte[] bytes) {
        return DigestUtils.sha256Hex(bytes);
    }
}
