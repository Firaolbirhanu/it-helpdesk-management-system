from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    generate_secure_token,
    hash_refresh_token,
)


def test_access_token_round_trip():
    token = create_access_token({"sub": "42", "role": "Employee"})
    payload = decode_access_token(token, "access")

    assert payload is not None
    assert payload["sub"] == "42"
    assert payload["role"] == "Employee"
    assert payload["token_type"] == "access"


def test_refresh_token_round_trip():
    token = create_refresh_token({"sub": "42", "role": "Employee"})
    payload = decode_access_token(token, "refresh")

    assert payload is not None
    assert payload["sub"] == "42"
    assert payload["role"] == "Employee"
    assert payload["token_type"] == "refresh"


def test_expired_access_token_is_rejected():
    token = create_access_token(
        {"sub": "42", "role": "Employee"},
        expires_minutes=-1,
    )

    assert decode_access_token(token, "access") is None


def test_wrong_token_type_is_rejected():
    token = create_refresh_token({"sub": "42", "role": "Employee"})

    assert decode_access_token(token, "access") is None


def test_refresh_tokens_are_stored_as_one_way_hashes():
    token = generate_secure_token(48)
    hashed = hash_refresh_token(token)

    assert hashed != token
    assert len(hashed) == 64
    assert hash_refresh_token(token) == hashed
