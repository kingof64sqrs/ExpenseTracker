from flask import Flask, jsonify, request
from pymongo import MongoClient
import datetime
import time
import requests
from threading import Thread
from flask_cors import CORS
import logging

app = Flask(__name__)
# Configure CORS to allow requests from any origin
CORS(app, resources={r"/*": {"origins": "*"}})

# Set up logging
logging.basicConfig(level=logging.DEBUG)
app.logger.setLevel(logging.DEBUG)

# Initialize the global variable for recommendations
latest_recommendation = "No recommendations available yet."

# Azure OpenAI Configuration
azure_endpoint = "https://opeanai-eastus.openai.azure.com/"
api_key = ""
model = ""

# MongoDB Configuration
mongo_uri = "mongodb://localhost:27017"
client = MongoClient(mongo_uri)
db = client.expense_tracker
expenses_col = db.expenses
budgets_col = db.budgets

USER_ID = "6804ae11364365edef0f84da"

def query_openai(messages):
    url = f"{azure_endpoint}/openai/deployments/{model}/chat/completions?api-version=2023-05-15"
    
    headers = {
        "Content-Type": "application/json",
        "api-key": api_key
    }

    data = {"messages": messages}
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code != 200:
        return f"Error: {response.status_code}, {response.text}"
    
    return response.json()["choices"][0]["message"]["content"]

def get_user_expense_summary(user_id):
    today = datetime.date.today()
    start_of_month = today.replace(day=1)

    expenses = list(expenses_col.find({
        "userId": user_id,
        "date": {"$gte": start_of_month.isoformat()}
    }))

    budgets = list(budgets_col.find({"userId": user_id}))
    summary = {}
    for expense in expenses:
        category = expense["category"]
        summary.setdefault(category, 0)
        summary[category] += expense["amount"]

    budget_dict = {b["category"]: b["amount"] for b in budgets}
    overspending_lines = []

    for category, spent in summary.items():
        budget = budget_dict.get(category, 0)
        if budget and spent > budget:
            percent_reduce = round(((spent - budget) / spent) * 100, 2)
            overspending_lines.append(
                f"{category}: Spent ₹{spent}, Budget ₹{budget}, Suggest Reduce By {percent_reduce}%"
            )

    if not overspending_lines:
        return "No overspending detected this month."

    return "\n".join(overspending_lines)

def generate_and_send_budget_explanation():
    chat_history = [
        {
            "role": "system",
            "content": (
                "You are a friendly budget advisor. Based on monthly expenses in ₹, suggest max 3 categories "
                "where the user is overspending. Each line should be natural, like:\n"
                "'You're overspending on Transport. Reduce it by 40% to stay within your ₹3000 budget.'\n"
                "Keep it short and friendly. Do NOT include categories where budget is not exceeded."
            )
        }
    ]
    
    while True:
        expense_summary = get_user_expense_summary(USER_ID)
        user_query = f"Here is my spending and budget data for this month:\n{expense_summary}\nGive only 2 or 3 natural-sounding suggestions."
        chat_history.append({"role": "user", "content": user_query})

        response = query_openai(chat_history)
        chat_history.append({"role": "assistant", "content": response})

        global latest_recommendation
        latest_recommendation = response

        print("\nGenerated Budget Recommendation:\n" + response + "\n")

        time.sleep(30)

# Routes from main.py
@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "ok", "message": "Flask API is running"})

@app.route('/get-latest-recommendation', methods=['GET'])
def get_recommendation_endpoint():
    app.logger.debug("Received request to /get-latest-recommendation endpoint")
    # Parse the recommendation text into structured data
    recommendations = []
    
    if latest_recommendation and latest_recommendation != "No recommendations available yet.":
        # Split by lines to get individual recommendations
        lines = latest_recommendation.strip().split('\n')
        
        for i, line in enumerate(lines):
            if not line.strip():
                continue
                
            # Create a structured recommendation
            rec = {
                "id": f"ai-rec-{i+1}",
                "category": "Unknown",
                "currentBudget": 0,
                "recommendedBudget": 0,
                "reason": line,
                "impact": "decrease",
                "confidence": 0.9
            }
            
            # Try to extract category and budget information
            if "overspending on" in line.lower():
                parts = line.split("overspending on", 1)
                if len(parts) > 1:
                    category_part = parts[1].split(".", 1)[0].strip()
                    rec["category"] = category_part
            
            # Try to extract percentage
            if "reduce" in line.lower() and "%" in line:
                try:
                    percent_text = line.split("reduce", 1)[1]
                    percent = ''.join(c for c in percent_text if c.isdigit() or c == '.')
                    if percent:
                        rec["confidence"] = float(percent) / 100
                except:
                    pass
            
            # Try to extract budget amount
            if "₹" in line or "$" in line:
                try:
                    budget_part = line.split("₹", 1)[1] if "₹" in line else line.split("$", 1)[1]
                    budget_amount = ''.join(c for c in budget_part.split()[0] if c.isdigit() or c == '.')
                    if budget_amount:
                        rec["currentBudget"] = float(budget_amount)
                        # Estimate recommended budget (20% less than current)
                        rec["recommendedBudget"] = rec["currentBudget"] * 0.8
                except:
                    pass
            
            recommendations.append(rec)
    
    return jsonify({
        "message": latest_recommendation,
        "recommendations": recommendations
    })

# Routes from chatbot_api.py
@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    app.logger.debug("Received request to /api/chat endpoint")
    data = request.json
    user_message = data.get('message', '')
    
    if user_message.lower() == 'budget':
        expense_summary = get_user_expense_summary(USER_ID)
        user_query = f"Here is my spending and budget data for this month:\n{expense_summary}\nGive only 2 or 3 natural-sounding suggestions."
    else:
        user_query = user_message
    
    chat_history = [
        {
            "role": "system",
            "content": (
                "You are a friendly budget advisor. Based on monthly expenses in ₹, suggest max 3 categories "
                "where the user is overspending. Each line should be natural, like:\n"
                "'You're overspending on Transport. Reduce it by 40% to stay within your ₹3000 budget.'\n"
                "Keep it short and friendly. Do NOT include categories where budget is not exceeded."
            )
        },
        {"role": "user", "content": user_query}
    ]
    
    response = query_openai(chat_history)
    
    return jsonify({
        "message": response
    })

@app.route('/get-latest-recommendation-detailed', methods=['GET'])
def get_latest_recommendation_detailed():
    app.logger.debug("Received request to /get-latest-recommendation-detailed endpoint")
    try:
        # Get user expense summary
        expense_summary = get_user_expense_summary(USER_ID)
        
        # Create a query for budget recommendations
        user_query = f"Here is my spending and budget data for this month:\n{expense_summary}\nGive only 2 or 3 natural-sounding suggestions."
        
        # Create chat history
        chat_history = [
            {
                "role": "system",
                "content": (
                    "You are a friendly budget advisor. Based on monthly expenses in ₹, suggest max 3 categories "
                    "where the user is overspending. Each line should be natural, like:\n"
                    "'You're overspending on Transport. Reduce it by 40% to stay within your ₹3000 budget.'\n"
                    "Keep it short and friendly. Do NOT include categories where budget is not exceeded."
                )
            },
            {"role": "user", "content": user_query}
        ]
        
        # Get response from OpenAI
        response = query_openai(chat_history)
        
        # Parse the response into recommendations
        recommendations = []
        
        # Check if this is a positive feedback message (no overspending)
        if "fantastic" in response.lower() or "great job" in response.lower() or "good job" in response.lower() or "well done" in response.lower():
            # This is positive feedback, add each line as a separate recommendation
            for i, line in enumerate(response.split('\n')):
                if line.strip():
                    if i == 0:  # First line is usually the main message
                        recommendations.append({
                            "category": "Overall",
                            "percentage": 0,
                            "message": line.strip(),
                            "isPositive": True
                        })
                    else:  # Numbered tips or additional advice
                        recommendations.append({
                            "category": f"Tip {i}",
                            "percentage": 0,
                            "message": line.strip(),
                            "isPositive": True
                        })
        else:
            # This is feedback about overspending
            for line in response.split('\n'):
                if line.strip():
                    # Extract category and percentage if possible
                    parts = line.split('Reduce it by')
                    if len(parts) > 1:
                        category = parts[0].replace("You're overspending on", "").strip()
                        percentage = parts[1].split('%')[0].strip()
                        try:
                            percentage = float(percentage)
                        except ValueError:
                            percentage = 0
                        
                        recommendations.append({
                            "category": category.replace('.', ''),
                            "percentage": percentage,
                            "message": line.strip(),
                            "isPositive": False
                        })
                    else:
                        # If we can't parse it, just add the whole line
                        recommendations.append({
                            "category": "General",
                            "percentage": 0,
                            "message": line.strip(),
                            "isPositive": False
                        })
        
        return jsonify({
            "recommendations": recommendations
        })
    except Exception as e:
        app.logger.error(f"Error generating recommendations: {str(e)}")
        return jsonify({
            "error": str(e),
            "recommendations": []
        }), 500

if __name__ == "__main__":
    latest_recommendation = ""
    
    # Print all registered routes for debugging
    print("\nRegistered Flask Routes:")
    for rule in app.url_map.iter_rules():
        print(f"Route: {rule.rule}, Methods: {rule.methods}, Endpoint: {rule.endpoint}")
    print()
    
    # Start the background thread for generating recommendations
    backend_thread = Thread(target=generate_and_send_budget_explanation)
    backend_thread.daemon = True
    backend_thread.start()

    # Run the Flask app on port 5001 to match frontend expectations
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)
