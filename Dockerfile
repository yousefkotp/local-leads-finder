# Local Leads Finder - Docker Image
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY leads_finder/ ./leads_finder/
COPY webapp/ ./webapp/
COPY setup.py .
COPY README.md .

# Create multi-mode entrypoint (web server or CLI)
RUN cat <<'EOF' > /usr/local/bin/docker-entrypoint
#!/usr/bin/env sh
set -e

if [ "$1" = "web" ]; then
    shift
    PORT="${PORT:-5000}"
    WEB_WORKERS="${WEB_WORKERS:-1}"
    WEB_THREADS="${WEB_THREADS:-2}"
    WEB_TIMEOUT="${WEB_TIMEOUT:-120}"

    exec gunicorn app:app \
        --chdir /app/webapp \
        --bind "0.0.0.0:${PORT}" \
        --timeout "${WEB_TIMEOUT}" \
        --workers "${WEB_WORKERS}" \
        --threads "${WEB_THREADS}" \
        "$@"
fi

exec leads-finder "$@"
EOF

RUN chmod +x /usr/local/bin/docker-entrypoint

# Install the package
RUN pip install -e .

# Create output directory
RUN mkdir -p /out

# Set execution defaults
ENV PORT=5000
EXPOSE 5000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint"]
CMD ["--help"]
