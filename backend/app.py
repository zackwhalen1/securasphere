#!/usr/bin/env python3
"""
SecuraSphere Unified Backend
Combines phishing detection, AI assistant, and social media exposure analyzer
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from dotenv import load_dotenv
import joblib
from groq import Groq

# adds parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.smea.instagram_service import InstagramService
from src.smea.facebook_service import FacebookService
from src.smea.pii_engine import PIIEngine
from src.smea.risk_model import RiskModel

# loads environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # allows frontend to connect

# ============================================================================
# INITIALIZE GROQ AI ASSISTANT
# ============================================================================
groq_client = None
try:
    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key:
        groq_client = Groq(api_key=groq_api_key)
        print("[OK] Groq AI Assistant initialized successfully")
    else:
        print("[WARNING] GROQ_API_KEY not found. AI Assistant will be unavailable.")
except Exception as e:
    print(f"[WARNING] Error initializing Groq client: {str(e)}")

# AI Assistant system prompt
SYSTEM_PROMPT = """
You are the SecuraSphere AI helper, a friendly cybersecurity tutor.
Your name is Aegis, which comes from the name of the shield used by Zeus and Athena in Greek mythology.
You explain things clearly and simply, focusing on:
- password strength and safe password practices
- phishing detection and safe email behavior
- social media privacy and online safety
- general cybersecurity best practices

Be encouraging, helpful, and non-judgmental. Avoid asking for real passwords or sensitive info;
if needed, ask users to use made-up examples instead.
"""

# ============================================================================
# LOAD PHISHING DETECTION MODEL
# ============================================================================
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models/phishing_model.pkl")
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), "models/vectorizer.pkl")

phishing_model = None
vectorizer = None

try:
    if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
        phishing_model = joblib.load(MODEL_PATH)
        vectorizer = joblib.load(VECTORIZER_PATH)
        print("[OK] Phishing detection model loaded successfully")
    else:
        print("[WARNING] Phishing model files not found. Phishing detection will be unavailable.")
        print(f"   Expected: {MODEL_PATH}")
except Exception as e:
    print(f"[WARNING] Error loading phishing model: {str(e)}")


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route("/")
def home():
    return jsonify({
        "message": "SecuraSphere Unified Backend is running!",
        "services": {
            "phishing_detection": phishing_model is not None,
            "ai_assistant": groq_client is not None,
            "instagram_analyzer": os.getenv("APIFY_TOKEN") is not None,
            "facebook_analyzer": os.getenv("APIFY_TOKEN") is not None
        }
    })

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "services": {
            "phishing_detection": phishing_model is not None,
            "ai_assistant": groq_client is not None,
            "instagram_analyzer": os.getenv("APIFY_TOKEN") is not None,
            "facebook_analyzer": os.getenv("APIFY_TOKEN") is not None
        }
    })

# ============================================================================
# PHISHING DETECTION ENDPOINTS
# ============================================================================

@app.route("/phishing/predict", methods=["POST"])
def predict_phishing():
    if phishing_model is None or vectorizer is None:
        return jsonify({
            "error": "Phishing detection model not available. Please run train_model.py first."
        }), 503
    
    try:
        data = request.get_json()
        email_text = data.get("email", "")

        if not email_text.strip():
            return jsonify({"error": "No email text provided"}), 400

        # Transform input with the trained vectorizer
        features = vectorizer.transform([email_text])
        prediction = phishing_model.predict(features)[0]
        
        # Get prediction probability if available
        try:
            probabilities = phishing_model.predict_proba(features)[0]
            confidence = float(max(probabilities) * 100)
        except:
            confidence = None

        label = "phishing" if prediction == 1 else "legit"

        return jsonify({
            "success": True,
            "email": email_text[:200] + "..." if len(email_text) > 200 else email_text,
            "prediction": int(prediction),
            "label": label,
            "confidence": confidence,
            "message": f"Email classified as {label}"
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Prediction failed: {str(e)}"
        }), 500

@app.route("/predict", methods=["POST"])
def predict_legacy():
    """Legacy endpoint for backward compatibility"""
    return predict_phishing()

# ============================================================================
# AI ASSISTANT ENDPOINT
# ============================================================================

@app.route("/assistant", methods=["POST"])
def assistant():
    """
    AI helper endpoint for SecuraSphere using Groq.
    """
    if groq_client is None:
        return jsonify({
            "error": "AI Assistant not available. Please configure GROQ_API_KEY in .env file."
        }), 503
    
    try:
        data = request.get_json(force=True)
        user_messages = data.get("messages", [])
        
        if not isinstance(user_messages, list):
            return jsonify({"error": "messages must be a list"}), 400

        # Prepend system prompt
        messages = [{"role": "system", "content": SYSTEM_PROMPT}] + user_messages

        # Groq uses an OpenAI-compatible API for chat completions
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",  # good, fast, free-ish model
            messages=messages,
        )
        
        reply = response.choices[0].message

        return jsonify({
            "message": {
                "role": reply.role,
                "content": reply.content
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Groq error: {str(e)}"}), 500

# ============================================================================
# INSTAGRAM ANALYSIS ENDPOINTS
# ============================================================================

@app.route("/instagram/validate", methods=["GET"])
def validate_instagram_service():
    """Validates Instagram service configuration"""
    try:
        instagram_service = InstagramService.create_service()
        validation_result = instagram_service.validate_token()
        
        if validation_result["valid"]:
            return jsonify({
                "valid": True,
                "message": "Instagram service is properly configured",
                "details": validation_result
            })
        else:
            return jsonify({
                "valid": False,
                "error": validation_result.get("error", "Validation failed")
            }), 500
            
    except Exception as e:
        return jsonify({
            "valid": False,
            "error": f"Service configuration error: {str(e)}"
        }), 500

@app.route("/instagram/analyze", methods=["POST"])
def analyze_instagram():
    """Analyzes Instagram profile for PII exposure"""
    try:
        data = request.get_json()
        username = data.get("username", "").strip()

        if not username:
            return jsonify({"error": "Username is required"}), 400

        print(f"[INFO] Starting analysis for @{username}")

        # Initialize services
        instagram_service = InstagramService.create_service()
        pii_engine = PIIEngine()
        risk_model = RiskModel()

        # Get Instagram data
        user_data = instagram_service.get_user_data(username)
        print(f"[OK] Retrieved data for @{username}")
        
        # Extract text content for analysis
        text_content = instagram_service.extract_text_content(user_data)
        print(f"[INFO] Extracted text content: {len(text_content.get('posts', []))} posts")
        
        # Run PII analysis
        findings = pii_engine.scan_for_pii(text_content)
        print(f"[WARNING] Found {len(findings)} PII findings")
        
        # Calculate risk assessment
        analysis_data = [{"platform": "instagram", "findings": findings}]
        risk_score = risk_model.calculate_risk_score(analysis_data)
        risk_level = risk_model.get_risk_level(risk_score)
        recommendations = risk_model.generate_recommendations(analysis_data)
        
        print(f"[INFO] Risk score: {risk_score}/100 ({risk_level})")
        
        # Prepare response
        response_data = {
            "success": True,
            "userData": user_data,
            "textContent": text_content,
            "findings": findings,
            "riskScore": risk_score,
            "riskLevel": risk_level,
            "recommendations": recommendations[:8],  # Limit to top 8
            "totalFindings": len(findings),
            "severityBreakdown": pii_engine.get_summary(findings),
            "profileStats": {
                "postsAnalyzed": len(text_content.get("posts", [])),
                "commentsAnalyzed": len(text_content.get("comments", [])),
                "totalTextLength": len(" ".join([
                    text_content.get("bio", ""),
                    *text_content.get("posts", []),
                    *text_content.get("comments", [])
                ])),
                "hasProfilePicture": bool(user_data.get("user", {}).get("profilePictureUrl")),
                "isVerified": user_data.get("user", {}).get("isVerified", False)
            }
        }
        
        return jsonify(response_data)

    except ValueError as e:
        error_msg = f"Configuration error: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return jsonify({"success": False, "error": error_msg}), 500
    except Exception as e:
        error_msg = f"Analysis failed: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return jsonify({"success": False, "error": error_msg}), 500

# ============================================================================
# FACEBOOK ANALYSIS ENDPOINTS
# ============================================================================

@app.route("/facebook/validate", methods=["GET"])
def validate_facebook_service():
    """Validates Facebook service configuration"""
    try:
        facebook_service = FacebookService.create_service()
        validation_result = facebook_service.validate_token()
        
        if validation_result["valid"]:
            return jsonify({
                "valid": True,
                "message": "Facebook service is properly configured",
                "details": validation_result
            })
        else:
            return jsonify({
                "valid": False,
                "error": validation_result.get("error", "Validation failed")
            }), 500
            
    except Exception as e:
        return jsonify({
            "valid": False,
            "error": f"Service configuration error: {str(e)}"
        }), 500

@app.route("/facebook/analyze", methods=["POST"])
def analyze_facebook():
    """Analyzes Facebook page for PII exposure"""
    try:
        data = request.get_json()
        page_url = data.get("pageUrl", "").strip()

        if not page_url:
            return jsonify({"error": "Page URL is required"}), 400

        print(f"[INFO] Starting Facebook analysis for {page_url}")

        # Initialize services
        facebook_service = FacebookService.create_service()
        pii_engine = PIIEngine()
        risk_model = RiskModel()

        # Get Facebook data
        user_data = facebook_service.get_user_data(page_url)
        print(f"[INFO] Retrieved data for {user_data.get('user', {}).get('name', 'Unknown')}")
        
        # Extract text content for analysis
        text_content = facebook_service.extract_text_content(user_data)
        print(f"[INFO] Extracted text content: {len(text_content.get('posts', []))} posts")
        
        # Run PII analysis
        findings = pii_engine.scan_for_pii(text_content)
        print(f"[WARNING] Found {len(findings)} PII findings")
        
        # Calculate risk assessment
        analysis_data = [{"platform": "facebook", "findings": findings}]
        risk_score = risk_model.calculate_risk_score(analysis_data)
        risk_level = risk_model.get_risk_level(risk_score)
        recommendations = risk_model.generate_recommendations(analysis_data)
        
        print(f"[INFO] Risk score: {risk_score}/100 ({risk_level})")
        
        # Prepare response
        response_data = {
            "success": True,
            "userData": user_data,
            "textContent": text_content,
            "findings": findings,
            "riskScore": risk_score,
            "riskLevel": risk_level,
            "recommendations": recommendations[:8],  # Limit to top 8
            "totalFindings": len(findings),
            "severityBreakdown": pii_engine.get_summary(findings),
            "profileStats": {
                "postsAnalyzed": len(text_content.get("posts", [])),
                "commentsAnalyzed": len(text_content.get("comments", [])),
                "totalTextLength": len(" ".join([
                    text_content.get("bio", ""),
                    *text_content.get("posts", []),
                    *text_content.get("comments", [])
                ])),
                "hasProfilePicture": bool(user_data.get("user", {}).get("profilePictureUrl")),
                "isVerified": user_data.get("user", {}).get("isVerified", False)
            }
        }
        
        return jsonify(response_data)

    except ValueError as e:
        error_msg = f"Configuration error: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return jsonify({"success": False, "error": error_msg}), 500
    except Exception as e:
        error_msg = f"Analysis failed: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return jsonify({"success": False, "error": error_msg}), 500

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("  SECURASPHERE UNIFIED BACKEND")
    print("=" * 70)
    
    # Check configuration
    print("\n[INFO] Service Status:")
    print("-" * 70)
    
    # Phishing detection
    if phishing_model and vectorizer:
        print("[OK] Phishing Detection: READY")
    else:
        print("[ERROR] Phishing Detection: MODEL NOT LOADED")
        print("   Run 'python train_model.py' to train the model")
    
    # AI Assistant
    if groq_client:
        print("[OK] AI Assistant (Aegis): READY")
    else:
        print("[WARNING] AI Assistant: GROQ_API_KEY not configured")
        print("   Add GROQ_API_KEY to your .env file")
    
    # Social media analyzers
    apify_token = os.getenv("APIFY_TOKEN")
    if apify_token and apify_token != "your_apify_token_here":
        print("[OK] Instagram Analyzer: READY")
        print("[OK] Facebook Analyzer: READY")
    else:
        print("[WARNING] Instagram Analyzer: APIFY_TOKEN not configured")
        print("[WARNING] Facebook Analyzer: APIFY_TOKEN not configured")
        print("   Get your token from: https://console.apify.com/account/integrations")
    
    print("-" * 70)
    print("\n[STARTING] Server on http://localhost:5000")
    print("   Frontend should connect to: http://localhost:5000")
    print("\n[INFO] Available endpoints:")
    print("   - GET  / (health check)")
    print("   - GET  /health")
    print("   - POST /phishing/predict")
    print("   - POST /predict (legacy)")
    print("   - POST /assistant")
    print("   - GET  /instagram/validate")
    print("   - POST /instagram/analyze")
    print("   - GET  /facebook/validate")
    print("   - POST /facebook/analyze")
    print("\n[INFO] Press Ctrl+C to stop\n")
    
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
