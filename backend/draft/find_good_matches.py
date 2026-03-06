"""Find matches that have real rolling/H2H/ELO data for testing."""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

s = get_settings()
db = SupabaseREST(s.SUPABASE_URL, s.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")

# Find a football match with rolling data
print("=== FOOTBALL: Finding match with rolling data ===")
roll = db.select_raw("football_team_rolling", "select=team_id,date&limit=1&order=date.desc")
if roll:
    team_id = roll[0]["team_id"]
    print(f"   Team {team_id} has rolling data (date: {roll[0]['date']})")
    # Find a finished match for this team
    matches = db.select_raw("football_matches", 
        f"select=id,api_id,home_team_id,away_team_id,date_time,status&status=eq.finished&home_team_id=eq.{team_id}&limit=1&order=date_time.desc")
    if not matches:
        matches = db.select_raw("football_matches",
            f"select=id,api_id,home_team_id,away_team_id,date_time,status&status=eq.finished&away_team_id=eq.{team_id}&limit=1&order=date_time.desc")
    if matches:
        print(f"   -> Match: id={matches[0]['id']}, api_id={matches[0]['api_id']}, date={matches[0]['date_time']}")
    else:
        print("   -> No finished match found for this team")
else:
    print("   No rolling data found at all!")

print()

# Find a basketball match with rolling data
print("=== BASKETBALL: Finding match with rolling data ===")
roll_b = db.select_raw("basketball_team_rolling", "select=team_id,date&limit=1&order=date.desc")
if roll_b:
    team_id_b = roll_b[0]["team_id"]
    print(f"   Team {team_id_b} has rolling data (date: {roll_b[0]['date']})")
    matches_b = db.select_raw("basketball_matches",
        f"select=id,api_id,home_team_id,away_team_id,date_time,status&status=eq.finished&home_team_id=eq.{team_id_b}&limit=1&order=date_time.desc")
    if not matches_b:
        matches_b = db.select_raw("basketball_matches",
            f"select=id,api_id,home_team_id,away_team_id,date_time,status&status=eq.finished&away_team_id=eq.{team_id_b}&limit=1&order=date_time.desc")
    if matches_b:
        print(f"   -> Match: id={matches_b[0]['id']}, api_id={matches_b[0]['api_id']}, date={matches_b[0]['date_time']}")
    else:
        print("   -> No finished match found for this team")
else:
    print("   No rolling data found at all!")

print()

# Check H2H counts
print("=== H2H COUNTS ===")
fh = db.select_raw("football_h2h", "select=team_a_id&limit=1")
print(f"   Football H2H rows: {'Yes' if fh else 'None'}")
bh = db.select_raw("basketball_h2h", "select=team_a_id&limit=1")
print(f"   Basketball H2H rows: {'Yes' if bh else 'None'}")

print()

# Check ELO counts
print("=== ELO COUNTS ===")
fe = db.select_raw("football_team_elo", "select=team_id&limit=1")
print(f"   Football ELO rows: {'Yes' if fe else 'None'}")
be = db.select_raw("basketball_team_elo", "select=team_id&limit=1")
print(f"   Basketball ELO rows: {'Yes' if be else 'None'}")

# Tennis match with rolling
print()
print("=== TENNIS: Finding match with rolling data ===")
tr = db.select_raw("tennis_player_rolling", "select=player_id,date,surface&limit=1&order=date.desc")
if tr:
    pid = tr[0]["player_id"]
    print(f"   Player {pid} has rolling data (date: {tr[0]['date']}, surface: {tr[0]['surface']})")
    tm = db.select_raw("tennis_matches",
        f"select=id,api_id,player1_id,player2_id,date_time,surface,status&status=eq.finished&player1_id=eq.{pid}&limit=1&order=date_time.desc")
    if not tm:
        tm = db.select_raw("tennis_matches",
            f"select=id,api_id,player1_id,player2_id,date_time,surface,status&status=eq.finished&player2_id=eq.{pid}&limit=1&order=date_time.desc")
    if tm:
        print(f"   -> Match: id={tm[0]['id']}, api_id={tm[0]['api_id']}, date={tm[0]['date_time']}, surface={tm[0].get('surface')}")
