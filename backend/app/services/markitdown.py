import os

try:
    from markitdown import MarkItDown
except ImportError as exc:  # pragma: no cover
    MarkItDown = None  # type: ignore[misc,assignment]
    _import_error = exc


def run_markitdown(input_path: str, output_path: str) -> None:
    """
    Converts input_path to Markdown using the Microsoft markitdown library
    and writes the result to output_path.
    Raises RuntimeError on failure.
    """
    if MarkItDown is None:
        raise RuntimeError(
            f"markitdown is not installed in the current Python environment: {_import_error}"
        )

    md = MarkItDown()
    result = md.convert(input_path)

    text = result.markdown if hasattr(result, "markdown") else str(result)
    if not text.strip():
        raise RuntimeError(
            "markitdown produced empty output. "
            "This usually means the file format is not supported or the document is empty. "
            "Ensure you are using a supported format (e.g., .docx, .xlsx, .pptx, .pdf)."
        )

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(text)
