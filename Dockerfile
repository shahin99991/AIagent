FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8080
ENV PYTHONUNBUFFERED=1

EXPOSE ${PORT}

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "src.main:app"] 