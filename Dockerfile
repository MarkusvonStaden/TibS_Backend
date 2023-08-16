# Use an official Python runtime as the parent image
FROM python:3.10-slim

# Set the working directory in the docker image
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variable for FastAPI to run on port 80
ENV UVICORN_HOST=0.0.0.0 UVICORN_PORT=80

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
