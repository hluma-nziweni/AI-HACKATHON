import os
import datetime
import base64
from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import requests
from dotenv import load_dotenv, find_dotenv
from slack_sdk.webhook import WebhookClient
from jose import jwt, JWTError
import psycopg

# Robust .env discovery and logging
_dotenv_path = find_dotenv(usecwd=True)
load_dotenv(_dotenv_path)
print(f"[integrations] Loaded .env from: {_dotenv_path or '(not found)'}")

app = FastAPI(title="Integrations Service")

JWT_SECRET = os.getenv("JWT_SECRET") or os.getenv("JWT_SECRET_KEY", "change-me-dev-secret")
JWT_ALGO = os.getenv("JWT_ALGORITHM", "HS256")

def _extract_bearer(authorization: Optional[str]) -> Optional[str]:
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ", 1)[1]
    return None

def _validate_jwt_dependency(authorization: Optional[str] = Header(None)) -> dict:
    token = _extract_bearer(authorization)
    if not token:
        # Allow bypass when AUTH_DISABLED is enabled (demo mode)
        try:
            if AUTH_DISABLED:
                return {"sub": "demo@example.com", "mode": "auth_bypass"}
        except NameError:
            # AUTH_DISABLED not defined yet in module load order
            pass
        raise HTTPException(status_code=401, detail="Missing bearer token")
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except JWTError as e:
        # Also allow bypass on invalid token when AUTH_DISABLED
        try:
            if AUTH_DISABLED:
                return {"sub": "demo@example.com", "mode": "auth_bypass"}
        except NameError:
            pass
        raise HTTPException(status_code=401, detail="Invalid token") from e

# Scopes for Google APIs
SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar',  # For creating events
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/gmail.compose'  # For drafting emails
]

# A simple in-memory store for user credentials.
# In a real application, this would be a database.
credentials_store = {}

def _parse_bool(val: Optional[str], default: bool = False) -> bool:
    if val is None:
        return default
    return str(val).strip().lower() in {"1", "true", "yes", "on"}

MOCK_MODE = _parse_bool(os.getenv("MOCK_MODE"), default=False)
print(f"[integrations] MOCK_MODE raw='{os.getenv('MOCK_MODE')}' parsed={MOCK_MODE}")

DATABASE_URL = os.getenv("DATABASE_URL")
ALLOW_REQUEST_MOCKS = _parse_bool(os.getenv("ALLOW_REQUEST_MOCKS"), default=True)
AUTH_DISABLED = _parse_bool(os.getenv("AUTH_DISABLED"), default=False)
print(f"[integrations] AUTH_DISABLED raw='{os.getenv('AUTH_DISABLED')}' parsed={AUTH_DISABLED}")

def get_db_conn():
    if not DATABASE_URL:
        return None
    try:
        return psycopg.connect(DATABASE_URL)
    except Exception as e:
        print(f"[integrations] DB connect failed: {e}")
        return None

def resolve_scenario(claims: dict, override: Optional[str]) -> str:
    """Return 'low'|'medium'|'high'. Order: override (if allowed) > DB demo_profiles > default 'medium'."""
    if override and ALLOW_REQUEST_MOCKS:
        if override in {"low", "medium", "high"}:
            return override
    if not DATABASE_URL:
        return "medium"
    user_identifier = claims.get("sub") or claims.get("email")
    if not user_identifier:
        return "medium"
    conn = get_db_conn()
    if not conn:
        return "medium"
    try:
        with conn.cursor() as cur:
            # Try to find by email (users.email stored in CITEXT)
            cur.execute(
                """
                SELECT dp.scenario
                FROM users u
                JOIN demo_profiles dp ON dp.user_id = u.id
                WHERE u.email = %s
                """,
                (user_identifier,)
            )
            row = cur.fetchone()
            return row[0] if row else "medium"
    except Exception as e:
        print(f"[integrations] resolve_scenario error: {e}")
        return "medium"
    finally:
        conn.close()

# Pydantic models for request validation
class CalendarEventRequest(BaseModel):
    title: str
    duration_minutes: int = 15
    description: str = ""

class EmailRequest(BaseModel):
    to: str
    subject: str
    body: str

class SlackNotificationRequest(BaseModel):
    message: str
    channel: str = "#team-harmonia"

def get_credentials_from_token(authorization: Optional[str] = Header(None)):
    """
    Dependency to get credentials from JWT token or fallback to stored credentials.
    In a real app, this would validate the JWT and fetch user credentials from DB.
    """
    if authorization and authorization.startswith("Bearer "):
        # For now, we'll use the stored credentials regardless of the token
        # In production, you'd validate the JWT and fetch user-specific credentials
        token = authorization.split(" ")[1]
        # TODO: Validate JWT token and get user_id
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
            user_id = payload.get("sub") or "user_id"
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    else:
        user_id = "user_id"  # Fallback to default user
    
    creds = credentials_store.get(user_id)
    if not creds:
        if MOCK_MODE:
            # In mock mode, return a placeholder to allow handlers to proceed
            return None
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return creds

def get_credentials():
    """
    Legacy dependency for direct authentication (OAuth flow).
    """
    creds = credentials_store.get('user_id')
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return creds

@app.get("/auth/google")
async def google_auth():
    """
    Initiates the Google OAuth 2.0 authentication flow.
    """
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": os.getenv("CLIENT_ID"),
                "client_secret": os.getenv("CLIENT_SECRET"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "redirect_uris": [
                    "http://localhost:8001/auth/google/callback"
                ],
                "javascript_origins": [
                    "http://localhost:3000"
                ]
            }
        },
        scopes=SCOPES,
        redirect_uri='http://localhost:8001/auth/google/callback'
    )
    
    authorization_url, state = flow.authorization_url(access_type='offline', include_granted_scopes='true')
    
    # Store state to prevent CSRF attacks
    credentials_store['state'] = state
    
    return {"authorization_url": authorization_url}

@app.get("/auth/google/callback")
async def google_auth_callback(code: str, state: str):
    """
    Receives the authorization code from Google and exchanges it for a token.
    """
    if state != credentials_store.get('state'):
        raise HTTPException(status_code=400, detail="State mismatch.")
    
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": os.getenv("CLIENT_ID"),
                "client_secret": os.getenv("CLIENT_SECRET"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "redirect_uris": [
                    "http://localhost:8001/auth/google/callback"
                ],
                "javascript_origins": [
                    "http://localhost:3000"
                ]
            }
        },
        scopes=SCOPES,
        redirect_uri='http://localhost:8001/auth/google/callback'
    )
    
    flow.fetch_token(code=code)
    
    # Store credentials for the user (in this case, a hardcoded key)
    credentials_store['user_id'] = flow.credentials
    
    return {"message": "Authentication successful! You can now use the API."}

@app.get("/api/v1/data/calendar")
async def get_calendar_events(creds: Optional[Credentials] = Depends(get_credentials_from_token), _claims: dict = Depends(_validate_jwt_dependency), scenario: Optional[str] = None):
    """
    Fetches the user's calendar events for the next 24 hours.
    """
    try:
        if MOCK_MODE or creds is None:
            scn = resolve_scenario(_claims, scenario)
            # Synthetic events for the next few hours
            now = datetime.datetime.now(datetime.timezone.utc)
            # Adjust density by scenario
            base = [
                {
                    'summary': 'Focus Work',
                    'description': 'Deep work session',
                    'start': {'dateTime': now.isoformat()},
                    'end': {'dateTime': (now + datetime.timedelta(hours=1)).isoformat()},
                },
                {
                    'summary': 'Team Standup',
                    'description': 'Daily sync',
                    'start': {'dateTime': (now + datetime.timedelta(hours=2)).isoformat()},
                    'end': {'dateTime': (now + datetime.timedelta(hours=2, minutes=30)).isoformat()},
                },
            ]
            extra = []
            if scn == "high":
                extra = [{
                    'summary': 'Back-to-back Meetings',
                    'description': 'High load',
                    'start': {'dateTime': (now + datetime.timedelta(hours=3)).isoformat()},
                    'end': {'dateTime': (now + datetime.timedelta(hours=5)).isoformat()},
                }]
            events = base + extra
            return {"events": events}
        service = build('calendar', 'v3', credentials=creds)
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        events_result = service.events().list(
            calendarId='primary',
            timeMin=now,
            maxResults=10,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        return {"events": events_result.get('items', [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/data/heart_rate")
async def get_heart_rate(creds: Optional[Credentials] = Depends(get_credentials_from_token), _claims: dict = Depends(_validate_jwt_dependency), scenario: Optional[str] = None):
    """
    Fetches heart rate data for the last 24 hours.
    """
    try:
        if MOCK_MODE or creds is None:
            scn = resolve_scenario(_claims, scenario)
            now = datetime.datetime.now(datetime.timezone.utc)
            # Simple sinusoid-like variations
            series = []
            for i in range(12):
                ts = (now - datetime.timedelta(hours=24 - 2*i)).isoformat()
                if scn == "low":
                    bpm = 62 + (i % 3) * 3
                elif scn == "high":
                    bpm = 85 + (i % 5) * 6
                else:
                    bpm = 72 + (i % 5) * 4
                series.append({
                    'startTimeNanos': 0,
                    'endTimeNanos': 0,
                    'dataTypeName': 'com.google.heart_rate.bpm',
                    'originDataSourceId': 'mock',
                    'value': [{'fpVal': float(bpm)}],
                })
            return {"heart_rate_data": series}
        service = build('fitness', 'v1', credentials=creds)
        end_time_micros = int(datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000000)
        start_time_micros = end_time_micros - (24 * 60 * 60 * 1000000)
        
        data_source = "derived:com.google.heart_rate.bpm:com.google.android.apps.fitness:blood_pressure"
        
        data_points = service.users().dataSources().datasets().get(
            userId="me",
            dataSourceId=data_source,
            datasetId=f"{start_time_micros}-{end_time_micros}"
        ).execute()
        
        return {"heart_rate_data": data_points.get("point", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/data/aggregate")
async def get_all_user_data(creds: Optional[Credentials] = Depends(get_credentials_from_token), _claims: dict = Depends(_validate_jwt_dependency), scenario: Optional[str] = None):
    """
    A single endpoint to get all data required by the Assistant Service.
    """
    calendar_events = await get_calendar_events(creds=creds, _claims=_claims, scenario=scenario)
    heart_rate_data = await get_heart_rate(creds=creds, _claims=_claims, scenario=scenario)
    
    # You can add more data points here
    
    return {
        "calendar_events": calendar_events["events"],
        "heart_rate_data": heart_rate_data["heart_rate_data"],
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

class DemoProfileRequest(BaseModel):
    scenario: str
    mock_enabled: Optional[bool] = True

@app.post("/admin/demo_profile")
async def set_demo_profile(req: DemoProfileRequest, _claims: dict = Depends(_validate_jwt_dependency)):
    if req.scenario not in {"low", "medium", "high"}:
        raise HTTPException(status_code=400, detail="Invalid scenario")
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
    user_email = _claims.get("sub") or _claims.get("email")
    if not user_email:
        raise HTTPException(status_code=400, detail="JWT missing sub/email")
    try:
        with psycopg.connect(DATABASE_URL) as conn, conn.cursor() as cur:
            # Ensure user exists; create placeholder if not present (demo convenience)
            cur.execute(
                """
                INSERT INTO users (email, password_hash)
                VALUES (%s, 'placeholder')
                ON CONFLICT (email) DO UPDATE SET updated_at = now()
                RETURNING id
                """,
                (user_email,)
            )
            row = cur.fetchone()
            user_id = row[0]
            # Upsert demo profile
            cur.execute(
                """
                INSERT INTO demo_profiles (user_id, mock_enabled, scenario, overrides)
                VALUES (%s, %s, %s, NULL)
                ON CONFLICT (user_id) DO UPDATE
                SET mock_enabled = EXCLUDED.mock_enabled,
                    scenario = EXCLUDED.scenario,
                    updated_at = now()
                """,
                (user_id, bool(req.mock_enabled), req.scenario)
            )
            conn.commit()
        return {"status": "ok", "scenario": req.scenario, "mock_enabled": bool(req.mock_enabled)}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[integrations] set_demo_profile error: {e}")
        raise HTTPException(status_code=500, detail="Failed to set demo profile")

@app.post("/api/v1/create_calendar_event")
async def create_calendar_event(
    event_request: CalendarEventRequest, 
    creds: Optional[Credentials] = Depends(get_credentials_from_token),
    _claims: dict = Depends(_validate_jwt_dependency)
):
    """
    Creates a calendar event for the user.
    """
    try:
        if MOCK_MODE or creds is None:
            start_time = datetime.datetime.now(datetime.timezone.utc)
            end_time = start_time + datetime.timedelta(minutes=event_request.duration_minutes)
            return {
                "status": "mock_success",
                "event_id": "mock-event-id",
                "event_link": "http://example.com/mock",
                "message": f"(MOCK) Event '{event_request.title}' would be created",
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
            }
        service = build('calendar', 'v3', credentials=creds)
        
        # Calculate start and end times
        start_time = datetime.datetime.now(datetime.timezone.utc)
        end_time = start_time + datetime.timedelta(minutes=event_request.duration_minutes)
        
        event = {
            'summary': event_request.title,
            'description': event_request.description,
            'start': {
                'dateTime': start_time.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'UTC',
            },
        }
        
        created_event = service.events().insert(calendarId='primary', body=event).execute()
        
        return {
            "status": "success",
            "event_id": created_event.get('id'),
            "event_link": created_event.get('htmlLink'),
            "message": f"Event '{event_request.title}' created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create calendar event: {str(e)}")

@app.post("/api/v1/draft_email")
async def draft_email(
    email_request: EmailRequest, 
    creds: Optional[Credentials] = Depends(get_credentials_from_token),
    _claims: dict = Depends(_validate_jwt_dependency)
):
    """
    Creates a draft email using Gmail API.
    """
    try:
        if MOCK_MODE or creds is None:
            return {
                "status": "mock_success",
                "draft_id": "mock-draft-id",
                "message": f"(MOCK) Draft email to {email_request.to} would be created"
            }
        service = build('gmail', 'v1', credentials=creds)
        
        # Create the email message
        message = f"To: {email_request.to}\nSubject: {email_request.subject}\n\n{email_request.body}"
        
        # Encode the message
        encoded_message = base64.urlsafe_b64encode(message.encode()).decode()
        
        draft = {
            'message': {
                'raw': encoded_message
            }
        }
        
        created_draft = service.users().drafts().create(userId='me', body=draft).execute()
        
        return {
            "status": "success",
            "draft_id": created_draft.get('id'),
            "message": f"Draft email to {email_request.to} created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create email draft: {str(e)}")

@app.post("/api/v1/send_slack_notification")
async def send_slack_notification(
    notification_request: SlackNotificationRequest,
    authorization: Optional[str] = Header(None),
    _claims: dict = Depends(_validate_jwt_dependency)
):
    """
    Sends a Slack notification using webhook.
    """
    try:
        slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        
        if not slack_webhook_url:
            return {
                "status": "mock_success",
                "message": f"Mock: Would send '{notification_request.message}' to {notification_request.channel}",
                "note": "Set SLACK_WEBHOOK_URL environment variable for actual Slack integration"
            }
        
        # Use Slack SDK for better handling
        webhook = WebhookClient(slack_webhook_url)
        response = webhook.send(
            text=notification_request.message
        )
        
        if response.status_code == 200:
            return {
                "status": "success",
                "message": f"Notification sent to {notification_request.channel}"
            }
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to send Slack notification")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send Slack notification: {str(e)}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for service monitoring.
    """
    return {
        "status": "healthy",
        "service": "integrations",
        "mock_mode": MOCK_MODE,
        "allow_request_mocks": ALLOW_REQUEST_MOCKS,
        "auth_disabled": AUTH_DISABLED,
        "env": {
            "dotenv_path": _dotenv_path or None,
            "db_configured": bool(DATABASE_URL)
        }
    }