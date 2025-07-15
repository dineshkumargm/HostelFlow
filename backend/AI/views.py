from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from openai import OpenAI
from api.models import Service
import json
from rest_framework.permissions import AllowAny
from bson import ObjectId

# Create OpenAI client targeting OpenRouter
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",
)

@api_view(['POST'])
def chat_with_ai(request):
    user_message = request.data.get('user_message', '').strip()
    previous_state = request.data.get('previous_state', {})

    if not user_message:
        return Response({'response': 'No user message received.'}, status=400)

    prompt = f"""
        You are an AI booking assistant.

        You will get:
        - context: previous extracted fields (intent, serviceType, date, time, instructions)
        - user_message: new user input

        Update the fields based on user input.

        **Important:**
        - If user says "tomorrow", "today", "next Monday", etc., resolve to actual date in format: "2025-07-14"
        - intent should always be lowercased: one of: "book", "cancel", "reschedule", "info", "other"
        - serviceType: "laundry", "room cleaning", "study space", "room repairs", "tech support"
        - booked should be true only if date and time are both set.
        - completed_service always stays false.

        Return only valid JSON:
        {{
        "response": "...",
        "intent": "...",
        "serviceType": "...",
        "date": "...",  # resolved date like "2025-07-14"
        "time": "...",
        "instructions": "...",
        "booked": true/false,
        "completed_service": false
        }}

        context:
        {json.dumps(previous_state, ensure_ascii=False)}

        user_message: "{user_message}"
        """


    try:
        completion = client.chat.completions.create(
            model="mistralai/mistral-7b-instruct:free",
            messages=[
                {"role": "system", "content": "You are a helpful assistant to book hostel services."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
        )

        raw_text = completion.choices[0].message.content.strip()

        # Parse the JSON safely
        parsed = json.loads(raw_text)

        # Ensure required fields exist
        required_fields = ["response", "intent", "serviceType", "date", "time", "instructions", "booked", "completed_service"]
        for field in required_fields:
            if field not in parsed:
                parsed[field] = None if field not in ["booked", "completed_service"] else False

        return Response(parsed)

    except Exception as e:
        print("Error from OpenRouter:", e)
        fallback = {
            "response": "Sorry, something went wrong. Please try again.",
            "intent": None,
            "serviceType": None,
            "date": None,
            "time": None,
            "instructions": None,
            "booked": False,
            "completed_service": False
        }
        return Response(fallback, status=500)
    
from bson.decimal128 import Decimal128

@api_view(['GET'])
def get_service_by_name(request, name):
    service = Service.objects.filter(name__iexact=name).first()
    if not service:
        return Response({'error': 'Service not found'}, status=404)

    # Convert Decimal128 to float or str
    price = float(service.price.to_decimal()) if isinstance(service.price, Decimal128) else float(service.price)

    return Response({
        'id': str(service.id),
        'name': service.name,
        'description': service.description,
        'price': price,
        'duration': service.duration,
        'rating': service.rating,
        'availability': service.availability,
        'provider_name': service.provider_name
    })
