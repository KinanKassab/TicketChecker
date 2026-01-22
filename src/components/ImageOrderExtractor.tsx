"use client";

import { useState, useRef } from "react";

type ImageOrderExtractorProps = {
  onExtract: (orderNumber: string) => void;
  label?: string;
  placeholder?: string;
};

export default function ImageOrderExtractor({
  onExtract,
  label = "رفع صورة تحتوي على رقم الطلب",
  placeholder = "أو أدخل رقم الطلب يدوياً",
}: ImageOrderExtractorProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [manualInput, setManualInput] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("يرجى رفع صورة صحيحة (JPG, PNG, etc.)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة كبير جداً. الحد الأقصى 5MB");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Process image with OCR
      await extractTextFromImage(file);
    } catch (err) {
      console.error("Error processing image:", err);
      setError("حدث خطأ أثناء معالجة الصورة. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const extractTextFromImage = async (file: File) => {
    try {
      // Try to use Tesseract.js if available
      const Tesseract = (await import("tesseract.js")).default;
      
      const { data: { text } } = await Tesseract.recognize(file, "eng+ara", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            // Optional: show progress
          }
        },
      });

      setExtractedText(text);
      
      // Try to extract order/reference code from text
      // Look for patterns like: REF-XXXX, Order: XXXX, رقم الطلب: XXXX, etc.
      const orderPatterns = [
        /(?:رقم|order|ref|reference|code)[\s:]*([A-Z0-9]{4,12})/i,
        /([A-Z]{2,4}[-]?[0-9]{4,8})/i,
        /([0-9]{6,12})/,
      ];

      let foundOrder = "";
      for (const pattern of orderPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          foundOrder = match[1].trim();
          break;
        }
      }

      if (foundOrder) {
        onExtract(foundOrder);
        setManualInput(foundOrder);
      } else {
        // Show extracted text and let user select
        setExtractedText(text);
        setError("لم يتم العثور على رقم الطلب تلقائياً. يرجى اختياره من النص المستخرج أدناه أو إدخاله يدوياً.");
      }
    } catch (importError) {
      // If Tesseract.js is not available, use server-side API
      console.log("Tesseract.js not available, using server API");
      await extractTextFromImageServer(file);
    }
  };

  const extractTextFromImageServer = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/ocr/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to extract text from image");
      }

      const data = await response.json();
      setExtractedText(data.text || "");
      
      // Try to extract order number
      const orderPatterns = [
        /(?:رقم|order|ref|reference|code)[\s:]*([A-Z0-9]{4,12})/i,
        /([A-Z]{2,4}[-]?[0-9]{4,8})/i,
        /([0-9]{6,12})/,
      ];

      let foundOrder = "";
      for (const pattern of orderPatterns) {
        const match = data.text?.match(pattern);
        if (match && match[1]) {
          foundOrder = match[1].trim();
          break;
        }
      }

      if (foundOrder) {
        onExtract(foundOrder);
        setManualInput(foundOrder);
      } else {
        setError("لم يتم العثور على رقم الطلب تلقائياً. يرجى إدخاله يدوياً.");
      }
    } catch (err) {
      console.error("Server OCR error:", err);
      setError("حدث خطأ أثناء معالجة الصورة على السيرفر.");
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onExtract(manualInput.trim());
    }
  };

  const clearImage = () => {
    setImage(null);
    setExtractedText("");
    setManualInput("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
            <div>
        <label className="text-sm font-medium text-slate-700 block mb-2">
          {placeholder}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 20) {
                setManualInput(value);
              }
            }}
            placeholder="مثال: REF-1234 أو 123456"
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            maxLength={20}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleManualSubmit();
              }
            }}
          />
          <button
            type="button"
            onClick={handleManualSubmit}
            disabled={!manualInput.trim() || loading}
            className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            تأكيد
          </button>
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-2">
          {label}
        </label>
        
        {!image ? (
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-slate-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
              disabled={loading}
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <svg
                className="w-12 h-12 text-slate-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm text-slate-600">
                {loading ? "جاري المعالجة..." : "اضغط لرفع صورة"}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                JPG, PNG (حد أقصى 5MB)
              </span>
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <img
                src={image}
                alt="Uploaded receipt"
                className="w-full max-h-64 object-contain rounded-xl border border-slate-200"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-slate-50"
                title="إزالة الصورة"
              >
                <svg
                  className="w-5 h-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            {loading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                <p className="text-sm text-slate-600 mt-2">جاري استخراج النص من الصورة...</p>
              </div>
            )}

            {extractedText && !loading && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-700 mb-2">النص المستخرج:</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap wrap-break-word">
                  {extractedText}
                </p>
              </div>
            )}
          </div>
        )}
      </div>



      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}
