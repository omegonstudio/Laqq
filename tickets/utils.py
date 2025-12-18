"""
Utility functions for ticket management
"""
import secrets
import string


def generate_secure_password(length=12):
    """
    Generate a secure random password for client users.

    Args:
        length: Password length (default 12 characters)

    Returns:
        str: Random password containing uppercase, lowercase, digits and special chars
    """
    # Ensure minimum length
    if length < 8:
        length = 8

    # Define character sets
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special = '!@#$%^&*-_=+'

    # Combine all character sets
    all_chars = lowercase + uppercase + digits + special

    # Ensure password contains at least one of each character type
    password = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(special),
    ]

    # Fill remaining length with random characters
    password += [secrets.choice(all_chars) for _ in range(length - 4)]

    # Shuffle to avoid predictable pattern
    secrets.SystemRandom().shuffle(password)

    return ''.join(password)


def generate_username_from_contact(contact):
    """
    Generate a unique username from contact information.

    Args:
        contact: Contact instance

    Returns:
        str: Unique username based on contact email
    """
    # Use email prefix as base
    if contact.email:
        base_username = contact.email.split('@')[0]
    else:
        # Fallback to name
        base_username = f"{contact.first_name.lower()}{contact.last_name.lower()}"

    # Remove special characters and limit length
    base_username = ''.join(c for c in base_username if c.isalnum() or c in '-_')
    base_username = base_username[:20]

    # Make unique by adding random suffix if needed
    from users.models import User
    username = base_username
    counter = 1

    while User.objects.filter(username=username).exists():
        # Add random suffix
        suffix = secrets.token_hex(2)  # 4 chars
        username = f"{base_username}_{suffix}"
        counter += 1
        if counter > 10:  # Safety limit
            username = f"client_{secrets.token_hex(4)}"
            break

    return username
