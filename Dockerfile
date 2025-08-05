# syntax=docker/dockerfile:1

FROM python:3.13-slim
WORKDIR /image_classifier
COPY . .
RUN groupadd -r appuser && \
    useradd -g appuser appuser && \
    chown -R appuser:appuser /image_classifier && \
    pip3 install --no-cache-dir -r requirements.txt
EXPOSE 8000
USER appuser
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "app:app"]
