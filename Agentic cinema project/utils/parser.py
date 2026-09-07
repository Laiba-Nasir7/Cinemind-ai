import os
import io
import re

def extract_text_from_file(file_storage) -> str:
    """
    Extracts plain text content from uploaded FileStorage objects (.txt, .pdf, .docx).
    """
    filename = file_storage.filename.lower()
    content = ""

    if filename.endswith(".txt"):
        content = file_storage.read().decode("utf-8", errors="ignore")
    elif filename.endswith(".pdf"):
        try:
            import pypdf
            reader = pypdf.PdfReader(file_storage)
            text_runs = []
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_runs.append(extracted)
            content = "\n".join(text_runs)
        except Exception as e:
            raise ValueError(f"Failed to parse PDF file: {str(e)}")
    elif filename.endswith(".docx"):
        try:
            import docx
            doc = docx.Document(io.BytesIO(file_storage.read()))
            content = "\n".join([p.text for p in doc.paragraphs if p.text])
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX file: {str(e)}")
    else:
        # Fallback to UTF-8 decoding
        try:
            content = file_storage.read().decode("utf-8", errors="ignore")
        except Exception:
            raise ValueError(f"Unsupported file format: '{filename}'. Please upload a .txt, .pdf, or .docx file.")

    return clean_screenplay_text(content)


def clean_screenplay_text(text: str) -> str:
    """
    Cleans raw screenplay text by stripping extra carriage returns and unifying line breaks.
    """
    if not text:
        return ""
    
    # Normalize newline characters
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    
    # Remove excessive blank lines (more than 3 consecutive)
    text = re.sub(r'\n{4,}', '\n\n\n', text)
    
    return text.strip()


def calculate_script_stats(text: str) -> dict:
    """
    Utility to return quick quantitative statistics on raw screenplay text.
    """
    lines = text.splitlines()
    word_count = len(re.findall(r'\w+', text))
    char_count = len(text)
    
    # Estimate scene count using standard screenplay sluglines (INT. / EXT.)
    sluglines = re.findall(r'(?:INT\.|EXT\.|INT/EXT\.|EST\.)', text, re.IGNORECASE)
    estimated_scenes = max(len(sluglines), 1)
    
    # Estimate page count (standard screenplay rule: ~250 words per page)
    estimated_pages = max(round(word_count / 250.0, 1), 0.5)

    return {
        "word_count": word_count,
        "char_count": char_count,
        "line_count": len(lines),
        "estimated_scenes": estimated_scenes,
        "estimated_pages": estimated_pages
    }
