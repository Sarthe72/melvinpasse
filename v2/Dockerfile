FROM mcr.microsoft.com/playwright/python:v1.62.0-noble
WORKDIR /app
COPY pyproject.toml ./
COPY app ./app
COPY data ./data
RUN pip install --no-cache-dir .
ENV DATABASE_URL=sqlite:////app/instance/cv_melvin.db
EXPOSE 5000
CMD ["sh", "-c", "flask --app app init-db && flask --app app run --host=0.0.0.0"]
