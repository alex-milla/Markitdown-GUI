import os
import subprocess
import shlex
import sys


def _find_markitdown() -> str:
    # Try the same Python interpreter's scripts directory
    scripts_dir = os.path.join(os.path.dirname(sys.executable), "markitdown")
    if os.path.isfile(scripts_dir):
        return scripts_dir
    # Fallback to PATH lookup
    return "markitdown"


def run_markitdown(input_path: str, output_path: str) -> None:
    """
    Runs the markitdown CLI on input_path and writes the result to output_path.
    Raises RuntimeError on failure.
    """
    cmd = f"{_find_markitdown()} {shlex.quote(input_path)}"
    result = subprocess.run(
        cmd,
        shell=True,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        error = result.stderr.strip() or "Unknown error from markitdown"
        raise RuntimeError(error)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(result.stdout)
