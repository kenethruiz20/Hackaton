# Backend Dockerfile for deploying Flask app in production

FROM python:3.8-slim

# Set working directory
WORKDIR /app

# Copy the requirements file
COPY requirements.txt /app/

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . /app/

# Expose port 8080 for the Flask app
EXPOSE 8080


# Command to run the app with Gunicorn in production mode
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app"]
