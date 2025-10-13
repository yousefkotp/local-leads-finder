# Local Leads Finder - Docker Image
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY leads_finder/ ./leads_finder/
COPY setup.py .
COPY README.md .

# Install the package
RUN pip install -e .

# Create output directory
RUN mkdir -p /out

# Set default command
ENTRYPOINT ["leads-finder"]
CMD ["--help"]
