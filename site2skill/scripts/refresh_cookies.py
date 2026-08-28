#!/usr/bin/env python3
"""
Read fresh cookies for a domain directly from the local Chrome cookie store.

Works on macOS by reading the Chrome SQLite DB and decrypting cookies via
the encryption key stored in macOS Keychain.

Usage:
    python3 refresh_cookies.py --domain clubinhodeofertas.com.br
    python3 refresh_cookies.py --domain clubinhodeofertas.com.br --skill clubinho

When --skill is passed, the SKILL.md of that skill is updated in-place: the
"Cookie:" line in the credentials block is replaced with the fresh values.
"""

import argparse
import hashlib
import os
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

CHROME_DIR = Path.home() / "Library/Application Support/Google/Chrome"


def find_profile_for_domain(domain):
    """Search all Chrome profiles, return the one with most cookies for the domain."""
    best = (None, 0)
    for profile_dir in CHROME_DIR.iterdir():
        cookies_path = profile_dir / "Cookies"
        if not cookies_path.is_file():
            continue
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".db") as tmp:
                shutil.copy2(cookies_path, tmp.name)
            conn = sqlite3.connect(tmp.name)
            cur = conn.cursor()
            cur.execute(
                "SELECT COUNT(*) FROM cookies WHERE host_key LIKE ?",
                (f"%{domain}%",),
            )
            count = cur.fetchone()[0]
            conn.close()
            os.unlink(tmp.name)
            if count > best[1]:
                best = (profile_dir.name, count)
        except Exception:
            pass
    return best[0]


def get_keychain_key():
    """Get Chrome's encryption key from macOS Keychain."""
    out = subprocess.check_output(
        ["security", "find-generic-password", "-w", "-s", "Chrome Safe Storage"]
    )
    password = out.decode().strip()
    salt = b"saltysalt"
    iterations = 1003
    return hashlib.pbkdf2_hmac("sha1", password.encode(), salt, iterations, 16)


def decrypt_v10(encrypted_value, key):
    """Decrypt a Chrome v10/v11 encrypted cookie value using AES-128-CBC.

    Modern Chrome (~120+) prepends a 32-byte SHA-256 integrity hash to the
    plaintext, so after decryption we strip 32 bytes before returning.
    """
    if encrypted_value[:3] in (b"v10", b"v11"):
        encrypted_value = encrypted_value[3:]

    iv = b" " * 16
    proc = subprocess.run(
        [
            "openssl", "enc", "-aes-128-cbc", "-d",
            "-K", key.hex(),
            "-iv", iv.hex(),
            "-nopad",
        ],
        input=encrypted_value,
        capture_output=True,
    )
    plaintext = proc.stdout
    if not plaintext:
        return None
    pad_len = plaintext[-1]
    if 0 < pad_len <= 16:
        plaintext = plaintext[:-pad_len]

    # Strip 32-byte SHA-256 integrity prefix added by modern Chrome
    if len(plaintext) >= 32:
        candidate = plaintext[32:]
        try:
            return candidate.decode("utf-8")
        except UnicodeDecodeError:
            pass

    return plaintext.decode("utf-8", errors="replace")


def read_cookies(domain, profile=None):
    """Return list of (name, value) tuples for the domain from Chrome's cookie store."""
    if not profile:
        profile = find_profile_for_domain(domain)
        if not profile:
            print(f"ERRO: nenhum profile do Chrome tem cookies para {domain}.", file=sys.stderr)
            print("Abra o site no Chrome (logado), navegue um pouco, e tente de novo.", file=sys.stderr)
            sys.exit(1)
        print(f"Usando profile: {profile}", file=sys.stderr)

    cookies_path = CHROME_DIR / profile / "Cookies"
    with tempfile.NamedTemporaryFile(delete=False, suffix=".db") as tmp:
        shutil.copy2(cookies_path, tmp.name)

    try:
        conn = sqlite3.connect(tmp.name)
        cur = conn.cursor()
        cur.execute(
            "SELECT name, value, encrypted_value FROM cookies WHERE host_key LIKE ?",
            (f"%{domain}%",),
        )
        rows = cur.fetchall()
        conn.close()
    finally:
        os.unlink(tmp.name)

    if not rows:
        return []

    key = get_keychain_key()
    result = []
    for name, value, encrypted_value in rows:
        if value:
            result.append((name, value))
        elif encrypted_value:
            decrypted = decrypt_v10(encrypted_value, key)
            if decrypted is not None:
                result.append((name, decrypted))
    return result


def update_skill_cookies(skill_name, cookie_string):
    """Replace the Cookie: line in a skill's SKILL.md."""
    skill_path = Path.home() / ".claude/skills" / skill_name / "SKILL.md"
    if not skill_path.is_file():
        print(f"ERRO: skill não encontrada em {skill_path}", file=sys.stderr)
        sys.exit(1)

    content = skill_path.read_text(encoding="utf-8")
    new_cookie_line = f"Cookie: {cookie_string}"
    new_content, n = re.subn(
        r"^Cookie: .*$",
        new_cookie_line,
        content,
        count=1,
        flags=re.MULTILINE,
    )
    if n == 0:
        print(f"AVISO: nenhuma linha 'Cookie: ...' encontrada em {skill_path}.", file=sys.stderr)
        print("A skill pode não usar esse formato. Cookies impressos no stdout.", file=sys.stderr)
        return False

    skill_path.write_text(new_content, encoding="utf-8")
    print(f"OK: cookies atualizados em {skill_path}", file=sys.stderr)
    return True


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--domain", required=True, help="Ex: clubinhodeofertas.com.br")
    p.add_argument("--skill", default=None, help="Nome da skill para atualizar in-place")
    p.add_argument("--profile", default=None, help="Profile específico (ex: 'Profile 14')")
    p.add_argument("--filter", default=None,
                   help="Regex de nomes de cookies a incluir (default: tudo de sessão)")
    args = p.parse_args()

    cookies = read_cookies(args.domain, args.profile)
    if not cookies:
        print(f"ERRO: 0 cookies decriptados para {args.domain}", file=sys.stderr)
        sys.exit(1)

    if args.filter:
        pattern = re.compile(args.filter)
        cookies = [(n, v) for n, v in cookies if pattern.search(n)]

    cookie_string = "; ".join(f"{n}={v}" for n, v in cookies)

    if args.skill:
        update_skill_cookies(args.skill, cookie_string)
    else:
        print(cookie_string)


if __name__ == "__main__":
    main()
