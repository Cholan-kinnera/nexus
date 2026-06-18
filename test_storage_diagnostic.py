"""
Definitive .env → os.getenv() → StorageService Loading Chain Diagnostic
=========================================================================
Traces every step from .env file discovery to StorageService initialization.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    print()
    print("=" * 70)
    print("  .env LOADING CHAIN DIAGNOSTIC")
    print("=" * 70)

    # ── 1. Find which .env file load_dotenv() will load ─────────────────
    print()
    print("[1/7] WHICH .env FILE IS LOADED?")
    print("-" * 50)

    from dotenv import find_dotenv, dotenv_values

    # find_dotenv() walks up from CWD to find .env
    found_env_path = find_dotenv(usecwd=True)
    print(f"  CWD                    : {os.getcwd()}")
    print(f"  find_dotenv() resolved : {found_env_path or '(NOT FOUND)'}")

    # Also check explicit project root
    project_root_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    print(f"  Project root .env      : {project_root_env}")
    print(f"  Exists?                : {os.path.exists(project_root_env)}")

    if found_env_path:
        abs_found = os.path.abspath(found_env_path)
        abs_root = os.path.abspath(project_root_env)
        print(f"  Same file?             : {abs_found == abs_root}")

    # ── 2. Print absolute path ──────────────────────────────────────────
    print()
    print("[2/7] ABSOLUTE PATH OF LOADED .env")
    print("-" * 50)
    target_env = found_env_path or project_root_env
    abs_path = os.path.abspath(target_env)
    print(f"  Absolute path : {abs_path}")
    print(f"  File size     : {os.path.getsize(abs_path)} bytes")

    # Parse the .env file BEFORE loading into os.environ
    raw_values = dotenv_values(abs_path)
    print(f"  Total keys    : {len(raw_values)}")

    # ── 3. Check R2 vars in the raw .env file ───────────────────────────
    print()
    print("[3/7] R2 VARIABLES IN .env FILE (raw parse)")
    print("-" * 50)
    r2_keys = [
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET_NAME",
        "R2_PUBLIC_URL",
    ]
    for key in r2_keys:
        raw_val = raw_values.get(key)
        if raw_val is None:
            status = "KEY MISSING from .env file"
        elif raw_val == "":
            status = "KEY EXISTS but VALUE IS EMPTY STRING ''"
        else:
            # Mask secrets
            if "SECRET" in key or "ACCESS_KEY" in key:
                status = f"SET ({raw_val[:4]}...{raw_val[-4:]})" if len(raw_val) > 8 else f"SET ({raw_val})"
            else:
                status = f"SET ({raw_val})"
        print(f"  {key:25s} : {status}")

    # ── 4. Verify load_dotenv() executes BEFORE StorageService ──────────
    print()
    print("[4/7] LOAD ORDER: load_dotenv() vs StorageService()")
    print("-" * 50)

    # Check os.environ BEFORE load_dotenv
    pre_load = {k: os.environ.get(k) for k in r2_keys}
    print("  BEFORE load_dotenv():")
    for k, v in pre_load.items():
        print(f"    os.environ[{k:25s}] = {repr(v)}")

    # Now load
    from dotenv import load_dotenv
    loaded = load_dotenv(abs_path, override=False)
    print(f"\n  load_dotenv('{abs_path}', override=False)")
    print(f"  Returned: {loaded}")

    # Check os.environ AFTER load_dotenv
    post_load = {k: os.environ.get(k) for k in r2_keys}
    print("\n  AFTER load_dotenv():")
    for k, v in post_load.items():
        changed = " <-- CHANGED" if v != pre_load[k] else ""
        print(f"    os.environ[{k:25s}] = {repr(v)}{changed}")

    # ── 5. Verify os.getenv() returns what StorageService will see ──────
    print()
    print("[5/7] os.getenv() VALUES (what StorageService reads)")
    print("-" * 50)
    for key in r2_keys:
        val = os.getenv(key)
        truthiness = bool(val)
        print(f"  os.getenv('{key}') = {repr(val):30s}  bool={truthiness}")

    all_set = all(os.getenv(k) for k in r2_keys[:4])  # first 4 are required
    print(f"\n  all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME]) = {all_set}")
    print(f"  not all(...) = {not all_set}")
    print(f"  => use_simulator = {not all_set}")

    # ── 6. Check for duplicate / overriding .env files ──────────────────
    print()
    print("[6/7] DUPLICATE .env FILES")
    print("-" * 50)
    env_files_found = []
    for root, dirs, files in os.walk(os.path.dirname(os.path.abspath(__file__))):
        # Skip venv, node_modules, .git
        dirs[:] = [d for d in dirs if d not in ("venv", "node_modules", ".git", "__pycache__", "dist")]
        for f in files:
            if f.startswith(".env"):
                full = os.path.join(root, f)
                env_files_found.append(full)

    for ef in env_files_found:
        size = os.path.getsize(ef)
        # Check if this file has any R2 vars
        ev = dotenv_values(ef)
        has_r2 = any(k in ev for k in r2_keys)
        r2_note = " [CONTAINS R2 VARS]" if has_r2 else ""
        print(f"  {ef} ({size} bytes){r2_note}")

    if len([ef for ef in env_files_found if dotenv_values(ef).get("R2_ACCOUNT_ID") is not None]) > 1:
        print("  *** WARNING: Multiple files define R2_ACCOUNT_ID — possible override conflict!")
    else:
        print("  No override conflicts detected.")

    # ── 7. Startup diagnostics summary ──────────────────────────────────
    print()
    print("[7/7] STARTUP DIAGNOSTICS SUMMARY")
    print("-" * 50)
    print(f"  Loaded .env path  : {abs_path}")

    acct = os.getenv("R2_ACCOUNT_ID")
    bucket = os.getenv("R2_BUCKET_NAME")
    pub_url = os.getenv("R2_PUBLIC_URL")

    if all_set:
        endpoint = f"https://{acct}.r2.cloudflarestorage.com"
        print(f"  R2 Mode           : LIVE (Cloudflare R2)")
        print(f"  Bucket Name       : {bucket}")
        print(f"  Endpoint URL      : {endpoint}")
        print(f"  Public URL        : {pub_url or '(will use <bucket>.r2.dev)'}")
    else:
        print(f"  R2 Mode           : SIMULATOR (local disk)")
        print(f"  Bucket Name       : (not configured)")
        print(f"  Endpoint URL      : (not configured)")
        print(f"  Local storage     : {os.path.join(os.path.dirname(abs_path), 'local_storage_uploads')}")

    # ── ROOT CAUSE ──────────────────────────────────────────────────────
    print()
    print("=" * 70)
    print("  ROOT CAUSE ANALYSIS")
    print("=" * 70)

    empty_vars = [k for k in r2_keys[:4] if not os.getenv(k)]
    if empty_vars:
        print(f"""
  The following REQUIRED R2 variables are empty/missing in {abs_path}:
""")
        for v in empty_vars:
            raw = raw_values.get(v)
            if raw is None:
                reason = "Key not present in .env file"
            elif raw == "":
                reason = "Key exists but value is empty (e.g., 'R2_ACCOUNT_ID=')"
            else:
                reason = f"Has value but os.getenv returned falsy: {repr(raw)}"
            print(f"    {v:30s} -> {reason}")

        print(f"""
  CONCLUSION:
    The .env file at {abs_path} has the R2 keys defined
    but with EMPTY values (e.g., 'R2_ACCOUNT_ID=').

    load_dotenv() correctly loads them into os.environ as empty strings "".
    StorageService.__init__() calls os.getenv() which returns "".
    Python's bool("") is False, so all([...]) evaluates to False.
    Therefore: use_simulator = True.

  FIX:
    Populate the R2 variables with actual Cloudflare R2 credentials:

      R2_ACCOUNT_ID=<your-cloudflare-account-id>
      R2_ACCESS_KEY_ID=<your-r2-api-token-access-key>
      R2_SECRET_ACCESS_KEY=<your-r2-api-token-secret>
      R2_BUCKET_NAME=<your-bucket-name>
      R2_PUBLIC_URL=https://<your-domain>.r2.dev

    Then restart the backend server.
""")
    else:
        print("  All R2 variables are populated. StorageService should use LIVE R2 mode.")

    print("=" * 70)
    print("  DIAGNOSTIC COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
