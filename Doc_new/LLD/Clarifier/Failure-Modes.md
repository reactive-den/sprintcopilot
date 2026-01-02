# Clarifier Failure Modes

- LLM timeout -> retry with smaller context; if still failing, mark FAILED.
- Invalid JSON -> retry once; if still invalid, mark FAILED.
- Session abandoned -> expire after 7 days.
