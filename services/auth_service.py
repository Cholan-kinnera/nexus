



async def signup_service(email: str):
    return {
        "message": "Signup successful",
        "email": email
    }

async def login_service(email: str):
    return {
        "message": "Login successful",
        "email": email
    }