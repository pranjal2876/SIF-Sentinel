import hashlib
import hmac
import base64
import json
import time
from app.core.config import JWT_SECRET, JWT_EXPIRE_MINUTES

# Minimal self-contained JWT (HS256) implementation to avoid extra dependencies.


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_token(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = dict(payload)
    payload["exp"] = int(time.time()) + JWT_EXPIRE_MINUTES * 60
    segments = [
        _b64url(json.dumps(header).encode()),
        _b64url(json.dumps(payload).encode()),
    ]
    signing_input = ".".join(segments).encode()
    signature = hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest()
    segments.append(_b64url(signature))
    return ".".join(segments)


def verify_token(token: str) -> dict | None:
    try:
        header_b64, payload_b64, sig_b64 = token.split(".")
        signing_input = f"{header_b64}.{payload_b64}".encode()
        expected_sig = hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(_b64url(expected_sig), sig_b64):
            return None
        payload = json.loads(_b64url_decode(payload_b64))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash password securely using bcrypt."""
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash, with fallback for legacy sha256 demo hashes."""
    if not hashed:
        return False
    if hashed.startswith("$2b$") or hashed.startswith("$2a$") or hashed.startswith("$2y$"):
        try:
            return pwd_context.verify(password, hashed)
        except Exception:
            return False
    # Legacy SHA-256 fallback for pre-existing dev seeds
    legacy_hash = hashlib.sha256((password + JWT_SECRET).encode()).hexdigest()
    return hmac.compare_digest(legacy_hash, hashed)


from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def require_role(*roles: str):
    """Enforce role-based access control (RBAC).

    Usage:
        @router.post("/train", dependencies=[Depends(require_role("admin", "manager"))])
    """
    def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = (current_user.get("role") or "").lower()
        allowed = [r.lower() for r in roles]
        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: role '{user_role}' lacks required permissions ({', '.join(roles)}).",
            )
        return current_user
    return role_checker


def require_roles(roles: list[str]):
    return require_role(*roles)

