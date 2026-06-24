FROM python:3.11-slim

WORKDIR /app

# 安装依赖
RUN pip install --no-cache-dir fastapi uvicorn bcrypt pyjwt httpx

# 复制代码
COPY server.py .

# 数据持久化目录
ENV DB_PATH=/app/data/data.db

EXPOSE 9005

CMD ["python", "server.py"]
