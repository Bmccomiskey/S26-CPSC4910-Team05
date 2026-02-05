from typing import List, Tuple

def validate_password_complexity(password: str) -> Tuple[bool, List[str]]:
    """
    This function is used to validate the password complexity policy.

    Args:
        password (str): the password that needs validation

    Returns:
        Tuple[bool, List[str]]: A tuple indicating if the password is valid and a list of any errors found.

    """
    errors = []
    
    if len(password) < 12:
        errors.append("Password must be at least 12 characters long.")
    if not any(char.isupper() for char in password):
        errors.append("Password must contain at least one uppercase letter.")
    if not any(char.islower() for char in password):
        errors.append("Password must contain at least one lowercase letter.")
    if not any(char.isdigit() for char in password):
        errors.append("Password must contain at least one digit.")
    if not any(char in "!@#$%^&*()-_=+[]{}|;:'\",.<>?/`~" for char in password):
        errors.append("Password must contain at least one special character.")
    
    return (len(errors) == 0, errors)