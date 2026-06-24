"""
智能驾驶出海咨询 — 后端服务
FastAPI + SQLite + bcrypt + JWT
"""
import os
import re
import json
import time
import uuid
import sqlite3
import hashlib
import smtplib
import secrets
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone
from functools import wraps
from contextlib import contextmanager

# 中国时区 (UTC+8)
CHINA_TZ = timezone(timedelta(hours=8))

def china_now():
    """返回中国时区的当前时间"""
    return datetime.now(CHINA_TZ)

import bcrypt
import jwt
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------- 配置 ----------
DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "data.db"))
JWT_SECRET = os.getenv("JWT_SECRET", "overseas-driving-secret-key-change-me")
JWT_EXPIRE_HOURS = 72
ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PWD = os.getenv("ADMIN_PWD", "admin123")
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PWD = os.getenv("SMTP_PWD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@caeri.com")

app = FastAPI(title="Overseas Driving API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ---------- DB ----------
def init_db():
    with get_db() as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                nickname TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT DEFAULT '',
                password_hash TEXT NOT NULL,
                avatar TEXT DEFAULT '',
                org TEXT DEFAULT '',
                created_at TEXT DEFAULT '',
                last_login TEXT DEFAULT '',
                token_used INTEGER DEFAULT 0,
                last_ip TEXT DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS chat_records (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT DEFAULT '',
                messages TEXT DEFAULT '[]',
                created_at TEXT DEFAULT '',
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS verify_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                code TEXT NOT NULL,
                expires_at REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS admin (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT DEFAULT ''
            );
        """)
        # 初始化管理员
        admin_hash = bcrypt.hashpw(ADMIN_PWD.encode(), bcrypt.gensalt()).decode()
        db.execute("INSERT OR IGNORE INTO admin VALUES (?,?,?)", (uuid.uuid4().hex[:12], ADMIN_USER, admin_hash))
        db.commit()
        # 迁移：为已有数据库补加 last_ip 列
        try: db.execute("ALTER TABLE users ADD COLUMN last_ip TEXT DEFAULT ''")
        except: pass
        db.commit()

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try: yield conn
    finally: conn.close()

# ---------- JWT ----------
def make_token(user_id: str, is_admin: bool = False) -> str:
    exp = datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    return jwt.encode({"sub": user_id, "admin": is_admin, "exp": exp}, JWT_SECRET, algorithm="HS256")

def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

def require_auth(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "未登录")
    try: return decode_token(auth[7:])
    except jwt.ExpiredSignatureError: raise HTTPException(401, "登录已过期")
    except Exception: raise HTTPException(401, "无效的登录凭证")

def require_admin(request: Request):
    payload = require_auth(request)
    if not payload.get("admin"):
        raise HTTPException(403, "需要管理员权限")
    return payload

# ---------- 模型 ----------
class RegisterReq(BaseModel):
    nickname: str
    email: str
    password: str
    phone: str = ""

class LoginReq(BaseModel):
    email: str
    password: str

class SendCodeReq(BaseModel):
    email: str

class CodeLoginReq(BaseModel):
    email: str
    code: str

class AdminLoginReq(BaseModel):
    username: str
    password: str

class AdminAddUserReq(BaseModel):
    nickname: str
    email: str
    password: str
    phone: str = ""
    org: str = ""

class UpdateProfileReq(BaseModel):
    nickname: str = ""
    email: str = ""
    org: str = ""
    avatar: str = ""

class ChangePwdReq(BaseModel):
    old_password: str
    new_password: str

class SaveChatReq(BaseModel):
    title: str = ""
    messages: list = []

class ChatCompletionReq(BaseModel):
    messages: list
    stream: bool = False

# ---------- 密码验证 ----------
def validate_password(pwd: str):
    if len(pwd) < 8 or len(pwd) > 16: return "密码长度需为 8-16 位"
    if not re.search(r"[a-zA-Z]", pwd): return "密码必须包含字母"
    if not re.search(r"\d", pwd): return "密码必须包含数字"
    return None

# ---------- 验证码 ----------
def send_verify_email(email: str, code: str) -> bool:
    if not SMTP_HOST or not SMTP_USER:
        print(f"[模拟邮件] 验证码发送至 {email}: {code}")
        return True
    try:
        msg = MIMEText(f"您的验证码是：{code}，有效期 5 分钟。", "plain", "utf-8")
        msg["Subject"] = "智能驾驶出海咨询 — 验证码"
        msg["From"] = SMTP_FROM
        msg["To"] = email
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as s:
            s.login(SMTP_USER, SMTP_PWD)
            s.sendmail(SMTP_FROM, [email], msg.as_string())
        return True
    except Exception as e:
        print(f"[邮件发送失败] {e}")
        return False

# ---------- 公开接口 ----------

@app.post("/api/auth/send-code")
def send_code(req: SendCodeReq):
    """发送邮箱 / 手机验证码"""
    if not req.email.strip():
        return {"code": 400, "message": "请输入邮箱"}
    code = str(secrets.randbelow(900000) + 100000)
    with get_db() as db:
        db.execute("DELETE FROM verify_codes WHERE email=?", (req.email,))
        db.execute("INSERT INTO verify_codes(email,code,expires_at) VALUES (?,?,?)",
                   (req.email, code, time.time() + 300))
        db.commit()
    sent = send_verify_email(req.email.strip(), code)
    return {"code": 0, "message": f"验证码已发送{'(模拟: '+code+')' if not SMTP_HOST else ''}", "data": {"success": True}}

@app.post("/api/auth/login")
def login(req: LoginReq, request: Request):
    """邮箱 + 密码登录"""
    with get_db() as db:
        user = db.execute("SELECT * FROM users WHERE email=?", (req.email.strip(),)).fetchone()
    if not user:
        return {"code": 401, "message": "账号不存在"}
    if not bcrypt.checkpw(req.password.encode(), user["password_hash"].encode()):
        return {"code": 401, "message": "密码不正确"}
    # 更新最后登录时间和 IP
    client_ip = request.client.host if request.client else ""
    with get_db() as db:
        db.execute("UPDATE users SET last_login=?, last_ip=?, token_used=token_used+1 WHERE id=?",
                   (china_now().isoformat(), client_ip, user["id"]))
        db.commit()
    token = make_token(user["id"])
    return {"code": 0, "data": {
        "token": token,
        "user": {"id": user["id"], "nickname": user["nickname"], "email": user["email"],
                  "phone": user["phone"], "avatar": user["avatar"], "org": user["org"]}
    }}

@app.post("/api/auth/code-login")
def code_login(req: CodeLoginReq, request: Request):
    """邮箱验证码登录"""
    with get_db() as db:
        vc = db.execute("SELECT * FROM verify_codes WHERE email=? AND code=? AND expires_at>?",
                        (req.email.strip(), req.code.strip(), time.time())).fetchone()
    if not vc:
        return {"code": 401, "message": "验证码不正确或已过期"}
    # 清理验证码
    client_ip = request.client.host if request.client else ""
    with get_db() as db:
        db.execute("DELETE FROM verify_codes WHERE email=?", (req.email.strip(),))
        user = db.execute("SELECT * FROM users WHERE email=?", (req.email.strip(),)).fetchone()
        if user:
            db.execute("UPDATE users SET last_login=?, last_ip=?, token_used=token_used+1 WHERE id=?",
                       (china_now().isoformat(), client_ip, user["id"]))
            db.commit()
    if not user:
        return {"code": 401, "message": "账号不存在，请联系管理员"}
    token = make_token(user["id"])
    return {"code": 0, "data": {
        "token": token,
        "user": {"id": user["id"], "nickname": user["nickname"], "email": user["email"],
                  "phone": user["phone"], "avatar": user["avatar"], "org": user["org"]}
    }}

# ==================== 用户接口（需要登录） ====================

@app.get("/api/user/profile")
def get_profile(request: Request):
    payload = require_auth(request)
    with get_db() as db:
        user = db.execute("SELECT * FROM users WHERE id=?", (payload["sub"],)).fetchone()
    if not user: raise HTTPException(404, "用户不存在")
    return {"code": 0, "data": dict(user)}

@app.post("/api/user/profile")
def update_profile(req: UpdateProfileReq, request: Request):
    payload = require_auth(request)
    with get_db() as db:
        db.execute("UPDATE users SET nickname=?, email=?, org=?, avatar=? WHERE id=?",
                   (req.nickname, req.email, req.org, req.avatar, payload["sub"]))
        db.commit()
    return {"code": 0, "message": "已更新"}

@app.post("/api/user/change-password")
def change_password(req: ChangePwdReq, request: Request):
    payload = require_auth(request)
    err = validate_password(req.new_password)
    if err: return {"code": 400, "message": err}
    with get_db() as db:
        user = db.execute("SELECT password_hash FROM users WHERE id=?", (payload["sub"],)).fetchone()
    if not bcrypt.checkpw(req.old_password.encode(), user["password_hash"].encode()):
        return {"code": 400, "message": "旧密码不正确"}
    new_hash = bcrypt.hashpw(req.new_password.encode(), bcrypt.gensalt()).decode()
    with get_db() as db:
        db.execute("UPDATE users SET password_hash=? WHERE id=?", (new_hash, payload["sub"]))
        db.commit()
    return {"code": 0, "message": "密码已修改"}

# ==================== 聊天记录 ====================

@app.get("/api/chat/records")
def get_chat_records(request: Request):
    payload = require_auth(request)
    with get_db() as db:
        rows = db.execute("SELECT * FROM chat_records WHERE user_id=? ORDER BY created_at DESC",
                          (payload["sub"],)).fetchall()
    return {"code": 0, "data": [dict(r) for r in rows]}

@app.post("/api/chat/records")
def save_chat_record(req: SaveChatReq, request: Request):
    payload = require_auth(request)
    rid = uuid.uuid4().hex[:16]
    with get_db() as db:
        db.execute("INSERT INTO chat_records(id,user_id,title,messages,created_at) VALUES (?,?,?,?,?)",
                   (rid, payload["sub"], req.title, json.dumps(req.messages), china_now().isoformat()))
        db.commit()
    return {"code": 0, "data": {"id": rid}}

@app.delete("/api/chat/records/{record_id}")
def delete_chat_record(record_id: str, request: Request):
    payload = require_auth(request)
    with get_db() as db:
        db.execute("DELETE FROM chat_records WHERE id=? AND user_id=?", (record_id, payload["sub"]))
        db.commit()
    return {"code": 0, "message": "已删除"}

# ==================== 管理员接口 ====================

@app.post("/api/admin/login")
def admin_login(req: AdminLoginReq):
    with get_db() as db:
        admin = db.execute("SELECT * FROM admin WHERE username=?", (req.username,)).fetchone()
    if not admin or not bcrypt.checkpw(req.password.encode(), admin["password_hash"].encode()):
        return {"code": 401, "message": "管理员账号或密码不正确"}
    token = make_token(admin["id"], is_admin=True)
    return {"code": 0, "data": {"token": token, "username": admin["username"]}}

@app.get("/api/admin/users")
def admin_list_users(request: Request):
    require_admin(request)
    with get_db() as db:
        rows = db.execute("SELECT id,nickname,email,phone,org,avatar,created_at,last_login,last_ip,token_used FROM users ORDER BY created_at DESC").fetchall()
    return {"code": 0, "data": [dict(r) for r in rows]}

@app.post("/api/admin/users")
def admin_add_user(req: AdminAddUserReq, request: Request):
    require_admin(request)
    if not req.nickname.strip() or not req.email.strip() or not req.password.strip():
        return {"code": 400, "message": "昵称、邮箱、密码为必填项"}
    err = validate_password(req.password)
    if err: return {"code": 400, "message": err}
    uid = uuid.uuid4().hex[:16]
    pwd_hash = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    try:
        with get_db() as db:
            db.execute("INSERT INTO users(id,nickname,email,phone,password_hash,org,created_at) VALUES (?,?,?,?,?,?,?)",
                       (uid, req.nickname, req.email, req.phone, pwd_hash, req.org, china_now().isoformat()))
            db.commit()
    except sqlite3.IntegrityError:
        return {"code": 400, "message": "该邮箱已存在"}
    return {"code": 0, "data": {"id": uid}, "message": "添加成功"}

@app.delete("/api/admin/users/{user_id}")
def admin_delete_user(user_id: str, request: Request):
    require_admin(request)
    with get_db() as db:
        db.execute("DELETE FROM chat_records WHERE user_id=?", (user_id,))
        db.execute("DELETE FROM users WHERE id=?", (user_id,))
        db.commit()
    return {"code": 0, "message": "已删除"}

@app.get("/api/admin/users/export")
def admin_export_users(request: Request, search: str = ""):
    require_admin(request)
    with get_db() as db:
        users = db.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
    # 搜索过滤
    if search:
        s = search.lower()
        users = [u for u in users if
                 (u["id"] and s in u["id"].lower()) or
                 (u["nickname"] and s in u["nickname"].lower()) or
                 (u["email"] and s in u["email"].lower()) or
                 (u["org"] and s in u["org"].lower()) or
                 (u["phone"] and s in u["phone"])]
    result = []
    for u in users:
        with get_db() as db:
            chats = db.execute("SELECT COUNT(*) as cnt FROM chat_records WHERE user_id=?", (u["id"],)).fetchone()
        result.append({
            "用户ID": u["id"], "昵称": u["nickname"], "邮箱": u["email"], "手机号": u["phone"],
            "组织": u["org"], "注册时间": u["created_at"], "最后登录": u["last_login"],
            "IP地址": u["last_ip"] or "", "Token用量": u["token_used"], "聊天记录数": chats["cnt"]
        })
    return {"code": 0, "data": result}

# ==================== 管理员查看用户聊天记录 ====================

@app.get("/api/admin/chat/records")
def admin_get_user_chats(request: Request, user_id: str = ""):
    """管理员查看指定用户的聊天记录列表"""
    require_admin(request)
    if not user_id:
        return {"code": 400, "message": "缺少 user_id 参数"}
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM chat_records WHERE user_id=? ORDER BY created_at DESC",
            (user_id,)
        ).fetchall()
    return {"code": 0, "data": [dict(r) for r in rows]}

@app.get("/api/admin/chat/records/{record_id}")
def admin_get_chat_detail(record_id: str, request: Request):
    """管理员查看某条聊天记录的详细消息"""
    require_admin(request)
    with get_db() as db:
        record = db.execute(
            "SELECT * FROM chat_records WHERE id=?", (record_id,)
        ).fetchone()
    if not record:
        return {"code": 404, "message": "记录不存在"}
    data = dict(record)
    # 解析 messages JSON
    try:
        data["messages"] = json.loads(data.get("messages", "[]"))
    except Exception:
        data["messages"] = []
    return {"code": 0, "data": data}

# ==================== LLM 配置管理（管理员） ====================
class LLMConfigReq(BaseModel):
    api_key: str = ""
    api_base: str = ""
    model: str = ""

@app.get("/api/admin/llm-config")
def admin_get_llm_config(request: Request):
    require_admin(request)
    return {"code": 0, "data": get_llm_config()}

@app.post("/api/admin/llm-config")
def admin_save_llm_config(req: LLMConfigReq, request: Request):
    require_admin(request)
    save_llm_config(req.api_key, req.api_base, req.model)
    return {"code": 0, "message": "LLM 配置已保存"}

@app.get("/api/user/llm-config")
def user_get_llm_config(request: Request):
    """普通用户只读"""
    require_auth(request)
    cfg = get_llm_config()
    return {"code": 0, "data": {"api_base": cfg["api_base"], "model": cfg["model"]}}

# ==================== LLM 配置读写 ====================
def get_llm_config() -> dict:
    with get_db() as db:
        rows = db.execute("SELECT key, value FROM config WHERE key IN ('api_key','api_base','model')").fetchall()
    cfg = {r["key"]: r["value"] for r in rows}
    return {
        "api_key": cfg.get("api_key", os.getenv("LLM_API_KEY", "")),
        "api_base": cfg.get("api_base", os.getenv("LLM_API_BASE", "")),
        "model": cfg.get("model", os.getenv("LLM_MODEL", "")),
    }

def save_llm_config(api_key: str, api_base: str, model: str = ""):
    with get_db() as db:
        for k, v in [("api_key", api_key), ("api_base", api_base), ("model", model)]:
            db.execute("INSERT OR REPLACE INTO config(key,value) VALUES (?,?)", (k, v))
        db.commit()

# ==================== LLM 代理 + Token 统计 ====================

import httpx
from fastapi.responses import StreamingResponse

@app.post("/api/chat/completions")
async def chat_completions(req: ChatCompletionReq, request: Request):
    """代理 LLM 请求，统计 token"""
    payload = require_auth(request)
    user_id = payload["sub"]
    cfg = get_llm_config()

    if not cfg["api_key"]:
        raise HTTPException(500, "LLM API Key 未配置，请在设置中配置")

    body = {
        "model": cfg["model"],
        "messages": req.messages,
        "stream": req.stream,
    }

    headers = {
        "Authorization": f"Bearer {cfg['api_key']}",
        "Content-Type": "application/json",
    }

    if req.stream:
        # SSE 流式代理
        async def stream_proxy():
            total_tokens = 0
            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream(
                    "POST", f"{cfg['api_base']}/chat/completions",
                    json=body, headers=headers
                ) as resp:
                    async for line in resp.aiter_lines():
                        yield line + "\n"
                        # 提取 token 用量
                        if line.startswith("data: ") and "usage" in line:
                            try:
                                chunk = json.loads(line[6:])
                                total_tokens = chunk.get("usage", {}).get("total_tokens", 0)
                            except: pass

            # 流结束后统计
            if total_tokens > 0:
                with get_db() as db:
                    db.execute("UPDATE users SET token_used=token_used+? WHERE id=?",
                               (total_tokens, user_id))
                    db.commit()

        return StreamingResponse(stream_proxy(), media_type="text/event-stream")
    else:
        # 非流式代理
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{cfg['api_base']}/chat/completions",
                json=body, headers=headers
            )
            data = resp.json()
            total_tokens = data.get("usage", {}).get("total_tokens", 0)
            if total_tokens > 0:
                with get_db() as db:
                    db.execute("UPDATE users SET token_used=token_used+? WHERE id=?",
                               (total_tokens, user_id))
                    db.commit()
            return data

# ==================== 启动 ====================
if __name__ == "__main__":
    import uvicorn
    init_db()
    print("=" * 50)
    print("  智能驾驶出海咨询 — 后端服务")
    print(f"  数据库: {DB_PATH}")
    print(f"  管理员: {ADMIN_USER} / {ADMIN_PWD}")
    if not SMTP_HOST:
        print("  SMTP 未配置，验证码将打印在控制台")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=9005)
