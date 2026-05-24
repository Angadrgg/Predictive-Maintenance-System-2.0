FROM python:3.9-slim
WORKDIR /app
# Install dependencies
RUN pip install fastapi uvicorn pydantic scikit-learn numpy
COPY . .
EXPOSE 8000
# Run the AI server (we will create ai_server.py next)
CMD ["uvicorn", "ai_server:app", "--host", "0.0.0.0", "--port", "8000"]